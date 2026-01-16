use std::sync::{Arc, LazyLock, Mutex};

use anyhow::Result;
use napi::Status;
use napi::threadsafe_function::{
    ThreadsafeFunction, ThreadsafeFunctionCallMode, UnknownReturnValue,
};
use napi_derive::napi;
use tokio::runtime::Runtime;
use tokio::task::JoinHandle;
use tracing::{debug, error, info, instrument, warn};

#[cfg(windows)]
use windows::{
    Foundation::{TimeSpan, TypedEventHandler},
    Media::Playback::MediaPlayer,
    Media::{
        MediaPlaybackAutoRepeatMode, MediaPlaybackStatus, MediaPlaybackType,
        PlaybackPositionChangeRequestedEventArgs, SystemMediaTransportControls,
        SystemMediaTransportControlsButton, SystemMediaTransportControlsButtonPressedEventArgs,
        SystemMediaTransportControlsTimelineProperties,
    },
    Storage::Streams::{DataWriter, InMemoryRandomAccessStream, RandomAccessStreamReference},
    core::{HSTRING, Ref},
};

use crate::model::{MetadataPayload, PlaybackStatus, RepeatMode};

#[napi]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SmtcEventType {
    Play,
    Pause,
    Stop,
    NextSong,
    PreviousSong,
    ToggleShuffle,
    ToggleRepeat,
    Seek,
}

#[napi(object)]
#[derive(Clone, Debug)]
pub struct SmtcEvent {
    pub type_: SmtcEventType,
    pub position_ms: Option<f64>,
}

pub type SmtcThreadsafeFunction =
    ThreadsafeFunction<SmtcEvent, UnknownReturnValue, SmtcEvent, Status, false>;

// ==================================================================================
//
// Windows Implementation
//
// ==================================================================================

#[cfg(windows)]
mod windows_impl {
    use super::{
        Arc, DataWriter, HSTRING, InMemoryRandomAccessStream, JoinHandle, LazyLock,
        MediaPlaybackAutoRepeatMode, MediaPlaybackStatus, MediaPlaybackType, MediaPlayer,
        MetadataPayload, Mutex, PlaybackPositionChangeRequestedEventArgs, PlaybackStatus,
        RandomAccessStreamReference, Ref, RepeatMode, Result, Runtime, SmtcEvent, SmtcEventType,
        SmtcThreadsafeFunction, SystemMediaTransportControls, SystemMediaTransportControlsButton,
        SystemMediaTransportControlsButtonPressedEventArgs,
        SystemMediaTransportControlsTimelineProperties, ThreadsafeFunctionCallMode, TimeSpan,
        TypedEventHandler, debug, error, info, instrument, warn,
    };

    const HNS_PER_MILLISECOND: f64 = 10_000.0;

    static TOKIO_RUNTIME: LazyLock<Runtime> =
        LazyLock::new(|| Runtime::new().expect("创建 Tokio 运行时失败"));

    impl SmtcEvent {
        const fn new(t: SmtcEventType) -> Self {
            Self {
                type_: t,
                position_ms: None,
            }
        }
        const fn seek(pos: f64) -> Self {
            Self {
                type_: SmtcEventType::Seek,
                position_ms: Some(pos),
            }
        }
    }

    struct SmtcHandlerTokens {
        button_pressed: i64,
        shuffle_changed: i64,
        repeat_changed: i64,
        seek_requested: i64,
    }

    struct SmtcContext {
        player: MediaPlayer,
        tokens: SmtcHandlerTokens,
        callback: Option<Arc<SmtcThreadsafeFunction>>,
        cover_task: Option<JoinHandle<()>>,
        is_enabled: bool,
    }

    impl SmtcContext {
        fn smtc(&self) -> Result<SystemMediaTransportControls> {
            Ok(self.player.SystemMediaTransportControls()?)
        }

        fn remove_handlers(&self) -> Result<()> {
            let smtc = self.smtc()?;
            smtc.RemoveButtonPressed(self.tokens.button_pressed)?;
            smtc.RemoveShuffleEnabledChangeRequested(self.tokens.shuffle_changed)?;
            smtc.RemoveAutoRepeatModeChangeRequested(self.tokens.repeat_changed)?;
            smtc.RemovePlaybackPositionChangeRequested(self.tokens.seek_requested)?;
            Ok(())
        }
    }

    impl Drop for SmtcContext {
        fn drop(&mut self) {
            if let Some(handle) = self.cover_task.take() {
                handle.abort();
            }

            if let Err(e) = self.remove_handlers() {
                warn!("销毁 SmtcContext 时移除处理器失败: {e:?}");
            }

            if let Ok(smtc) = self.smtc() {
                let _ = smtc.SetIsEnabled(false);
            }
        }
    }

    static SMTC_CONTEXT: LazyLock<Mutex<Option<SmtcContext>>> = LazyLock::new(|| Mutex::new(None));

    pub fn register_event_callback(tsfn: SmtcThreadsafeFunction) {
        match SMTC_CONTEXT.lock() {
            Ok(mut guard) => {
                if let Some(ctx) = guard.as_mut() {
                    ctx.callback = Some(Arc::new(tsfn));
                    debug!("SMTC 事件回调已成功注册");
                } else {
                    warn!("尝试注册回调，但 SMTC 未初始化");
                }
            }
            Err(e) => error!("注册回调时锁中毒: {e:?}"),
        }
    }

    #[instrument]
    fn dispatch_event(event: SmtcEvent) {
        debug!(type_ = ?event.type_, "分发 SMTC 事件");

        let maybe_callback: Option<Arc<SmtcThreadsafeFunction>> = SMTC_CONTEXT.lock().map_or_else(
            |_| {
                error!("SMTC 事件回调锁中毒");
                None
            },
            |guard| guard.as_ref().and_then(|ctx| ctx.callback.clone()),
        );

        if let Some(tsfn) = maybe_callback {
            let status = tsfn.call(event, ThreadsafeFunctionCallMode::NonBlocking);
            if status != napi::Status::Ok {
                error!("调用 JS 回调失败, status: {:?}", status);
            }
        } else {
            warn!("无法分发 SMTC 事件，因为没有注册回调函数");
        }
    }

    #[instrument]
    pub fn initialize() -> Result<()> {
        info!("正在初始化 SMTC...");

        let player = MediaPlayer::new()?;
        let smtc = player.SystemMediaTransportControls()?;

        smtc.SetIsEnabled(false)?;
        smtc.SetIsPlayEnabled(true)?;
        smtc.SetIsPauseEnabled(true)?;
        smtc.SetIsStopEnabled(true)?;
        smtc.SetIsNextEnabled(true)?;
        smtc.SetIsPreviousEnabled(true)?;
        debug!("已启用各个 SMTC 控制能力");

        let handler = TypedEventHandler::new(
            move |_sender: Ref<SystemMediaTransportControls>,
                  args: Ref<SystemMediaTransportControlsButtonPressedEventArgs>|
                  -> windows::core::Result<()> {
                if let Some(args) = args.as_ref() {
                    let button = args.Button()?;
                    debug!(?button, "SMTC 按钮被按下");
                    let event = match button {
                        SystemMediaTransportControlsButton::Play => {
                            Some(SmtcEvent::new(SmtcEventType::Play))
                        }
                        SystemMediaTransportControlsButton::Pause => {
                            Some(SmtcEvent::new(SmtcEventType::Pause))
                        }
                        SystemMediaTransportControlsButton::Stop => {
                            Some(SmtcEvent::new(SmtcEventType::Stop))
                        }
                        SystemMediaTransportControlsButton::Next => {
                            Some(SmtcEvent::new(SmtcEventType::NextSong))
                        }
                        SystemMediaTransportControlsButton::Previous => {
                            Some(SmtcEvent::new(SmtcEventType::PreviousSong))
                        }
                        _ => None,
                    };
                    if let Some(e) = event {
                        dispatch_event(e);
                    }
                }
                Ok(())
            },
        );
        let button_pressed = smtc.ButtonPressed(&handler)?;

        let shuffle_handler = TypedEventHandler::new(move |_, _| {
            debug!("SMTC 请求切换随机播放模式");
            dispatch_event(SmtcEvent::new(SmtcEventType::ToggleShuffle));
            Ok(())
        });
        let shuffle_changed = smtc.ShuffleEnabledChangeRequested(&shuffle_handler)?;

        let repeat_handler = TypedEventHandler::new(move |_, _| {
            debug!("SMTC 请求切换重复播放模式");
            dispatch_event(SmtcEvent::new(SmtcEventType::ToggleRepeat));
            Ok(())
        });
        let repeat_changed = smtc.AutoRepeatModeChangeRequested(&repeat_handler)?;

        let seek_handler = TypedEventHandler::new(
            move |_,
                  args: Ref<PlaybackPositionChangeRequestedEventArgs>|
                  -> windows::core::Result<()> {
                if let Some(args) = args.as_ref() {
                    let position = args.RequestedPlaybackPosition()?;
                    let position_ms = (position.Duration as f64) / HNS_PER_MILLISECOND;
                    debug!(position_ms, "SMTC 请求跳转播放位置");
                    dispatch_event(SmtcEvent::seek(position_ms));
                }
                Ok(())
            },
        );
        let seek_requested = smtc.PlaybackPositionChangeRequested(&seek_handler)?;

        debug!("SMTC 事件处理器已全部附加");

        let context = SmtcContext {
            player,
            tokens: SmtcHandlerTokens {
                button_pressed,
                shuffle_changed,
                repeat_changed,
                seek_requested,
            },
            callback: None,
            cover_task: None,
            is_enabled: false,
        };
        if let Ok(mut guard) = SMTC_CONTEXT.lock() {
            *guard = Some(context);
        }

        debug!("SMTC 已初始化");
        Ok(())
    }

    #[instrument]
    pub fn shutdown() {
        if let Ok(mut guard) = SMTC_CONTEXT.lock() {
            *guard = None;
        }

        debug!("SMTC 已关闭");
    }

    fn with_smtc_ctx<F>(action_name: &str, f: F) -> Result<()>
    where
        F: FnOnce(&mut SmtcContext) -> Result<()>,
    {
        let mut guard = SMTC_CONTEXT
            .lock()
            .map_err(|e| anyhow::anyhow!("获取 SMTC 锁失败 ({action_name}): {e}"))?;

        guard.as_mut().map_or_else(
            || {
                warn!("尝试执行 {action_name}，但 SMTCContext 未初始化");
                Ok(())
            },
            f,
        )
    }

    #[instrument]
    pub fn update_play_state(status: PlaybackStatus) {
        let win_status = match status {
            PlaybackStatus::Playing => MediaPlaybackStatus::Playing,
            PlaybackStatus::Paused => MediaPlaybackStatus::Paused,
        };
        debug!(new_status = ?status, "正在更新 SMTC 播放状态");

        TOKIO_RUNTIME.spawn(async move {
            let result = with_smtc_ctx("更新播放状态", |ctx| {
                if !ctx.is_enabled {
                    return Ok(());
                }
                let smtc = ctx.smtc()?;
                smtc.SetPlaybackStatus(win_status)?;
                debug!("更新 SMTC 播放状态成功");
                Ok(())
            });
            if let Err(e) = result {
                error!("更新播放状态失败: {e:?}");
            }
        });
    }

    #[instrument]
    pub fn update_timeline(current_ms: f64, total_ms: f64) {
        TOKIO_RUNTIME.spawn(async move {
            let result = (|| -> Result<()> {
                let props = SystemMediaTransportControlsTimelineProperties::new()?;
                props.SetStartTime(TimeSpan { Duration: 0 })?;
                props.SetPosition(TimeSpan {
                    Duration: (current_ms * HNS_PER_MILLISECOND) as i64,
                })?;
                props.SetEndTime(TimeSpan {
                    Duration: (total_ms * HNS_PER_MILLISECOND) as i64,
                })?;

                with_smtc_ctx("更新时间线", |ctx| {
                    if ctx.is_enabled {
                        ctx.smtc()?.UpdateTimelineProperties(&props)?;
                    }
                    Ok(())
                })
            })();

            if let Err(e) = result {
                error!("更新时间线失败: {e:?}");
            }
        });
    }

    #[instrument]
    pub fn update_play_mode(is_shuffling: bool, repeat_mode: RepeatMode) {
        let repeat_mode_clone = repeat_mode;

        debug!(is_shuffling, ?repeat_mode, "正在更新 SMTC 播放模式");

        TOKIO_RUNTIME.spawn(async move {
            let result = with_smtc_ctx("更新播放模式", |ctx| {
                if !ctx.is_enabled {
                    return Ok(());
                }
                let smtc = ctx.smtc()?;
                smtc.SetShuffleEnabled(is_shuffling)?;

                let repeat_mode_win = match repeat_mode_clone {
                    RepeatMode::Track => MediaPlaybackAutoRepeatMode::Track,
                    RepeatMode::List => MediaPlaybackAutoRepeatMode::List,
                    RepeatMode::None => MediaPlaybackAutoRepeatMode::None,
                };
                smtc.SetAutoRepeatMode(repeat_mode_win)?;
                debug!("更新 SMTC 播放模式成功");
                Ok(())
            });

            if let Err(e) = result {
                error!("更新播放模式失败: {e:?}");
            }
        });
    }

    async fn get_cover_stream_ref(
        cover_data: Option<Vec<u8>>,
    ) -> Option<RandomAccessStreamReference> {
        let bytes = cover_data?;

        let stream_result: windows::core::Result<RandomAccessStreamReference> = (async {
            let stream = InMemoryRandomAccessStream::new()?;
            let writer = DataWriter::CreateDataWriter(&stream)?;
            writer.WriteBytes(&bytes)?;
            writer.StoreAsync()?.await?;
            writer.DetachStream()?;
            stream.Seek(0)?;
            RandomAccessStreamReference::CreateFromStream(&stream)
        })
        .await;

        match stream_result {
            Ok(stream_ref) => Some(stream_ref),
            Err(e) => {
                error!("创建封面内存流失败: {e:?}");
                None
            }
        }
    }

    #[instrument]
    pub fn update_metadata(payload: MetadataPayload) {
        let Ok(mut guard) = SMTC_CONTEXT.lock() else {
            error!("SmtcContext 锁中毒");
            return;
        };

        let Some(ctx) = guard.as_mut() else {
            return;
        };

        if !ctx.is_enabled {
            return;
        }

        if let Some(old_handle) = ctx.cover_task.take() {
            old_handle.abort();
        }

        debug!(
            title = %payload.song_name,
            artist = %payload.author_name,
            album = %payload.album_name,
            ncm_id = ?payload.ncm_id,
            "正在更新 SMTC 歌曲元数据"
        );

        let song_name = payload.song_name.clone();
        let author_name = payload.author_name.clone();
        let album_name = payload.album_name.clone();
        let ncm_id = payload.ncm_id;
        let cover_data = payload.cover_data;

        let new_handle = TOKIO_RUNTIME.spawn(async move {
            let thumbnail_stream_ref = get_cover_stream_ref(cover_data).await;

            let result = with_smtc_ctx("更新元数据", |inner_ctx| {
                if !inner_ctx.is_enabled {
                    return Ok(());
                }

                let smtc = inner_ctx.smtc()?;
                let updater = smtc.DisplayUpdater()?;
                updater.SetType(MediaPlaybackType::Music)?;

                let props = updater.MusicProperties()?;
                props.SetTitle(&HSTRING::from(&song_name))?;
                props.SetArtist(&HSTRING::from(&author_name))?;
                props.SetAlbumTitle(&HSTRING::from(&album_name))?;

                let genres_collection = props.Genres()?;
                genres_collection.Clear()?;

                if let Some(id) = ncm_id
                    && id > 0
                {
                    genres_collection.Append(&HSTRING::from(format!("NCM-{id}")))?;
                }

                if let Some(stream_ref) = thumbnail_stream_ref.as_ref() {
                    updater.SetThumbnail(stream_ref)?;
                } else {
                    updater.SetThumbnail(None)?;
                    debug!("SMTC 封面已清空");
                }

                updater.Update()?;
                Ok(())
            });

            if let Err(e) = result {
                error!("更新SMTC元数据失败: {e:?}");
            }
        });

        ctx.cover_task = Some(new_handle);
    }

    pub fn enable_smtc() -> Result<()> {
        with_smtc_ctx("启用 SMTC", |ctx| {
            ctx.is_enabled = true;
            Ok(ctx.smtc()?.SetIsEnabled(true)?)
        })
    }

    pub fn disable_smtc() -> Result<()> {
        with_smtc_ctx("禁用 SMTC", |ctx| {
            ctx.is_enabled = false;
            Ok(ctx.smtc()?.SetIsEnabled(false)?)
        })
    }
}

// ==================================================================================
//
// Non-Windows Implementation
//
// ==================================================================================

#[cfg(not(windows))]
mod non_windows_impl {
    use super::*;

    #[allow(unused_variables)]
    pub fn register_event_callback(tsfn: SmtcThreadsafeFunction) {
        // No-op
    }

    pub fn initialize() -> Result<()> {
        info!("非 Windows 平台，跳过 SMTC 初始化");
        Ok(())
    }

    pub fn shutdown() {
        // No-op
    }

    #[allow(unused_variables)]
    pub fn update_play_state(status: PlaybackStatus) {
        // No-op
    }

    #[allow(unused_variables)]
    pub fn update_timeline(current_ms: f64, total_ms: f64) {
        // No-op
    }

    #[allow(unused_variables)]
    pub fn update_play_mode(is_shuffling: bool, repeat_mode: RepeatMode) {
        // No-op
    }

    #[allow(unused_variables)]
    pub fn update_metadata(payload: MetadataPayload) {
        // No-op
    }

    pub fn enable_smtc() -> Result<()> {
        Ok(())
    }

    pub fn disable_smtc() -> Result<()> {
        Ok(())
    }
}

// Re-export implementations
#[cfg(not(windows))]
pub use non_windows_impl::*;
#[cfg(windows)]
pub use windows_impl::*;

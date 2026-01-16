#![deny(missing_docs)]

//! 一个 Electron 的原生插件，用于将播放信息同步到 SMTC 和/或 Discord RPC

use napi::Result;
use napi::bindgen_prelude::{Function, Unknown};
use napi::threadsafe_function::UnknownReturnValue;
use napi_derive::napi;

mod logger;
mod model;
mod smtc_core;

use model::{MetadataPayload, PlayModePayload, PlayStatePayload, TimelinePayload};
use smtc_core::SmtcEvent;

use crate::model::MetadataParam;

/// 初始化插件
///
/// ### 参数
///
/// * `log_dir` - 要把日志文件保存到的路径
///
/// ### Errors
///
/// 可能会在日志初始化失败，或者 SMTC 初始化失败时 (一般都是系统版本过低的原因) 抛出错误
///
/// ### 备注
///
/// 如果其他 Windows API 调用失败，则只会打印日志并静默失败
#[napi]
pub fn initialize(log_dir: String) -> Result<()> {
    logger::init(log_dir).map_err(|e| napi::Error::from_reason(e.to_string()))?;

    smtc_core::initialize().map_err(|e| napi::Error::from_reason(e.to_string()))?;

    Ok(())
}

/// 关闭插件，清理资源
#[napi]
pub fn shutdown() {
    smtc_core::shutdown();
}

/// 启用 SMTC
///
/// ### Errors
///
/// 会在调用 Windows API 失败时抛出错误，一般都是系统版本过低的原因
#[napi]
pub fn enable_smtc() -> Result<()> {
    smtc_core::enable_smtc().map_err(|e| napi::Error::from_reason(e.to_string()))
}

/// 禁用 SMTC
///
/// ### Errors
///
/// 会在调用 Windows API 失败时抛出错误，一般都是系统版本过低的原因
#[napi]
pub fn disable_smtc() -> Result<()> {
    smtc_core::disable_smtc().map_err(|e| napi::Error::from_reason(e.to_string()))
}

/// 注册 SMTC 事件回调 (上一首、下一首、暂停、播放等)
///
/// ### 参数
///
/// `(event: SmtcEvent) => void`
///
/// ### Errors
///
/// 如果 N-API 创建线程安全函数失败，会抛出错误。通常不应该发生，除非 JS 环境已经销毁了
#[napi(ts_args_type = "callback: (arg: SmtcEvent) => void")]
#[allow(clippy::needless_pass_by_value)]
pub fn register_event_handler(
    callback: Function<Unknown<'static>, UnknownReturnValue>,
) -> Result<()> {
    let tsfn = callback
        .build_threadsafe_function::<SmtcEvent>()
        .build_callback(|ctx| Ok(ctx.value))?;

    smtc_core::register_event_callback(tsfn);
    Ok(())
}

/// 更新歌曲元数据
///
/// 同时也会更新 Discord 的元数据 (如果启用了 Discord RPC)
///
/// ### 备注
///
/// 更新 Discord RPC 的元数据时，必须提供 `original_cover_url`
#[napi]
pub fn update_metadata(payload: MetadataParam) {
    let internal_payload = MetadataPayload::from(payload);

    smtc_core::update_metadata(internal_payload);
}

/// 更新播放状态 (播放/暂停)
///
/// 同时也会更新 Discord 的播放状态 (如果启用了 Discord RPC)
#[napi]
pub fn update_play_state(payload: PlayStatePayload) {
    smtc_core::update_play_state(payload.status);
}

/// 更新进度信息
///
/// 同时也会更新 Discord 的进度信息 (如果启用了 Discord RPC)
///
/// ### 备注
///
/// Discord RPC 实现的进度更新有节流，调用此函数无需担心 Discord RPC 的速率限制
#[napi]
pub fn update_timeline(payload: TimelinePayload) {
    smtc_core::update_timeline(payload.current_time, payload.total_time);
}

/// 更新播放模式
///
/// ### 备注
///
/// 只会更新 SMTC 的信息
#[napi]
pub fn update_play_mode(payload: PlayModePayload) {
    smtc_core::update_play_mode(payload.is_shuffling, payload.repeat_mode);
}

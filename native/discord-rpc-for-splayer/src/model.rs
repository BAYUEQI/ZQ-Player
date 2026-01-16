use napi_derive::napi;

/// Discord 显示模式枚举
/// 控制 Discord 左下角 "正在听 - XXX" 的显示内容
#[napi]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DiscordDisplayMode {
    /// 仅歌曲名：显示为 "正在听 {歌曲名}"
    Name = 0,
    /// 仅播放状态：显示为 "正在听 `ZQ-Player`"
    State = 1,
    /// 完整信息：显示为 "正在听 {歌曲名} - {歌手}"
    Details = 2,
}

/// Discord 元数据参数
#[napi(object)]
#[derive(Debug, Clone)]
pub struct DiscordMetadataParam {
    /// 歌曲名称
    pub song_name: String,
    /// 艺术家/作者名称
    pub author_name: String,
    /// 专辑名称
    pub album_name: String,
    /// `HTTP URL` 用于封面显示
    pub original_cover_url: Option<String>,
    /// 歌曲时长（毫秒）
    pub duration: Option<f64>,
    /// 网易云音乐 ID，用于生成链接
    pub ncm_id: Option<i64>,
}

/// Discord 播放状态参数
#[napi(object)]
#[derive(Debug, Clone)]
pub struct DiscordPlayStateParam {
    /// `"Playing"` 或 `"Paused"`
    pub status: String,
}

/// Discord 时间轴参数
#[napi(object)]
#[derive(Debug, Clone, Copy)]
pub struct DiscordTimelineParam {
    /// 当前播放时间（毫秒）
    pub current_time: f64,
    /// 总时长（毫秒）
    pub total_time: f64,
}

/// Discord 配置参数
#[napi(object)]
#[derive(Debug, Clone)]
pub struct DiscordConfigPayload {
    /// 暂停时是否显示
    pub show_when_paused: bool,
    /// 显示模式
    pub display_mode: Option<DiscordDisplayMode>,
}

/// 内部使用的元数据载荷
#[derive(Debug, Clone)]
pub struct MetadataPayload {
    /// 歌曲名称
    pub song_name: String,
    /// 艺术家/作者名称  
    pub author_name: String,
    /// 专辑名称
    pub album_name: String,
    /// 原始封面 URL
    pub original_cover_url: Option<String>,
    /// 网易云音乐 ID
    pub ncm_id: Option<i64>,
    /// 歌曲时长（毫秒）
    pub duration: Option<f64>,
}

impl From<DiscordMetadataParam> for MetadataPayload {
    fn from(param: DiscordMetadataParam) -> Self {
        Self {
            song_name: param.song_name,
            author_name: param.author_name,
            album_name: param.album_name,
            original_cover_url: param.original_cover_url,
            ncm_id: param.ncm_id,
            duration: param.duration,
        }
    }
}

/// 内部使用的播放状态
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PlaybackStatus {
    Playing,
    Paused,
}

impl From<String> for PlaybackStatus {
    fn from(status: String) -> Self {
        match status.as_str() {
            "Playing" => Self::Playing,
            _ => Self::Paused,
        }
    }
}

/// 内部使用的时间轴载荷
#[derive(Debug, Clone, Copy)]
#[allow(dead_code)]
pub struct TimelinePayload {
    /// 当前播放时间（毫秒）
    pub current_time: f64,
    /// 总时长（毫秒）
    pub total_time: f64,
}

impl From<DiscordTimelineParam> for TimelinePayload {
    fn from(param: DiscordTimelineParam) -> Self {
        Self {
            current_time: param.current_time,
            total_time: param.total_time,
        }
    }
}

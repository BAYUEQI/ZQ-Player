use std::fmt;

use napi::bindgen_prelude::Buffer;
use napi_derive::napi;

#[derive(Clone)]
pub struct MetadataPayload {
    pub song_name: String,
    pub author_name: String,
    pub album_name: String,

    pub cover_data: Option<Vec<u8>>,

    pub ncm_id: Option<i64>,
}

impl fmt::Debug for MetadataPayload {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("MetadataPayload")
            .field("song_name", &self.song_name)
            .field("author_name", &self.author_name)
            .field("album_name", &self.album_name)
            .field(
                "cover_data",
                &self.cover_data.as_ref().map_or_else(
                    || "None".to_string(),
                    |bytes| format!("Some({} bytes)", bytes.len()),
                ),
            )
            .field("ncm_id", &self.ncm_id)
            .finish()
    }
}

#[napi(object)]
pub struct MetadataParam {
    pub song_name: String,
    pub author_name: String,
    pub album_name: String,

    /// 只用于 SMTC 更新
    pub cover_data: Option<Buffer>,

    /// 会以 "NCM-{ID}" 的格式上传到 SMTC 的 “流派” 字段
    pub ncm_id: Option<i64>,
}

impl From<MetadataParam> for MetadataPayload {
    fn from(param: MetadataParam) -> Self {
        Self {
            song_name: param.song_name,
            author_name: param.author_name,
            album_name: param.album_name,
            cover_data: param.cover_data.map(|b| b.to_vec()),
            ncm_id: param.ncm_id,
        }
    }
}

#[napi]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PlaybackStatus {
    Playing,
    Paused,
}

#[napi]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RepeatMode {
    None,
    Track,
    List,
}

#[napi(object)]
#[derive(Debug, Clone, Copy)]
pub struct PlayStatePayload {
    pub status: PlaybackStatus,
}

#[napi(object)]
#[derive(Debug, Clone, Copy)]
pub struct TimelinePayload {
    /// 单位是毫秒
    pub current_time: f64,

    /// 单位是毫秒
    pub total_time: f64,
}

#[napi(object)]
#[derive(Debug, Clone, Copy)]
pub struct PlayModePayload {
    pub is_shuffling: bool,
    pub repeat_mode: RepeatMode,
}

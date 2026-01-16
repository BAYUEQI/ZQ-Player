#![deny(missing_docs)]

//! Discord Rich Presence 原生模块
//!
//! 提供跨平台的 Discord RPC 功能，通过后台线程管理 Discord IPC 连接

use napi::Result;
use napi_derive::napi;

mod discord_core;
mod model;

pub use model::{
    DiscordConfigPayload, DiscordDisplayMode, DiscordMetadataParam, DiscordPlayStateParam,
    DiscordTimelineParam,
};

/// 初始化 Discord RPC 模块
///
/// 启动后台线程处理 Discord IPC 通信
/// # Errors
///
/// Returns an error if the background thread cannot be spawned.
#[napi]
pub fn initialize() -> Result<()> {
    discord_core::init();
    Ok(())
}

/// 关闭 Discord RPC 模块
///
/// 停止后台线程并断开 Discord 连接
#[napi]
pub fn shutdown() {
    discord_core::shutdown();
}

/// 启用 Discord RPC
///
/// 开始尝试连接 Discord 客户端并显示 Rich Presence
#[napi]
pub fn enable() {
    discord_core::enable();
}

/// 禁用 Discord RPC
///
/// 断开 Discord 连接并清除 Rich Presence 显示
#[napi]
pub fn disable() {
    discord_core::disable();
}

/// 更新 Discord RPC 元数据
///
/// ### 参数
///
/// * `payload` - 包含歌曲信息的元数据
#[napi]
pub fn update_metadata(payload: DiscordMetadataParam) {
    let internal_payload = model::MetadataPayload::from(payload);
    discord_core::update_metadata(internal_payload);
}

/// 更新 Discord RPC 播放状态
///
/// ### 参数
///
/// * `payload` - 包含播放状态的参数 ("Playing" or "Paused")
#[napi]
pub fn update_play_state(payload: DiscordPlayStateParam) {
    let status = model::PlaybackStatus::from(payload.status);
    discord_core::update_play_state(status);
}

/// 更新 Discord RPC 时间轴
///
/// ### 参数
///
/// * `payload` - 包含当前播放时间和总时长的参数
#[napi]
pub fn update_timeline(payload: DiscordTimelineParam) {
    let internal_payload = model::TimelinePayload::from(payload);
    discord_core::update_timeline(internal_payload);
}

/// 更新 Discord RPC 配置
///
/// ### 参数
///
/// * `payload` - 包含配置选项的参数
#[napi]
pub fn update_config(payload: DiscordConfigPayload) {
    discord_core::update_config(payload);
}

import { useSettingStore } from "@/stores/setting";
import type { MediaMetadataParam, MediaPlaybackStatus, MediaPlayModeParam } from "@/types/global";
import { PlayModePayload, RepeatModeType, ShuffleModeType } from "@/types/shared";
import { isElectron } from "@/utils/env";
import { getPlaySongData } from "@/utils/format";
import { throttle } from "lodash-es";

/**
 * 发送播放状态
 * @param isPlaying 是否播放
 */
export const sendPlayStatus = (isPlaying: boolean) => {
  if (isElectron) window.electron.ipcRenderer.send("play-status-change", isPlaying);
};

/**
 * 发送歌曲信息
 * @param title 歌曲标题
 * @param name 歌曲名称
 * @param artist 歌手
 * @param album 专辑
 */
export const sendSongChange = (title: string, name: string, artist: string, album: string) => {
  if (!isElectron) return;
  // 获取歌曲时长
  const duration = getPlaySongData()?.duration ?? 0;
  window.electron.ipcRenderer.send("play-song-change", { title, name, artist, album, duration });
  window.electron.ipcRenderer.send("update-desktop-lyric-data", {
    playName: name,
    artistName: artist,
  });
};

/**
 * 发送状态栏进度
 * @param progress 进度
 */
export const sendTaskbarProgress: (progress: number | "none") => void = throttle(
  (progress: number | "none") => {
    if (isElectron) {
      window.electron.ipcRenderer.send("set-bar-progress", progress);
    }
  },
  1000,
);

/**
 * 发送状态栏模式
 * @param mode 模式
 */
export const sendTaskbarMode = (mode: "normal" | "paused" | "error" | "indeterminate") => {
  if (isElectron) {
    window.electron.ipcRenderer.send("set-bar-mode", mode);
  }
};

/**
 * 发送 Socket 实时进度
 */
export const sendSocketProgress: (currentTime: number, duration: number) => void = throttle(
  (currentTime: number, duration: number) => {
    if (isElectron) {
      window.electron.ipcRenderer.send("set-progress", { currentTime, duration });
    }
  },
  500,
);

/**
 * 发送歌词
 * @param data 歌词数据
 */
export const sendLyric: (data: unknown) => void = throttle((data: unknown) => {
  if (isElectron) {
    // 添加发送时间戳，用于桌面歌词端补偿 IPC 传输延迟
    const payload =
      typeof data === "object" && data !== null
        ? { ...data, sendTimestamp: performance.now() }
        : data;
    window.electron.ipcRenderer.send("play-lyric-change", payload);
  }
}, 500);

/**
 * 发送喜欢状态
 * @param isLiked 是否喜欢
 */
export const sendLikeStatus = (isLiked: boolean) => {
  if (isElectron) window.electron.ipcRenderer.send("like-status-change", isLiked);
};

/**
 * 发送桌面歌词开关
 * @param show 是否显示
 */
export const toggleDesktopLyric = (show: boolean) => {
  if (isElectron) window.electron.ipcRenderer.send("toggle-desktop-lyric", show);
};

/**
 * 发送播放模式给托盘
 * @param repeatMode 循环模式 ('off' | 'list' | 'one')
 * @param shuffleMode 随机/心动模式 ('off' | 'on' | 'heartbeat')
 */
export const sendPlayMode = (repeatMode: RepeatModeType, shuffleMode: ShuffleModeType) => {
  if (isElectron) {
    const payload: PlayModePayload = { repeatMode, shuffleMode };
    window.electron.ipcRenderer.send("play-mode-change", payload);
  }
};

///////////////////////////////////////////
//
// 统一媒体集成接口
//
///////////////////////////////////////////

/**
 * 发送统一的媒体元数据
 * 会自动派发到 SMTC (Windows)、MPRIS (Linux) 和 Discord RPC
 */
export const sendMediaMetadata = (payload: MediaMetadataParam) => {
  if (isElectron) window.electron.ipcRenderer.send("media-update-metadata", payload);
};

/**
 * 发送统一的播放状态
 * 会自动派发到 SMTC (Windows)、MPRIS (Linux) 和 Discord RPC
 */
export const sendMediaPlayState = (status: MediaPlaybackStatus) => {
  if (isElectron) window.electron.ipcRenderer.send("media-update-play-state", { status });
};

/**
 * 发送统一的进度信息
 * 会自动派发到 SMTC (Windows)、MPRIS (Linux) 和 Discord RPC
 */
export const sendMediaTimeline: (currentTime: number, totalTime: number) => void = throttle(
  (currentTime: number, totalTime: number) => {
    if (isElectron) {
      window.electron.ipcRenderer.send("media-update-timeline", { currentTime, totalTime });
    }
  },
  1000,
);

/**
 * 发送统一的播放模式
 * 会自动派发到 SMTC (Windows) 和 MPRIS (Linux)
 */
export const sendMediaPlayMode = (shuffle: boolean, repeat: "off" | "one" | "list") => {
  if (isElectron) {
    const payload: MediaPlayModeParam = { shuffle, repeat };
    window.electron.ipcRenderer.send("media-update-play-mode", payload);
  }
};

/**
 * 发送音量到 MPRIS (Linux only)
 */
export const sendMediaVolume = (volume: number) => {
  if (isElectron) window.electron.ipcRenderer.send("media-update-volume", { volume });
};

///////////////////////////////////////////
//
// Discord RPC
//
///////////////////////////////////////////

/**
 * 启用 Discord RPC
 */
export const enableDiscordRpc = () => {
  if (isElectron) {
    window.electron.ipcRenderer.send("discord-enable");
    // 立即发送当前配置，确保 Rust 模块使用正确的设置
    const settingStore = useSettingStore();
    // 转换字符串 displayMode 为数字枚举
    const displayModeMap = { name: 0, state: 1, details: 2 } as const;
    window.electron.ipcRenderer.send("discord-update-config", {
      showWhenPaused: settingStore.discordRpc.showWhenPaused,
      displayMode: displayModeMap[settingStore.discordRpc.displayMode],
    });
  }
};

/**
 * 禁用 Discord RPC
 */
export const disableDiscordRpc = () => {
  if (isElectron) window.electron.ipcRenderer.send("discord-disable");
};

/**
 * 更新 Discord RPC 配置
 * @param payload 配置信息
 */
export const updateDiscordConfig = (payload: {
  showWhenPaused: boolean;
  displayMode: "name" | "state" | "details";
}) => {
  if (isElectron) {
    // 转换字符串 displayMode 为数字枚举
    const displayModeMap = { name: 0, state: 1, details: 2 } as const;
    window.electron.ipcRenderer.send("discord-update-config", {
      showWhenPaused: payload.showWhenPaused,
      displayMode: displayModeMap[payload.displayMode],
    });
  }
};

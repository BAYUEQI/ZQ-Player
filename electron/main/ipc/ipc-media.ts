import { ipcMain, app } from "electron";
import { join } from "path";
import type {
  MediaMetadataParam,
  MediaPlaybackStatus,
  MediaTimelineParam,
  MediaPlayModeParam,
  MediaEvent,
  DiscordConfigPayload,
} from "../../../src/types/global";
import { processLog } from "../logger";
import { loadNativeModule } from "../utils/native-loader";
import { isLinux, isWin } from "../utils/config";
import mainWindow from "../windows/main-window";

// 原生模块类型
type NativeSmtcModule = typeof import("@native");
type NativeMprisModule = typeof import("@mpris");
type DiscordRpcModule = typeof import("@discord-rpc");

// 原生模块实例
let nativeSmtc: NativeSmtcModule | null = null;
let nativeMpris: NativeMprisModule | null = null;
let mprisInstance: InstanceType<NativeMprisModule["SPlayerMpris"]> | null = null;
let discordRpc: DiscordRpcModule | null = null;

/**
 * 将统一播放模式转换为各平台格式
 */
const convertRepeatMode = (repeat: "off" | "one" | "list") => {
  if (repeat === "one") return { smtc: 1, mpris: "Track" };
  if (repeat === "list") return { smtc: 2, mpris: "Playlist" };
  return { smtc: 0, mpris: "None" };
};

/**
 * 派发统一事件到主窗口渲染进程
 */
const emitMediaEvent = (event: MediaEvent) => {
  const mainWin = mainWindow.getWin();
  if (mainWin && !mainWin.isDestroyed()) {
    mainWin.webContents.send("media-event", event);
  }
};

/** 初始化 SMTC 原生插件 */
const initSmtc = () => {
  if (!isWin) return;
  nativeSmtc = loadNativeModule("smtc-for-splayer.node", "smtc-for-splayer");
  if (!nativeSmtc) {
    processLog.warn("[SMTC] 找不到原生插件，SMTC 功能将不可用");
    return;
  }

  try {
    const logDir = join(app.getPath("userData"), "logs", "smtc");
    nativeSmtc.initialize(logDir);
    processLog.info("[SMTC] SMTC 原生插件已初始化");

    // SMTC 事件转换映射
    const smtcEventTypeMap: Record<number, MediaEvent["type"]> = {
      0: "play",
      1: "pause",
      2: "stop",
      3: "next",
      4: "previous",
      5: "shuffle",
      6: "repeat",
      7: "seek",
    };

    nativeSmtc.registerEventHandler((event) => {
      emitMediaEvent({
        type: smtcEventTypeMap[event.type] || "play",
        value: event.positionMs,
      });
    });

    nativeSmtc.enableSmtc();
  } catch (e) {
    processLog.error("[SMTC] 初始化时失败", e);
  }
};

/** 初始化 MPRIS 原生插件 */
const initMpris = () => {
  if (!isLinux) return;
  nativeMpris = loadNativeModule("mpris-for-splayer.node", "mpris-for-splayer");
  if (!nativeMpris) {
    processLog.warn("[MPRIS] 找不到原生插件，MPRIS 功能将不可用");
    return;
  }

  try {
    mprisInstance = new nativeMpris.SPlayerMpris();

    // MPRIS 事件转换映射
    const mprisEventTypeMap: Record<string, MediaEvent["type"]> = {
      play: "play",
      pause: "pause",
      play_pause: "toggle-play-pause",
      stop: "stop",
      next: "next",
      previous: "previous",
      seek: "seek",
      set_position: "seek",
      loop_status_changed: "repeat",
      shuffle_changed: "shuffle",
    };

    mprisInstance.registerEventHandler((event) => {
      if (!event?.eventType) return;
      emitMediaEvent({
        type: mprisEventTypeMap[event.eventType] || "play",
        value: event.value,
      });
    });

    processLog.info("[MPRIS] MPRIS 原生插件已初始化");
  } catch (e) {
    processLog.error("[MPRIS] 初始化时失败", e);
  }
};

/** 初始化 Discord RPC 原生插件 */
const initDiscord = () => {
  discordRpc = loadNativeModule("discord-rpc-for-splayer.node", "discord-rpc-for-splayer");
  if (!discordRpc) {
    processLog.warn("[Discord RPC] 找不到原生插件，Discord RPC 功能将不可用");
    return;
  }

  try {
    discordRpc.initialize();
    processLog.info("[Discord RPC] Discord RPC 原生插件已初始化");
  } catch (e) {
    processLog.error("[Discord RPC] 初始化失败", e);
  }
};

/** 初始化统一媒体 IPC */
const initMediaIpc = () => {
  // 初始化各平台原生模块
  initSmtc();
  initMpris();
  initDiscord();

  // 元数据更新
  ipcMain.on("media-update-metadata", (_, payload: MediaMetadataParam) => {
    try {
      // Windows SMTC
      if (isWin && nativeSmtc) {
        nativeSmtc.updateMetadata({
          songName: payload.songName,
          authorName: payload.authorName,
          albumName: payload.albumName,
          coverData: payload.coverData,
          ncmId: payload.trackId,
        });
      }
      // Linux MPRIS
      if (isLinux && mprisInstance) {
        mprisInstance.setMetadata({
          title: payload.songName,
          artist: payload.authorName,
          album: payload.albumName,
          length: payload.duration,
          url: payload.coverUrl,
        });
      }
      // Discord RPC
      if (discordRpc) {
        discordRpc.updateMetadata({
          songName: payload.songName,
          authorName: payload.authorName,
          albumName: payload.albumName,
          originalCoverUrl: payload.coverUrl,
          duration: payload.duration,
          ncmId: payload.trackId,
        });
      }
    } catch (e) {
      processLog.error("[Media] 更新元数据失败", e);
    }
  });

  // 播放状态更新
  ipcMain.on("media-update-play-state", (_, payload: { status: MediaPlaybackStatus }) => {
    try {
      const status = payload.status;
      // Windows SMTC
      if (isWin && nativeSmtc) {
        nativeSmtc.updatePlayState({ status: status === "Playing" ? 0 : 1 });
      }
      // Linux MPRIS
      if (isLinux && mprisInstance) {
        mprisInstance.setPlaybackStatus(status);
      }
      // Discord RPC
      if (discordRpc) {
        discordRpc.updatePlayState({ status: status === "Playing" ? "Playing" : "Paused" });
      }
    } catch (e) {
      processLog.error("[Media] 更新播放状态失败", e);
    }
  });

  // 进度更新
  ipcMain.on("media-update-timeline", (_, payload: MediaTimelineParam) => {
    try {
      // Windows SMTC
      if (isWin && nativeSmtc) {
        nativeSmtc.updateTimeline({
          currentTime: payload.currentTime,
          totalTime: payload.totalTime,
        });
      }
      // Linux MPRIS (毫秒转微秒)
      if (isLinux && mprisInstance) {
        mprisInstance.setProgress(payload.currentTime * 1000, payload.totalTime * 1000);
      }
      // Discord RPC
      if (discordRpc) {
        discordRpc.updateTimeline({
          currentTime: payload.currentTime,
          totalTime: payload.totalTime,
        });
      }
    } catch (e) {
      processLog.error("[Media] 更新进度失败", e);
    }
  });

  // 播放模式更新
  ipcMain.on("media-update-play-mode", (_, payload: MediaPlayModeParam) => {
    try {
      const modes = convertRepeatMode(payload.repeat);
      // Windows SMTC
      if (isWin && nativeSmtc) {
        nativeSmtc.updatePlayMode({ isShuffling: payload.shuffle, repeatMode: modes.smtc });
      }
      // Linux MPRIS
      if (isLinux && mprisInstance) {
        mprisInstance.setLoopStatus(modes.mpris);
        mprisInstance.setShuffle(payload.shuffle);
      }
    } catch (e) {
      processLog.error("[Media] 更新播放模式失败", e);
    }
  });

  // 音量更新 (仅 MPRIS)
  ipcMain.on("media-update-volume", (_, payload: { volume: number }) => {
    try {
      if (isLinux && mprisInstance) {
        mprisInstance.setVolume(payload.volume);
      }
    } catch (e) {
      processLog.error("[Media] 更新音量失败", e);
    }
  });

  // Discord 启用
  ipcMain.on("discord-enable", () => {
    if (discordRpc) {
      try {
        discordRpc.enable();
      } catch (e) {
        processLog.error("[Discord RPC] 启用失败", e);
      }
    }
  });

  // Discord 禁用
  ipcMain.on("discord-disable", () => {
    if (discordRpc) {
      try {
        discordRpc.disable();
      } catch (e) {
        processLog.error("[Discord RPC] 禁用失败", e);
      }
    }
  });

  // Discord 更新配置
  ipcMain.on("discord-update-config", (_, payload: DiscordConfigPayload) => {
    if (discordRpc) {
      try {
        discordRpc.updateConfig(payload);
      } catch (e) {
        processLog.error("[Discord RPC] 更新配置失败", e);
      }
    }
  });

  processLog.info("[Media] 统一媒体 IPC 已初始化");
};

/**
 * 关闭统一媒体 IPC
 */
export const shutdownMedia = () => {
  if (discordRpc) {
    try {
      discordRpc.shutdown();
    } catch (e) {
      processLog.error("[Discord RPC] 关闭时出错", e);
    }
  }

  if (nativeSmtc) {
    try {
      nativeSmtc.shutdown();
    } catch (e) {
      processLog.error("[SMTC] 关闭时出错", e);
    }
  }

  if (mprisInstance) {
    mprisInstance = null;
  }

  processLog.info("[Media] 统一媒体 IPC 已关闭");
};

export default initMediaIpc;

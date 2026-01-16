import { DialogApi, LoadingBarApi, MessageApi, ModalApi, NotificationApi } from "naive-ui";

import type { DiscordConfigPayload } from "@discord-rpc";

export { DiscordConfigPayload };

/** 统一元数据接口 */
export interface MediaMetadataParam {
  songName: string;
  authorName: string;
  albumName: string;
  /** HTTP URL (用于 Discord) */
  coverUrl?: string;
  /** 二进制数据 (用于 SMTC) */
  coverData?: Buffer;
  /** 毫秒 */
  duration?: number;
  /** NCM ID */
  trackId?: number;
}

/** 统一播放状态 */
export type MediaPlaybackStatus = "Playing" | "Paused" | "Stopped";

/** 统一进度 */
export interface MediaTimelineParam {
  /** 毫秒 */
  currentTime: number;
  /** 毫秒 */
  totalTime: number;
}

/** 统一播放模式 */
export interface MediaPlayModeParam {
  shuffle: boolean;
  repeat: "off" | "one" | "list";
}

/** 统一媒体事件 */
export interface MediaEvent {
  type:
    | "play"
    | "pause"
    | "stop"
    | "next"
    | "previous"
    | "seek"
    | "shuffle"
    | "repeat"
    | "toggle-play-pause";
  /** seek 时为毫秒偏移 */
  value?: number;
}

/** 统一媒体 IPC 通道 */
export interface IpcChannelMap {
  // 统一媒体接口
  "media-update-metadata": MediaMetadataParam;
  "media-update-play-state": { status: MediaPlaybackStatus };
  "media-update-timeline": MediaTimelineParam;
  "media-update-play-mode": MediaPlayModeParam;
  "media-update-volume": { volume: number };
  // Discord RPC
  "discord-enable": void;
  "discord-disable": void;
  "discord-update-config": DiscordConfigPayload;
}

declare global {
  interface Window {
    // naiveui
    $message: MessageApi;
    $dialog: DialogApi;
    $notification: NotificationApi;
    $loadingBar: LoadingBarApi;
    $modal: ModalApi;
    // electron
    api: {
      store: {
        get: (key: string) => Promise<any>;
        set: (key: string, value: unknown) => Promise<boolean>;
        has: (key: string) => Promise<boolean>;
        delete: (key: string) => Promise<boolean>;
        reset: (keys?: string[]) => Promise<boolean>;
        export: (data: any) => Promise<boolean>;
        import: () => Promise<any>;
      };
    };
    electron: {
      ipcRenderer: {
        send<K extends keyof IpcChannelMap>(channel: K, payload: IpcChannelMap[K]): void;

        on(
          channel: "media-event",
          listener: (event: Electron.IpcRendererEvent, payload: MediaEvent) => void,
        ): void;

        // TODO: 这些类型定义不怎么安全
        send(channel: string, ...args: any[]): void;
        on(
          channel: string,
          listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void,
        ): void;
        once(
          channel: string,
          listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void,
        ): void;
        invoke(channel: string, ...args: any[]): Promise<any>;
        removeAllListeners(channel: string): void;
        sendSync(channel: string, ...args: any[]): any;
      };
    };
  }
}

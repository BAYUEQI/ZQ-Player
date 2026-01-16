import axios from "axios";
import { useMusicStore, useSettingStore, useStatusStore } from "@/stores";
import { getPlaySongData } from "@/utils/format";
import { isElectron, isLinux, isWin } from "@/utils/env";
import { msToS } from "@/utils/time";
import type { MediaEvent } from "@/types/global";
import { usePlayerController } from "./PlayerController";
import {
  sendMediaMetadata,
  sendMediaTimeline,
  sendMediaPlayState,
  sendMediaPlayMode,
  enableDiscordRpc,
  updateDiscordConfig,
} from "./PlayerIpc";
import { throttle } from "lodash-es";

/**
 * 媒体会话管理器，负责跨平台媒体控制集成
 * - Windows: 原生 SMTC
 * - Linux: 原生 MPRIS
 * - 其他平台: navigator.mediaSession
 */
class MediaSessionManager {
  private metadataAbortController: AbortController | null = null;

  /**
   * 是否使用原生媒体集成
   */
  private shouldUseNativeMedia(): boolean {
    return isElectron && (isWin || isLinux);
  }

  /**
   * 处理统一媒体事件
   */
  private handleMediaEvent(event: MediaEvent, player: ReturnType<typeof usePlayerController>) {
    const statusStore = useStatusStore();

    switch (event.type) {
      case "play":
        player.play();
        setTimeout(() => sendMediaPlayState(statusStore.playStatus ? "Playing" : "Paused"), 50);
        break;
      case "pause":
        player.pause();
        setTimeout(() => sendMediaPlayState("Paused"), 50);
        break;
      case "stop":
        player.pause();
        setTimeout(() => sendMediaPlayState("Stopped"), 50);
        break;
      case "next":
        player.nextOrPrev("next");
        break;
      case "previous":
        player.nextOrPrev("prev");
        break;
      case "seek":
        if (event.value !== undefined) {
          player.setSeek(event.value);
        }
        break;
      case "shuffle":
        player.handleSmtcShuffle();
        break;
      case "repeat":
        player.toggleRepeat();
        break;
      case "toggle-play-pause":
        if (statusStore.playStatus) {
          player.pause();
          setTimeout(() => sendMediaPlayState("Paused"), 50);
        } else {
          player.play();
          setTimeout(() => sendMediaPlayState(statusStore.playStatus ? "Playing" : "Paused"), 50);
        }
        break;
    }
  }

  /**
   * 初始化媒体会话
   */
  public init() {
    const settingStore = useSettingStore();
    if (!settingStore.smtcOpen) return;

    const player = usePlayerController();
    const statusStore = useStatusStore();

    if (isElectron) {
      // 统一媒体事件监听
      window.electron.ipcRenderer.removeAllListeners("media-event");
      window.electron.ipcRenderer.on("media-event", (_, event: MediaEvent) => {
        this.handleMediaEvent(event, player);
      });

      // 同步初始播放模式状态
      const shuffle = statusStore.shuffleMode !== "off";
      const repeat =
        statusStore.repeatMode === "list"
          ? "list"
          : statusStore.repeatMode === "one"
            ? "one"
            : "off";
      sendMediaPlayMode(shuffle, repeat);

      // SMTC 播放模式同步
      if (isWin) {
        player.syncSmtcPlayMode();
      }

      // Discord RPC 初始化
      if (settingStore.discordRpc.enabled) {
        enableDiscordRpc();
        updateDiscordConfig({
          showWhenPaused: settingStore.discordRpc.showWhenPaused,
          displayMode: settingStore.discordRpc.displayMode,
        });
      }

      // 如果有原生集成则不需要 Web API
      if ((isWin || isLinux) && settingStore.smtcOpen) return;
    }

    // Web API 初始化
    if ("mediaSession" in navigator) {
      const nav = navigator.mediaSession;
      nav.setActionHandler("play", () => player.play());
      nav.setActionHandler("pause", () => player.pause());
      nav.setActionHandler("previoustrack", () => player.nextOrPrev("prev"));
      nav.setActionHandler("nexttrack", () => player.nextOrPrev("next"));
      nav.setActionHandler("seekto", (e) => {
        if (e.seekTime) player.setSeek(e.seekTime * 1000);
      });
    }
  }

  /**
   * 更新元数据
   */
  public async updateMetadata() {
    if (!("mediaSession" in navigator) && !isElectron) return;

    const musicStore = useMusicStore();
    const settingStore = useSettingStore();
    const song = getPlaySongData();

    if (!song) return;

    if (this.metadataAbortController) {
      this.metadataAbortController.abort();
    }

    this.metadataAbortController = new AbortController();
    const { signal } = this.metadataAbortController;

    const metadata = this.buildMetadata(song);

    // 原生插件
    if (this.shouldUseNativeMedia() && settingStore.smtcOpen) {
      try {
        let coverBuffer: Uint8Array | undefined;
        let coverUrl = metadata.coverUrl;

        // 获取封面数据（用于 SMTC）
        if (
          isWin &&
          metadata.coverUrl &&
          (metadata.coverUrl.startsWith("http") || metadata.coverUrl.startsWith("blob:"))
        ) {
          const resp = await axios.get(metadata.coverUrl, {
            responseType: "arraybuffer",
            signal,
          });
          coverBuffer = new Uint8Array(resp.data);
        }

        // 处理 MPRIS 封面 URL
        if (isLinux && coverUrl) {
          if (coverUrl.startsWith("blob:")) {
            try {
              const resp = await axios.get(coverUrl, {
                responseType: "arraybuffer",
                signal,
              });
              const base64 = btoa(
                new Uint8Array(resp.data).reduce(
                  (data, byte) => data + String.fromCharCode(byte),
                  "",
                ),
              );
              coverUrl = `data:image/jpeg;base64,${base64}`;
            } catch (e) {
              if (!axios.isCancel(e)) {
                console.error("转换 blob 封面失败:", e);
              }
              coverUrl = "";
            }
          } else if (
            !coverUrl.startsWith("http") &&
            !coverUrl.startsWith("file://") &&
            !coverUrl.startsWith("data:")
          ) {
            coverUrl = `file://${coverUrl}`;
          }
        }

        // 发送统一的元数据
        sendMediaMetadata({
          songName: metadata.title,
          authorName: metadata.artist,
          albumName: metadata.album,
          coverUrl: isLinux
            ? coverUrl || undefined
            : coverUrl?.startsWith("http")
              ? coverUrl
              : undefined,
          coverData: coverBuffer as Buffer,
          duration: song.duration,
          trackId: typeof song.id === "number" ? song.id : 0,
        });
      } catch (e) {
        if (!axios.isCancel(e)) {
          console.error("[Media] 更新元数据失败", e);
        }
      } finally {
        if (this.metadataAbortController?.signal === signal) {
          this.metadataAbortController = null;
        }
      }
      return;
    }

    // Web API
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: metadata.title,
        artist: metadata.artist,
        album: metadata.album,
        artwork: this.buildArtwork(musicStore),
      });
    }
  }

  /**
   * 构建元数据
   */
  private buildMetadata(song: ReturnType<typeof getPlaySongData>): {
    title: string;
    artist: string;
    album: string;
    coverUrl: string;
  } {
    const isRadio = song!.type === "radio";
    const musicStore = useMusicStore();

    return {
      title: song!.name,
      artist: isRadio
        ? "播客电台"
        : Array.isArray(song!.artists)
          ? song!.artists.map((a) => a.name).join("/")
          : String(song!.artists),
      album: isRadio
        ? "播客电台"
        : typeof song!.album === "object"
          ? song!.album.name
          : String(song!.album),
      coverUrl: musicStore.getSongCover("xl") || musicStore.playSong.cover || "",
    };
  }

  /**
   * 构建专辑封面数组
   */
  private buildArtwork(musicStore: ReturnType<typeof useMusicStore>) {
    return [
      {
        src: musicStore.getSongCover("s") || musicStore.playSong.cover || "",
        sizes: "100x100",
        type: "image/jpeg",
      },
      {
        src: musicStore.getSongCover("m") || musicStore.playSong.cover || "",
        sizes: "300x300",
        type: "image/jpeg",
      },
      {
        src: musicStore.getSongCover("cover") || musicStore.playSong.cover || "",
        sizes: "512x512",
        type: "image/jpeg",
      },
      {
        src: musicStore.getSongCover("l") || musicStore.playSong.cover || "",
        sizes: "1024x1024",
        type: "image/jpeg",
      },
      {
        src: musicStore.getSongCover("xl") || musicStore.playSong.cover || "",
        sizes: "1920x1920",
        type: "image/jpeg",
      },
    ];
  }

  /**
   * 更新播放进度
   */
  public updateState(duration: number, position: number) {
    const settingStore = useSettingStore();
    if (!settingStore.smtcOpen) return;

    // 原生插件
    if (this.shouldUseNativeMedia()) {
      sendMediaTimeline(position, duration);
      return;
    }

    // Web API
    this.throttledUpdatePositionState(duration, position);
  }

  /**
   * 更新播放状态
   */
  public updatePlaybackStatus(isPlaying: boolean) {
    // 发送到原生插件
    if (this.shouldUseNativeMedia()) {
      sendMediaPlayState(isPlaying ? "Playing" : "Paused");
    }
  }

  /**
   * 限流更新进度状态
   */
  private throttledUpdatePositionState = throttle((duration: number, position: number) => {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.setPositionState({
        duration: msToS(duration),
        position: msToS(position),
      });
    }
  }, 1000);
}

export const mediaSessionManager = new MediaSessionManager();

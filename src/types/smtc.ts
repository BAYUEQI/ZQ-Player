/**
 * @fileoverview 包含了 smtc 原生插件相关的类型定义
 *
 * 因为无法直接从类型定义文件中导入枚举，所以复制到这里来使用
 */

/**
 * 原生插件的播放状态枚举，用于更新数据
 */
export enum PlaybackStatus {
  Playing = 0,
  Paused = 1,
}

/**
 * 原生插件的重复模式枚举，用于更新数据
 */
export enum RepeatMode {
  None = 0,
  Track = 1,
  List = 2,
}

/**
 * 来自原生插件的控制事件枚举
 */
export enum SmtcEventType {
  Play = 0,
  Pause = 1,
  Stop = 2,
  NextSong = 3,
  PreviousSong = 4,
  ToggleShuffle = 5,
  ToggleRepeat = 6,
  Seek = 7,
}

/**
 * Discord 显示模式枚举
 */
export enum DiscordDisplayMode {
  /** 显示为 "Listening to Spotify" */
  Name = "name",
  /** 显示为 "Listening to Rick Astley" */
  State = "state",
  /** 显示为 "Listening to Never Gonna Give You Up" */
  Details = "details",
}

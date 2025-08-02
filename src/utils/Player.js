import { Howl, Howler } from "howler";
import { musicData, siteStatus, siteSettings } from "@/stores";
import { getSongUrl, getSongLyric, songScrobble, getMusicNumUrlNew, getSongLyricLegacy } from "@/api/song";
import { getSongTTML } from "@/api/ttml";
import { checkPlatform, getLocalCoverData, getBlobUrlFromUrl } from "@/utils/helper";
import { decode as base642Buffer } from "@/utils/base64";
import { getSongPlayTime } from "@/utils/time.ts";
import { getCoverGradient } from "@/utils/cover-color";
import { isLogin } from "@/utils/auth";
import { parseLyricsData, parseLocalLyric, parseTTMLToAMLL } from "@/utils/lyric.ts";
import { parseLyric } from "@/utils/parseLyric";

// 全局播放器
let player;
// 时长定时器
let seekInterval;
let justSeekInterval;
let scrobbleTimeout;
// 重试次数
let testNumber = 0;
// 是否结束
let isPlayEnd = true;
// 频谱数据
let spectrumsData = {
  audio: null,
  analyser: null,
  audioCtx: null,
  scale: 1,
};
// 默认标题
let defaultTitle = document.title;

/**
 * 初始化播放器
 */
export const initPlayer = async (playNow = false) => {
  try {
    // 停止播放器
    soundStop();
    // 获取基础数据
    const music = musicData();
    const status = siteStatus();
    const settings = siteSettings();
    const { playIndex, playMode } = status;
    const { playList } = music;
    // 当前播放歌曲数据
    const playSongData = music.getPlaySongData;
    // 是否为本地歌曲
    const isLocalSong = playSongData?.path ? true : false;
    console.log("当前为本地歌曲");
    // 获取封面
    if (isLocalSong) {
      music.playSongData.localCover = await getLocalCoverData(playSongData?.path);
    }
    const cover = isLocalSong ? music.playSongData?.localCover : playSongData?.coverSize;
    // 歌词归位
    status.playSongLyricIndex = -1;
    // 若为 fm 模式，则清除当前歌曲信息
    if (playMode === "fm") music.playSongData = {};
    // 在线歌曲
    if (!isLocalSong) {
      // 获取歌曲 ID
      let songId = playSongData?.id;
      if (!songId) {
        return false;
      }
      // 若为电台模式
      if (playMode === "dj") songId = music.getPlaySongData?.djId;
      // 开启加载状态
      status.playLoading = true;
      // 获取播放地址
      const url = await getNormalSongUrl(songId, status, playNow);
      // 正常播放地址
      if (url) {
        $message.info("获取链接成功, 开始播放");
        createPlayer(url);
      }
      // 无法正常获取播放地址
      else if (playMode !== "dj" && settings.useUnmServer) {
        const unblockUrl = await getFromUnblockMusic(playSongData, status, playNow);
        if (unblockUrl) {
          status.playUseOtherSource = true;
          createPlayer(unblockUrl);
        } else {
          $message.warning("获取失败, 跳过操作");
          isPlayEnd = true;
          status.playUseOtherSource = false;
          // 是否为最后一首
          if (playIndex === playList.length - 1) {
            status.playState = false;
            $message.warning("当前列表歌曲无法播放，请更换歌曲");
          } else {
            $message.error("该歌曲暂无音源，跳至下一首");
            changePlayIndex("next", true);
          }
        }
      }
      // 下一曲
      else {
        if (playIndex !== playList.length - 1) {
          // changePlayIndex();
        } else {
          status.playLoading = false;
          status.playState = false;
          $message.warning("列表中暂无可播放歌曲", { closable: true, duration: 5000 });
        }
      }
    }
    // 本地歌曲
    else if (isLocalSong && playList?.length) {
      const url = playList[playIndex]?.path;
      if (playNow && url) status.playState = true;
      if (url) {
        // 创建播放器
        createPlayer(url);
      } else {
        changePlayIndex("next", playNow);
      }
    }
    // 获取歌词
    if (playMode !== "dj") getSongLyricData(isLocalSong, playSongData);
    // 初始化媒体会话控制
    initMediaSession(playSongData, cover, isLocalSong, playMode === "dj");
    // 获取图片主色
    getColorMainColor(isLocalSong, cover);
  } catch (error) {
    testNumber++;
    // 错误次数过多
    if (testNumber > 10) {
      $dialog.error({
        title: "致命性错误",
        content: "歌曲播放中出现错误次数过多，请刷新后重试",
        positiveText: "刷新窗口",
        onPositiveClick: () => {
          location.reload();
        },
      });
      return false;
    }
    // 下一曲
    // changePlayIndex();
    console.error("初始化音乐播放器出错：", error);
    $message.error("初始化音乐播放器出错");
  }
};

/**
 * 获取普通模式下的音乐播放地址
 * @param {number} id - 歌曲 id
 * @returns {Promise<?string>} - 歌曲播放地址，如果获取失败或歌曲无法播放则返回 null
 */
const getNormalSongUrl = async (id, status, playNow) => {
  try {
    const settings = siteSettings();
    const res = await getSongUrl(id, settings.songLevel);
    // 检查是否有有效的响应数据
    if (!res.data?.[0] || !res.data?.[0]?.url) return null;
    // 检查是否只能试听
    if (res.data?.[0]?.freeTrialInfo !== "unblock") { 
      status.playUseOtherSource = true;
    }
    if (res.data?.[0]?.freeTrialInfo !== null && settings.useUnmServer) {
      // 调用解灰
      const unblockUrl = await getFromUnblockMusic({ id }, status, playNow);
      if (unblockUrl) {
        status.playUseOtherSource = true; // 明确设置状态
        return unblockUrl;
      } else {
        return null;
      }
    }
    // 返回歌曲地址，将 http 转换为 https
    const url = res.data[0].url.replace(/^http:/, "https:");
    // 更改状态
    if (playNow && url) status.playState = true;
    status.playUseOtherSource = false;
    return url;
  } catch (error) {
    status.playLoading = false;
    $message.error("获取歌曲地址出现错误, 请查看浏览器控制台");
    console.error("获取歌曲地址遇到错误：" + error);
    throw error;
  }
};

/**
 * 网易云解灰
 * @param {object} data - 歌曲数据
 * @param {object} status - 播放器状态
 * @param {boolean} playNow - 是否立即播放
 * @returns {Promise<?string>} - 解灰后的音乐播放地址，如果获取失败则返回 null
 */
const getFromUnblockMusic = async (data, status, playNow) => {
  try {
    console.info("🎵 开始解灰：", data);
    // 调用解灰
    let musicUrl = null;
    try {
      const settings = siteSettings();
      let response = await getMusicNumUrlNew(data.id, settings.customMusicSource);
      console.log(response);
      if (response?.code === 200 && response?.data) {
        if (response.data.proxyUrl) {
          musicUrl = response.data.proxyUrl
        } else {
          musicUrl = response.data.url;
        };
      }
    } catch (error) {
      console.log("getMusicNumUrl失败：", error);
    };
    console.log(musicUrl);
    if (musicUrl) {
      // 将 http 替换为 https
      if (!checkPlatform.electron()) { musicUrl = musicUrl.replace(/^http:/, "https:") }
      $message.info("获取链接成功, 正在播放");
      status.playUseOtherSource = true;
      if (playNow) status.playState = true;
      status.playLoading = false;
      return musicUrl;
    } else {
      status.playLoading = false;
      return null;
    }
  } catch (error) {
    status.playLoading = false;
    console.error("歌曲解灰遇到错误：" + error.message);
    $message.error("歌曲解灰遇到错误");
    throw error;
  }
};

/**
 * 创建播放器
 * @param {string} src - 音频文件地址
 * @param {number} volume - 音量（ 默认为 0.7 ）
 * @param {number} seek - 初始播放进度（ 默认为 0 ）
 */
export const createPlayer = async (src, autoPlay = true) => {
  try {
    // pinia
    const music = musicData();
    const status = siteStatus();
    const settings = siteSettings();
    const { playMode } = status;
    const { playSongSource, playList } = music;
    const { showSpectrums, memorySeek, useMusicCache } = settings;
    // 当前播放歌曲数据
    const playSongData = music.getPlaySongData;
    // 获取播放链接（非电台及云盘歌曲）
    const songUrl =
      useMusicCache && playMode !== "dj" && !playSongData.pc ? await getBlobUrlFromUrl(src) : src;
    let processedUrl = songUrl;
    // 处理音乐链接，将特定域名替换为其他域名
    let finalUrl = processedUrl;
    if (songUrl.includes('m804.music.126.net') || songUrl.includes('m704.music.126.net')) {
      finalUrl = songUrl.replace(/m804\.music\.126\.net/g, 'm801.music.126.net')
                       .replace(/m704\.music\.126\.net/g, 'm701.music.126.net');
      processedUrl = finalUrl;
    }
    console.log("播放地址：", processedUrl);
    // 初始化播放器
    if (player) soundStop();
    player = new Howl({
      src: [processedUrl],
      format: ["mp3", "flac", "dolby", "webm"],
      html5: true,
      preload: "metadata",
      volume: status.playVolume,
      rate: status.playRate,
    });
    // 允许跨域
    const audioDom = player._sounds[0]._node;
    // 设置跨域访问策略
    audioDom.crossOrigin = "anonymous";
    // 写入播放历史
    if (playMode !== "dj") music.setPlayHistory(playSongData);
    // 生成音乐频谱
    // 由于浏览器安全策略，无法在此处启动
    if (showSpectrums && checkPlatform.electron()) processSpectrum(player);
    // 加载完成
    player?.once("load", () => {
      console.info("🎵 加载完成", player, status.playState);
      // 自动播放
      if (autoPlay && status.playState) {
        setSeek();
        fadePlayOrPause("play");
      }
      // 恢复进度（防止播放到结尾时触发 bug）
      if (memorySeek && status.playTimeData?.duration - status.playTimeData?.currentTime > 2) {
        setSeek(status.playTimeData?.currentTime ?? 0);
      } else {
        setSeek();
        status.playTimeData.bar = "0";
      }
      // 取消加载状态
      status.playLoading = false;
      // 发送歌曲名
      if (checkPlatform.electron()) {
        electron.ipcRenderer.send("songNameChange", getPlaySongName());
      }
      // 听歌打卡
      if (isLogin() && !playSongData?.path) {
        clearTimeout(scrobbleTimeout);
        scrobbleTimeout = setTimeout(async () => {
          const result = await songScrobble(playSongData.id, playSongSource, 5);
          if (result.code === 200) console.log("歌曲打卡完成：", result);
        }, 5000);
      }
    });
    // 开始播放
    player?.on("play", () => {
      console.info("🎵 开始播放：", playSongData);
      isPlayEnd = false;
      setAllInterval();
      // 更改状态
      status.playState = true;
      // 发送状态
      if (checkPlatform.electron()) {
        electron.ipcRenderer.send("songStateChange", true);
      }
      // 更改页面标题
      if (!checkPlatform.electron()) document.title = getPlaySongName();
    });
    // 暂停播放
    player?.on("pause", () => {
      console.info("⏸ 暂停播放");
      cleanAllInterval();
      // 更改状态
      status.playState = false;
      // 发送状态
      if (checkPlatform.electron()) {
        electron.ipcRenderer.send("songStateChange", false);
      }
      // 更改页面标题
      if (!checkPlatform.electron()) document.title = defaultTitle || "ZQ-Player";
    });
    // 结束播放
    player?.on("end", () => {
      console.info("🎵 播放结束");
      isPlayEnd = true;
      // 停止定时器
      cleanAllInterval();
      // 下一曲
      changePlayIndex();
      // 发送状态
      if (checkPlatform.electron()) {
        electron.ipcRenderer.send("songStateChange", false);
      }
    });
    // 加载失败
    player?.on("loaderror", (id, errCode) => {
      console.log("播放出现错误：", id, errCode);
      // 更改状态
      status.playLoading = false;
      // https://github.com/goldfire/howler.js?tab=readme-ov-file#onloaderror-function
      switch (errCode) {
        case 1:
          $message.error("播放出错，用户代理中止了获取媒体");
          break;
        case 2:
          $message.error("播放出错，未知的网络错误");
          break;
        case 3:
          $message.error("播放出错，媒体进行解码时发生错误");
          break;
        case 4:
          $message.error("播放出错，不支持的音频格式或媒体资源不合适");
          break;
        default:
          $message.error("播放遇到未知错误");
          break;
      }
      // 下一曲
      if (playList.length > 1) {
        changePlayIndex();
      } else {
        status.playState = false;
      }
    });
    // 返回音频对象
    return (window.$player = player);
  } catch (error) {
    console.error("播放遇到错误：" + error);
    $message.error("播放遇到错误，请重试");
    throw error;
  }
};

/**
 * 播放下一首或上一首歌曲
 * @param {string} type - 更改索引的类型  "next" / "prev"
 */
export const changePlayIndex = async (type = "next", play = false) => {
  // pinia
  const music = musicData();
  const status = siteStatus();
  // 解构音乐数据
  const { playList } = music;
  const { playSongMode, playMode, playHeartbeatMode } = status;
  // 清除定时器
  cleanAllInterval();
  // 歌词归位
  status.playSongLyricIndex = -1;
  // 私人FM模式
  if (playMode === "fm") {
    await music.setPersonalFm(true);
    // 渐出音乐
    if (!isPlayEnd) fadePlayOrPause("pause");
    // 初始化播放器
    initPlayer(play);
    return true;
  }
  // 根据播放模式确定要操作的播放列表和其长度
  const listLength = playList?.length || 0;
  // 根据播放歌曲模式执行不同的操作
  if (status.hasNextSong) {
    status.playIndex += type === "next" ? 1 : -1;
    status.hasNextSong = false;
  } else {
    if (playSongMode === "normal" || playHeartbeatMode) {
      // 正常模式
      status.playIndex += type === "next" ? 1 : -1;
    } else if (playSongMode === "random") {
      // 随机模式
      status.playIndex = Math.floor(Math.random() * listLength);
    } else if (playSongMode === "repeat") {
      // 单曲循环模式
      setSeek();
      fadePlayOrPause("play");
    }
  }
  // 检查播放索引是否越界
  if (playSongMode !== "repeat") {
    if (status.playIndex < 0) {
      status.playIndex = listLength - 1;
    } else if (status.playIndex >= listLength) {
      status.playIndex = 0;
    }
    // 赋值当前播放歌曲信息
    const songData = playList?.[status.playIndex];
    if (songData) {
      music.playSongData = songData;
      // 渐出音乐
      if (!isPlayEnd) fadePlayOrPause("pause");
      // 初始化播放器
      initPlayer(play);
    } else {
      $message.error("歌曲信息读取错误，跳至下一曲");
      changePlayIndex("next", play);
    }
  }
};

/**
 * 在当前播放歌曲后添加
 * @param {Object} data - 歌曲信息
 */
export const addSongToNext = (data, play = false) => {
  try {
    const music = musicData();
    const status = siteStatus();
    // 更改播放模式
    status.hasNextSong = true;
    // 查找是否存在于播放列表
    const index = music.playList.findIndex((v) => v.id === data.id);
    // 若存在
    if (index !== -1) {
      console.log("已存在", index);
      // 移动至当前歌曲的下一曲
      const currentSongIndex = status.playIndex;
      const nextSongIndex = currentSongIndex + 1;
      // 如果移动的位置不是当前位置，且不是最后一首歌曲
      if (index !== currentSongIndex && nextSongIndex < music.playList.length) {
        // 移动歌曲
        music.playList.splice(nextSongIndex, 0, music.playList.splice(index, 1)[0]);
      }
      // 更新播放索引
      if (play) status.playIndex = nextSongIndex;
    }
    // 添加至播放列表
    else {
      // music.playList.push(data);
      music.playList.splice(status.playIndex + 1, 0, data);
      if (play) status.playIndex++;
    }
    // 是否立即播放
    play ? fadePlayOrPause("play") : $message.success("已添加至下一首播放");
  } catch (error) {
    console.error("添加播放歌曲失败：", error);
  }
};

/**
 * 音频渐入渐出
 * @param {String} [type="play"] - 渐入渐出
 */
export const fadePlayOrPause = (type = "play") => {
  const status = siteStatus();
  const settings = siteSettings();
  const duration = settings.songVolumeFade ? 300 : 0;
  // 渐入
  if (type === "play") {
    if (player?.playing()) return;
    player?.play();
    // 更新播放进度
    setAllInterval();
    player?.once("play", () => {
      player?.fade(0, status.playVolume, duration);
    });
  }
  // 渐出
  else if (type === "pause") {
    player?.fade(status.playVolume, 0, duration);
    player?.once("fade", () => {
      player?.pause();
      cleanAllInterval();
    });
  }
};

/**
 * 播放或暂停
 */
export const playOrPause = async () => {
  const status = player?.playing();
  fadePlayOrPause(status ? "pause" : "play");
};

/**
 * 设置倍速
 * @param {number} rate - 设置的倍速值
 */
export const setRate = (rate) => {
  player?.rate(Number(rate));
};

/**
 * 设置音量
 * @param {number} volume - 设置的音量值，0-1之间的浮点数
 */
export const setVolume = (volume) => {
  player?.volume(Number(volume));
};

/**
 * 停止播放器
 */
export const soundStop = () => {
  // player?.stop();
  // setSeek();
  Howler.unload();
};

/**
 * 调整静音
 */
export const setVolumeMute = () => {
  const status = siteStatus();
  if (status.playVolume > 0) {
    status.playVolumeMute = status.playVolume;
    status.playVolume = 0;
  } else {
    status.playVolume = status.playVolumeMute;
  }
  player?.volume(status.playVolume);
};

/**
 * 设置进度
 * @param {number} seek - 设置的进度值，0-1之间的浮点数
 */
export const setSeek = (seek = 0) => {
  player?.seek(seek);
};

/**
 * 获取进度
 * @return {number} seek - 获取的进度值，0-1之间的浮点数
 */
export const getSeek = () => {
  if (typeof player !== "undefined") {
    return player.seek();
  }
  return 0;
};

/**
 * 更改播放进度
 */
const setAudioTime = () => {
  if (player?.playing()) {
    const music = musicData();
    const status = siteStatus();
    const settings = siteSettings();
    const currentTime = player?.seek();
    const duration = player?._duration;
    // 计算数据
    const bar = duration ? ((currentTime / duration) * 100).toFixed(2) : 0;
    const played = getSongPlayTime(currentTime);
    const durationTime = getSongPlayTime(duration);
    // 计算当前歌词播放索引
    const lrcType = !music.playSongLyric.hasYrc || !settings.showYrc;
    const lyrics = lrcType ? music.playSongLyric.lrc : music.playSongLyric.yrc;
    const lyricsIndex = lyrics?.findIndex((v) => v?.time >= currentTime);
    // 赋值数据
    status.playTimeData = { currentTime, duration, bar, played, durationTime };
    status.playSongLyricIndex = lyricsIndex === -1 ? lyrics.length - 1 : lyricsIndex - 1;
    // 显示进度条
    if (checkPlatform.electron() && settings.showTaskbarProgress) {
      electron.ipcRenderer.send("setProgressBar", bar);
    }
  }
};

/**
 * 更改播放进度（频繁）
 */
const justSetSeek = () => {
  if (player?.playing()) {
    const status = siteStatus();
    status.playSeek = getSeek();
    requestAnimationFrame(justSetSeek);
  }
};

/**
 * 获取歌曲的歌词数据并解析
 * @param {object} data - 歌曲的数据
 */
const getSongLyricData = async (islocal, data) => {
  if (!data?.id) return false;
  try {
    const music = musicData();
    if (islocal) {
      /* 不要再拿local误导人啦 */
      const lyricData = await electron.ipcRenderer.invoke("getMusicLyric", data?.path);
      if (lyricData) {
        // 使用parseLyric.js处理本地歌词
        const parsedLyric = parseLyric(lyricData);
        // 使用lyric.ts处理AMLL格式
        const amllLyric = parseLocalLyric(lyricData);
        // 合并结果
        music.playSongLyric = {
          ...parsedLyric,
          lrcAMData: amllLyric.lrcAMData,
          yrcAMData: amllLyric.yrcAMData
        };
      } else {
        console.log("该歌曲暂无歌词");
        music.playSongLyric = parseLyric("");
      }
    } else {
      const lyricResponse = await getSongLyric(data?.id);
      const lyricLegacy = await getSongLyricLegacy(data?.id);
      const lyricTTML = await getSongTTML(data?.id);
      if (lyricResponse?.original || lyricLegacy || lyricTTML?.content) {
        // 使用parseLyric.js处理基础歌词
        const parsedLyric = parseLyric(lyricLegacy);
        // 使用lyric.ts处理AMLL格式
        let amllLyric = parseLyricsData(lyricResponse.original);
        // 为了使用TTML歌词添加一个开关
        const settings = siteSettings();
        // 处理TTML歌词
        if (lyricTTML?.content && settings.useTTMLFormat) {
          try {
            const ttmlLyric = parseTTMLToAMLL(lyricTTML.content);
            if (ttmlLyric && ttmlLyric.length > 0) {
              // 将TTML歌词转换为AMLL格式，由于TTML包含逐字信息，应该存储在yrcAMData中
              amllLyric = {
                lrcData: [],
                yrcData: [],
                lrcAMData: [],
                yrcAMData: ttmlLyric,
                hasLrcTran: ttmlLyric.some(line => line.translatedLyric),
                hasLrcRoma: ttmlLyric.some(line => line.romanLyric),
                hasYrc: true
              };
              console.info("TTML歌词解析成功", amllLyric);
            }
          } catch (error) {
            console.error("TTML歌词解析失败:", error);
          }
        }
        
        // 合并结果
        music.playSongLyric = {
          lrc: parsedLyric.lrc,
          yrc: parsedLyric.yrc,
          lrcAMData: amllLyric.lrcAMData,
          yrcAMData: amllLyric.yrcAMData,
          // 保留原始歌词属性
          hasLrcTran: amllLyric.hasLrcTran || parsedLyric.hasLrcTran,
          hasLrcRoma: amllLyric.hasLrcRoma || parsedLyric.hasLrcRoma,
          hasYrc: amllLyric.hasYrc || parsedLyric.hasYrc,
          hasYrcTran: parsedLyric.hasYrcTran,
          hasYrcRoma: parsedLyric.hasYrcRoma
        };
      } else {
        console.log("该歌曲暂无歌词");
        music.playSongLyric = parseLyric(null);
      }
    }
  } catch (err) {
    $message.error("歌词处理出错");
    console.error("歌词处理出错：", err);
  }
};

/**
 * 初始化媒体会话控制
 * 如果浏览器支持媒体会话控制（ Media Session API ），则关联各类操作
 * @param {object} data - 当前播放数据
 * @param {string} islocal - 是否为本地歌曲
 * @param {string} cover - 封面图像的URL或数据
 */
const initMediaSession = async (data, cover, islocal, isDj) => {
  if ("mediaSession" in navigator) {
    // 歌曲信息
    navigator.mediaSession.metadata = new MediaMetadata({
      title: data.name,
      artist: isDj
        ? "电台节目"
        : islocal
          ? data.artists
          : data.artists?.map((a) => a.name)?.join(" & "),
      album: isDj ? "电台节目" : islocal ? data.album : data.album.name,
      artwork: islocal
        ? [
          {
            src: cover,
            sizes: "1024x1024",
          },
        ]
        : [
          {
            src: cover?.s,
            sizes: "100x100",
          },
          {
            src: cover?.m,
            sizes: "300x300",
          },
          {
            src: cover?.l,
            sizes: "1024x1024",
          },
        ],
      length: data?.duration,
    });
    // 按键关联
    navigator.mediaSession.setActionHandler("play", async () => {
      fadePlayOrPause("play");
    });
    navigator.mediaSession.setActionHandler("pause", async () => {
      fadePlayOrPause("pause");
    });
    navigator.mediaSession.setActionHandler("previoustrack", () => {
      changePlayIndex("prev", true);
    });
    navigator.mediaSession.setActionHandler("nexttrack", () => {
      changePlayIndex("next", true);
    });
  }
};

/**
 * 从封面图像中提取主要颜色，并根据亮度进行选择
 * @param {string} islocal - 是否为本地歌曲
 * @param {string} cover - 封面图像的URL或数据
 * @returns {string} - 主要颜色的RGB十六进制表示
 */
const getColorMainColor = async (islocal, cover) => {
  const status = siteStatus();
  try {
    // 获取封面图像的URL
    if (!cover) return (status.coverTheme = {});
    const colorUrl = islocal ? cover : cover.s;
    // 获取渐变色背景
    const gradientColor = await getCoverGradient(colorUrl);
    status.coverBackground = gradientColor;
  } catch (error) {
    console.error("封面颜色获取失败：", error);
    status.coverTheme = {};
  }
};

/**
 * 生成频谱数据 - 快速傅里叶变换（ FFT ）
 * @param {Object} sound - Howler.js 的音频对象
 * @returns {void}
 */
export const processSpectrum = (sound) => {
  try {
    if (!spectrumsData.audioCtx) {
      // 断开之前的连接
      spectrumsData.audio?.disconnect();
      spectrumsData.analyser?.disconnect();
      spectrumsData.audioCtx?.close();
      // 创建新的连接
      spectrumsData.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      // 获取音频元素
      const audioDom = sound._sounds[0]._node;
      // 允许跨域请求
      audioDom.crossOrigin = "anonymous";
      // 创建音频源和分析器
      const source = spectrumsData.audioCtx.createMediaElementSource(audioDom);
      const analyser = spectrumsData.audioCtx.createAnalyser();
      // 频谱分析器 FFT
      analyser.fftSize = 512;
      // 连接音频源和分析器，再连接至音频上下文的目标
      source.connect(analyser);
      analyser.connect(spectrumsData.audioCtx.destination);
      // 更新频谱数据
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      updateSpectrums(analyser, dataArray);
      // 保存当前链接
      spectrumsData.audio = source;
      spectrumsData.analyser = analyser;
    }
  } catch (err) {
    console.error("音乐频谱生成失败：" + err);
  }
};

/**
 * 更新音乐频谱数据
 * @param {Object} analyser - 音频分析器
 * @param {Uint8Array} dataArray - 频谱数据数组
 */
const updateSpectrums = (analyser, dataArray) => {
  // pinia
  const status = siteStatus();
  // 获取频率数据
  analyser.getByteFrequencyData(dataArray);
  status.spectrumsData = [...dataArray];
  // 计算 scale
  const averageAmplitude = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
  status.spectrumsScaleData = (averageAmplitude / 512 + 1).toFixed(2);
  // 递归调用，持续更新频谱数据
  requestAnimationFrame(() => {
    updateSpectrums(analyser, dataArray);
  });
};

/**
 * 获取当前播放歌曲名
 */
const getPlaySongName = () => {
  // pinia
  const status = siteStatus();
  const music = musicData();
  const playSongData = music.getPlaySongData;
  // 返回歌曲数据
  const songName = playSongData.name || "未知曲目";
  const songArtist =
    status.playMode === "dj"
      ? "电台节目"
      : Array.isArray(playSongData.artists)
        ? playSongData.artists.map((ar) => ar.name).join(" / ")
        : playSongData.artists || "未知歌手";
  return songName + " - " + songArtist;
};

/**
 * 播放所有歌曲
 * @param {Array} playlist - 包含歌曲信息的数组
 * @param {string} mode - 播放模式
 */
export const playAllSongs = async (playlist, mode = "normal") => {
  try {
    // pinia
    const music = musicData();
    const status = siteStatus();
    if (!playlist) return false;
    // 关闭心动模式
    status.playHeartbeatMode = false;
    // 更改模式和歌单
    status.playMode = mode;
    music.playList = playlist.slice();
    // 是否处于歌单内
    const songId = music.getPlaySongData?.id;
    const existingIndex = playlist.findIndex((song) => song.id === songId);
    // 若不处于
    if (existingIndex === -1 || !songId) {
      console.log("不在歌单内");
      music.playSongData = playlist[0];
      status.playIndex = 0;
      // 初始化播放器
      await initPlayer(true);
    } else {
      console.log("处于歌单内");
      music.playSongData = playlist[existingIndex];
      status.playIndex = existingIndex;
      // 播放
      fadePlayOrPause();
    }
    // 获取封面
    if (music.getPlaySongData?.path) {
      music.playSongData.localCover = await getLocalCoverData(music.getPlaySongData?.path);
    }
    $message.info("已开始播放", { showIcon: false });
  } catch (error) {
    console.error("播放全部歌曲出错：", error);
    $message.error("播放全部歌曲出现错误");
  }
};

/*
 * 清除定时器
 */
const cleanAllInterval = () => {
  clearInterval(seekInterval);
  // clearInterval(justSeekInterval);
  cancelAnimationFrame(justSeekInterval);
  seekInterval = null;
  justSeekInterval = null;
};

/**
 * 更新定时器
 */
const setAllInterval = () => {
  cleanAllInterval();
  // 启动定时器
  seekInterval = setInterval(() => setAudioTime(), 250);
  // justSeekInterval = setInterval(() => justSetSeek(), 17);
  justSeekInterval = requestAnimationFrame(justSetSeek);
};

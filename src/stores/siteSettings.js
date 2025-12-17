// 站点设置
import { defineStore } from "pinia";

const useSiteSettingsStore = defineStore("siteSettings", {
  state: () => {
    return {
      // 基础配置
      readProtocol: false,
      closeTip: true, // 关闭软件提醒弹窗
      closeType: "hide", // 关闭方式 close 直接关闭 / hide 最小化到任务栏
      showTaskbarProgress: false, // 显示歌曲任务栏进度
      showSearchHistory: true, // 搜索历史
      autoSignIn: false, // 自动签到
      showGithub: true, //展示Github仓库
      showSider: true, // 显示侧边栏
      siderShowCover: false, // 侧边栏显示封面
      autoCheckUpdates: true, // 自动检查更新
      systemFonts: "HarmonyOS Sans", // 全局字体 (仅 Electron)
      justLyricArea: false, // 仅在歌词区域生效
      hiddenVipTags: false, // 隐藏 VIP 标签
      webFonts: "LXGW WenKai", // 网页字体
      fontBold: true, // 字体加粗
      showVersion: false, // 显示版本号
      // 主题部分
      themeType: "dark",
      themeAuto: false,
      themeTypeName: "red",
      themeTypeData: {},
      themeAutoCover: false, // 主题色跟随封面
      themeAutoCoverType: "secondary",
      // 播放部分
      playCoverType: "cover", // 播放器样式
      songLevel: "exhigh", // 歌曲音质
      autoPlay: false, // 程序启动时自动播放
      songVolumeFade: true, // 歌曲渐入渐出
      useUnmServer: true, // 是否使用网易云解灰
      countDownShow: true, // 是否显示前奏等待
      bottomLyricShow: true, // 底栏歌词显示
      playerBackgroundType: "blur", // 播放器背景类别  animation 流动 / blur 模糊
      memorySeek: true, // 记忆上次播放位置
      playSearch: false, // 是否播放全部搜索结果
      showPlaylistCount: true, // 是否显示播放列表数量
      showSpectrums: false, // 是否显示音乐频谱
      useMusicCache: false, // 是否采用音乐缓存
      customMusicSource: "pyncmd,bodian,qq,migu,kugou", // 自定义音乐源
      // 数量部分
      loadSize: 50, // 每页加载数量
      // 歌词部分
      lrcMousePause: false, // 鼠标移入歌词区域暂停滚动
      lyricsFontSize: 36, // 歌词大小
      lyricsFont: "HarmonyOS sans", // 歌词字体
      lyricsBlur: true, // 歌词模糊
      lyricsBold: true, // 歌词加粗
      showYrc: true, // 是否显示逐字歌词
      showYrcAnimation: true, // 是否显示逐字歌词动画
      lyricsPosition: "left", // 歌词位置
      lyricsBlock: "start", // 歌词滚动位置
      alignAnchor: "top", // 歌词对齐位置
      showTransl: true, // 是否显示歌词翻译
      showRoma: true, // 是否显示歌词音译
      useAMLyrics: false, // 使用苹果音乐歌词
      useAMSpring: false, // 使用苹果音乐歌词弹簧动画
      /* AMLL歌词参数设置 */
      useTTMLFormat: false, // 使用TTML格式歌词
      springParams: { // 弹簧参数
        posX: {
          mass: 1,
          damping: 10,
          stiffness: 100
        },
        posY: {
          mass: 1,
          damping: 15,
          stiffness: 100
        },
        scale: {
          mass: 1,
          damping: 20,
          stiffness: 100
        }
      },
      // 下载部分
      downloadPath: null, // 默认下载路径
      downloadMeta: true, // 同时下载元信息
      downloadCover: true, // 同时下载封面
      downloadLyrics: true, // 同时下载歌词
      downloadLyricsToFile: true,
      downloadCoverToFile: true,
      // 网络部分
      useCustomNCMServer: false, // 是否使用自定义NCM服务器
      ncmServer: "https://music-api.example.com", // NCM服务器
      useCustomUNMServer: false, // 是否使用自定义UNM服务器
      unmServer: "https://unm-server.example.com", // UNM服务器
      useRealIP: true, // 是否使用真实IP地址
      realIP: "116.25.146.177", // 真实IP地址
      proxyProtocol: "off", // 代理协议
      proxyServe: "127.0.0.1", // 代理地址
      proxyPort: 80, // 代理端口
    };
  },
  getters: {},
  actions: {
    // 调整主题类别
    setThemeType(value) {
      this.themeType = value;
      this.themeAuto = false;
      $message.info(`已切换至${value === "light" ? "浅色" : "深色"}模式`, { showIcon: false });
    },
    setLyricStyle(style) { 
      this.lyricsStyle = style;
      if (style === 'apple-music') { 
        this.justLyricArea = true;
      }
    },
    // 更改系统字体
    changeSystemFonts(font = this.webFonts) {
      this.webFonts = font;
      const root = document.documentElement;
      if (!root) return false;
      root.style.setProperty(
        "--main-font-family",
        `"${font}", "HarmonyOS_Regular", system-ui, -apple-system, sans-serif`,
      );
    },
    changeLyricsFonts(font = this.lyricsFont) {
      this.lyricsFont = font;
      const root = document.documentElement;
      if (!root) return false;
      root.style.setProperty(
        "--main-font-family-lyric",
        `"${font}", "HarmonyOS_Regular", system-ui, -apple-system, sans-serif`,
      );
    }
  },
  
  // 数据持久化
  persist: [
    {
      key: "siteSettings",
      storage: localStorage,
    },
  ],
});

export default useSiteSettingsStore;

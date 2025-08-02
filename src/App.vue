<template>
  <Provider>
    <!--userAgreement ref="userAgreementRef"/-->
    <!-- 主框架 -->
    <n-layout :class="['all-layout', { 'full-player': showFullPlayer }]">
      <!-- 导航栏 -->
      <n-layout-header bordered>
        <MainNav />
      </n-layout-header>
      <!-- 主内容 - 有侧边栏 -->
      <n-layout
        v-if="showSider"
        :class="{
          'body-layout': true,
          'player-bar': music.getPlaySongData?.id && showPlayBar,
        }"
        position="absolute"
        has-sider
      >
        <!-- 侧边栏 -->
        <n-layout-sider
          :collapsed="asideMenuCollapsed"
          :native-scrollbar="false"
          :collapsed-width="64"
          :width="240"
          class="main-sider"
          show-trigger="bar"
          collapse-mode="width"
          bordered
          @collapse="asideMenuCollapsed = true"
          @expand="asideMenuCollapsed = false"
        >
          <div class="sider-all">
            <Menu />
          </div>
        </n-layout-sider>
        <!-- 页面区 -->
        <n-layout :native-scrollbar="false" embedded>
          <MainLayout />
        </n-layout>
      </n-layout>
      <!-- 主内容 - 无侧边栏 -->
      <n-layout-content
        v-else
        :class="{
          'body-layout': true,
          'player-bar': music.getPlaySongData?.id && showPlayBar,
        }"
        :native-scrollbar="false"
        position="absolute"
        embedded
      >
        <MainLayout />
      </n-layout-content>
    </n-layout>
    <!-- 主播放器 -->
    <MainControl />
    <!-- 全屏播放器 -->
    <FullPlayer />
    <!-- 全局播放列表 -->
    <n-config-provider v-if="showFullPlayer" :theme="darkTheme">
      <Playlist />
    </n-config-provider>
    <Playlist v-else />
    
    <!-- 全局水印 -->
    <!--n-watermark
      :font-size="16"
      :line-height="16"
      :width="384"
      :height="384"
      :x-offset="'calc(100vw - 384 - 20)'"
      :y-offset="'calc(100vh - 384 - 40)'"
      content="当前版本为测试版本, 不代表最终品质"
      cross
      fullscreen="false"
    /-->
  
  </Provider>
</template>

<script setup>
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
import { darkTheme, NButton } from "naive-ui";
import { musicData, siteStatus, siteSettings } from "@/stores";
import { checkPlatform } from "@/utils/helper";
import { initPlayer } from "@/utils/Player";
import userAgreement from "@/components/Modal/UserAgreement.vue";
import userSignIn from "@/utils/userSignIn";
import globalShortcut from "@/utils/globalShortcut";
import globalEvents from "@/utils/globalEvents";
import packageJson from "@/../package.json";

const router = useRouter();
const music = musicData();
const status = siteStatus();
const settings = siteSettings();
const { autoPlay, showSider, autoSignIn, autoCheckUpdates } = storeToRefs(settings);
const { showPlayBar, asideMenuCollapsed, showFullPlayer } = storeToRefs(status);
const userAgreementRef = ref(null);

// 公告数据
const annShow =
  import.meta.env.RENDERER_VITE_ANN_TITLE && import.meta.env.RENDERER_VITE_ANN_CONTENT
    ? true
    : false;
const annType = import.meta.env.RENDERER_VITE_ANN_TYPE;
const annTitle = import.meta.env.RENDERER_VITE_ANN_TITLE;
const annContene = import.meta.env.RENDERER_VITE_ANN_CONTENT;
const annDuration = Number(import.meta.env.RENDERER_VITE_ANN_DURATION);

// PWA
if ("serviceWorker" in navigator) {
  // 更新完成提醒
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (checkPlatform.electron()) {
      $notification.create({
        title: "🎉 有更新啦",
        content: "检测到软件内资源有更新，是否重新启动软件以应用更新？",
        meta: "当前版本 v " + (packageJson.version || "1.0.0"),
        action: () =>
          h(
            NButton,
            {
              text: true,
              type: "primary",
              onClick: () => {
                electron.ipcRenderer.send("window-relaunch");
              },
            },
            {
              default: () => "更新",
            },
          ),
        onAfterLeave: () => {
          $message.info("已取消本次更新，更新将在下次启动软件后生效", {
            duration: 6000,
          });
        },
      });
    } else {
      console.info("站点资源有更新，请刷新以应用更新");
      $notification.create({
        title: "🎉 有更新啦",
        content: "检测到网站内资源有更新，是否刷新网站以应用更新？",
        meta: "当前版本 v " + (packageJson.version || "1.0.0"),
        action: () =>
          h(
            NButton,
            {
              text: true,
              type: "primary",
              onClick: () => {
                window.location.reload(true);
              },
            },
            {
              default: () => "更新",
            },
          ),
        onAfterLeave: () => {
          $message.info("已取消本次更新，更新将在下次启动软件后生效", {
            duration: 6000,
          });
        },
      });
    }
  });
}

// 自动检查更新
const checkUpdates = () => {
  if (!checkPlatform.electron()) return false;
  electron.ipcRenderer.send("check-updates");
};

// 显示公告
const showAnnouncements = () => {
  if (annShow) {
    $notification[annType]({
      content: annTitle,
      meta: annContene,
      duration: annDuration,
    });
  }
};


// 检查PWA更新
const checkUpdatesWeb = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      const update = await registration.update();
      
      if (update) {
        console.info('正在检查PWA更新...');
      }
    } catch (error) {
      console.error('PWA更新检查失败:', error);
      $message.error('PWA更新检查失败, 请尝试在"其他"设置中清除PWA缓存', {
        duration: 2000
      });
    }
  }
};

const readProtocol = async () => {
  const storedSettings = JSON.parse(localStorage.getItem('siteSettings') || '{}');
  if (!storedSettings.readProtocol) {
    userAgreementRef.value.showModal = true;
  }
}
// 站点源代码出现错误 or 网络出现问题
const canNotConnect = (error) => {
  console.error("网络连接错误：", error.message);
  /*
  $dialog.destroyAll();
  $dialog.error({
    title: "呃, 好像出了点问题(っ °Д °;)っ",
    content: "如果是源代码出现问题, 请联系开发者解决; 如果是您的网络出现问题, 请检查您的网络适配器后重试",
    positiveText: "刷新网页",
    negativeText: "关闭弹窗",
    onPositiveClick: () => {
      location.reload();
    },
  });
  */
  $notification.error({
    content: "呃, 好像出了点问题(っ °Д °;)っ",
    meta: "如果是源代码出现问题, 请联系开发者解决; 如果是您的网络出现问题, 请检查您的网络适配器后重试",
    duration: 5000,
  });
  $message.error("网络连接错误：" + error.message, {
    duration: 0,
    closable: true, 
  })
};

// 网页端键盘事件
const handleKeyUp = (event) => {
  globalShortcut(event, router);
};

onMounted(async () => {
  // 挂载方法
  window.$canNotConnect = canNotConnect;
  // 主播放器
  await initPlayer(autoPlay.value);
  // 初始化字体设置
  try {
    const storedSettings = JSON.parse(localStorage.getItem('siteSettings') || '{}');
    const { webFonts, fontBold, lyricsFont } = storedSettings;
    if (webFonts && lyricsFont) {
      document.documentElement.style.setProperty('--main-font-family', `"${webFonts}", system-ui, -apple-system, sans-serif`);
      document.documentElement.style.setProperty('--main-font-family-lyric', `"${lyricsFont}", system-ui, -apple-system, sans-serif`);
    }
    if (typeof fontBold === 'boolean') {
      document.documentElement.style.setProperty('font-weight', fontBold ? 'bold' : 'normal');
    }
  } catch (error) {
    console.warn('初始化字体设置失败:', error);
  }
  // 更改全局字体
  settings.changeSystemFonts();
  // 全局事件
  globalEvents(router);
  // 键盘监听
  if (!checkPlatform.electron()) {
    window.addEventListener("keyup", handleKeyUp);
  }
  // 自动签到
  if (autoSignIn.value) await userSignIn();
  // 检查更新
  // if (autoCheckUpdates.value) checkUpdates();
  // 显示公告
  showAnnouncements();
  // 显示用户协议
  readProtocol();
  // 检查PWA更新
  checkUpdatesWeb();
});

onUnmounted(() => {
  if (!checkPlatform.electron()) window.removeEventListener("keyup", handleKeyUp);
});
</script>

<style lang="scss" scoped>
.all-layout {
  height: 100%;
  transition:
    transform 0.3s,
    opacity 0.3s;
  .n-layout-header {
    height: 60px;
    display: flex;
    flex-direction: row;
    align-items: center;
    -webkit-app-region: drag;
  }
  .body-layout {
    top: 60px;
    transition: bottom 0.3s;
    .main-sider {
      :deep(.n-scrollbar-content) {
        height: 100%;
      }
      .sider-all {
        height: 100%;
      }
      @media (max-width: 900px) {
        display: none;
      }
    }
    &.player-bar {
      bottom: 80px;
    }
  }
  &.full-player {
    opacity: 0;
    transform: scale(0.9);
  }
}
</style>

<!-- 全局设置 -->
<template>
  <div :class="{ setting: true, 'use-cover': themeAutoCover }">
    <PageTransition type="fade-down" :duration="0.8">
      <n-h1 class="title">
        <n-text>站点设置</n-text>
      </n-h1>
    </PageTransition>
    <!-- 导航栏 -->
    <PageTransition type="fade-up" :duration="0.8" :delay="0.2">
      <n-tabs
        ref="setTabsRef"
        v-model:value="setTabsValue"
        type="segment"
        @update:value="settingTabChange"
      >
        <n-tab name="setTab1"> 常规 </n-tab>
        <n-tab name="setTab2"> 系统 </n-tab>
        <n-tab name="setTab3"> 播放 </n-tab>
        <n-tab name="setTab4"> 歌词 </n-tab>
        <!-- 调整顺序：快捷键在歌词之后、下载之前 -->
        <n-tab name="setTab5"> 快捷键 </n-tab>
        <n-tab name="setTab6"> 下载 </n-tab>
        <n-tab name="setTab7"> 其他 </n-tab>
        <!--n-tab name="setTab7"> TestOptions </n-tab-->
      </n-tabs>
    </PageTransition>
    <!-- 设置项 -->
    <n-scrollbar
      ref="setScrollRef"
      :style="{
        height: `calc(100vh - ${music.getPlaySongData?.id && showPlayBar ? 328 : 248}px)`,
      }"
      class="all-set"
      @scroll="allSetScroll"
    >
      <PageTransition type="fade-up" :duration="0.8" :delay="0.4">
        <!-- 常规 -->
        <General />
        <!-- 系统 -->
        <System />
        <!-- 播放 -->
        <Player />
        <!-- 歌词 -->
        <Lyrics />
        <!-- 快捷键（调整到下载之前） -->
        <KeyboardSetting />
        <!-- 下载 -->
        <Download />
        <!-- 其他 -->
        <Other />
        <!--TestOptions-->
        <!--TestOptions /-->
      </PageTransition>
    </n-scrollbar>
  </div>
</template>

<script setup>
import { storeToRefs } from "pinia";
import { siteSettings, siteStatus, musicData } from "@/stores";
import debounce from "@/utils/debounce";
import packageJson from "@/../package.json";
// 设置子项
import General from "@/views/Setting/general.vue";
import System from "@/views/Setting/system.vue";
import Player from "@/views/Setting/player.vue";
import Lyrics from "@/views/Setting/lyrics.vue";
import Download from "@/views/Setting/download.vue";
import Other from "@/views/Setting/other.vue";
// 新增：导入快捷键设置组件
import KeyboardSetting from "@/views/Setting/KeyboardSetting.vue";
// import TestOptions from "@/views/Setting/testoptions.vue";

const music = musicData();
const status = siteStatus();
const settings = siteSettings();
const { showPlayBar } = storeToRefs(status);
const { themeAutoCover } = storeToRefs(settings);

// 标签页数据
const setTabsRef = ref(null);
const setScrollRef = ref(null);
const setTabsValue = ref("setTab1");
const isProgrammaticScrolling = ref(false);

// 标签页切换
const settingTabChange = (name) => {
  const index = Number(name.replace("setTab", ""));
  const setDom = document.querySelectorAll(".set-type")?.[index - 1];
  if (!setDom) return false;
  // 滚动至设置分类
  isProgrammaticScrolling.value = true;
  setTabsValue.value = name;
  setDom.scrollIntoView({ behavior: "smooth" });
  setTimeout(() => {
    isProgrammaticScrolling.value = false;
  }, 700);
};

// 设置列表滚动
const allSetScroll = debounce((e) => {
  if (isProgrammaticScrolling.value) return;
  const distance = e.target.scrollTop + 30;
  const allSetDom = document.querySelectorAll(".set-type");
  allSetDom.forEach((v, i) => {
    if (distance >= v.offsetTop) setTabsValue.value = `setTab${i + 1}`;
  });
}, 100);

/* 跳转
const jump = () => {
  window.open(packageJson.github);
};
*/
</script>

<style lang="scss" scoped>
.setting {
  max-width: 1200px;
  margin: 0 auto;
  .title {
    display: flex;
    flex-direction: row;
    align-items: flex-end;
    height: 58px;
    margin: 20px 0;
    font-size: 36px;
    font-weight: bold;
    .copyright {
      display: flex;
      flex-direction: row;
      align-items: center;
      margin-left: 12px;
      margin-bottom: 6px;
      font-size: 16px;
      font-weight: normal;
      cursor: pointer;
      .author {
        display: flex;
        align-items: center;
        &::after {
          content: "/";
          transform: translateY(2px);
          font-size: 14px;
          margin: 0 6px;
          opacity: 0.6;
        }
        .author-text {
          margin-left: 6px;
        }
      }
      .version {
        &::before {
          content: "v";
          margin-right: 2px;
        }
      }
    }
  }
  .n-tabs {
    height: 42px;
  }
  :deep(.set-type) {
    padding-top: 30px;
    .n-collapse {
      background-color: transparent;
      border: none;
      :deep(.n-collapse-item) {
        margin-bottom: 16px;
        border: none;
        .n-collapse-item__header {
          font-size: 16px;
          font-weight: bold;
          border: none;
          background-color: transparent;
        }
        .n-collapse-item__content-wrapper {
          border: none;
        }
        .n-collapse-item__content-inner {
          padding: 8px 0;
        }
      }
    }
    .set-item {
      width: 100%;
      border-radius: 8px;
      margin-bottom: 12px;
      background-color: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      &:last-child {
        margin-bottom: 0;
      }
      .n-card__content {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        padding: 24px;
      }
      .name {
        margin-bottom: 8px;
        font-size: 14px;
        display: flex;
        flex-direction: column;
        padding-right: 20px;
        .dev {
          display: flex;
          flex-direction: row;
          align-items: center;
          .n-tag {
            margin-left: 6px;
          }
        }
        .tip {
          display: block;
          margin-top: 4px;
          font-size: 12px;
          opacity: 0.8;
        }
      }
      .set {
        width: 200px;
        @media (max-width: 768px) {
          width: 140px;
          min-width: 140px;
        }
      }
    }
  }
  &.use-cover {
    .n-switch {
      &.n-switch--active {
        :deep(.n-switch__rail) {
          background-color: var(--main-second-color);
        }
      }
    }
  }
}
</style>

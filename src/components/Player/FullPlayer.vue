<!-- 播放器 - 全屏 -->
<template>
  <Transition name="up" mode="out-in">
    <div
      v-if="showFullPlayer"
      :style="{
        '--cover-main-color': `rgb(${coverTheme?.light?.shadeTwo})` || '#efefef',
        '--cover-second-color': `rgba(${coverTheme?.light?.shadeTwo}, 0.14)` || '#efefef14',
        '--cover-bg': coverBackground,
        cursor: playerControlShow ? 'auto' : 'none',
      }"
      class="full-player"
      @mousemove="controlShowChange"
      @mouseleave="closePlayerControlShow"
    >
      <!-- 遮罩 -->
      <Transition name="fade" mode="out-in">
        <div
          :key="`${playerBackgroundType}-${coverBackground}-${
            music.getPlaySongData?.coverSize?.s || music.getPlaySongData?.localCover
          }`"
          :class="['overlay', playerBackgroundType]"
        >
          <!-- 模糊背景 -->
          <template v-if="playerBackgroundType === 'blur'">
            <img
              class="overlay-img"
              :src="music.getPlaySongData?.coverSize?.s || music.getPlaySongData?.localCover"
              alt="overlay"
            />
          </template>
          <!-- AMLL流动背景 -->
          <template v-else-if="playerBackgroundType === 'animation'">
            <BackgroundRender
              :album="music.getPlaySongData?.coverSize?.s || music.getPlaySongData?.localCover"
              :playing="playState"
              :flow-speed="1.0"
              :render-scale="0.5"
              :has-lyric="isHasLrc"
              :fps="60"
            />
          </template>
          <!-- 传统流动背景（备用） -->
          <template v-else-if="playerBackgroundType === 'animation-legacy'">
            <img
              v-for="item in 4"
              :key="item"
              :src="music.getPlaySongData?.coverSize?.s || music.getPlaySongData?.localCover"
              :style="{
                transform: `rotate(${item * 180}deg)`,
              }"
              class="overlay-img"
              alt="overlay"
            />
          </template>
        </div>
      </Transition>
      <!-- 按钮 -->
      <Transition name="fade" mode="out-in">
        <div v-show="playerControlShow" class="menu">
          <div class="left">
            <!-- 设置按钮 -->
            <n-icon size="28" @click="showSettings">
              <SvgIcon icon="round-settings" />
            </n-icon>
            <!-- 歌词模式 -->
            <n-icon
              v-if="isHasLrc && playMode !== 'dj'"
              :class="['lrc-open', { open: pureLyricMode }]"
              size="28"
              @click="pureLyricMode = !pureLyricMode"
              class="settings-icon"
            >
              <SvgIcon icon="lrc-text" />
            </n-icon>
          </div>
          <div class="center" />
          <div class="right">
            <!-- 全屏切换 -->
            <n-icon class="hidden" @click.stop="screenfullChange">
              <SvgIcon
                :icon="screenfullStatus ? 'fullscreen-exit-rounded' : 'fullscreen-rounded'"
              />
            </n-icon>
            <!-- 关闭 -->
            <n-icon v-if="!screenfullStatus" @click.stop="showFullPlayer = false">
              <SvgIcon icon="keyboard-arrow-down-rounded" />
            </n-icon>
          </div>
        </div>
      </Transition>
      <!-- 主播放器内容 -->
      <Transition name="fade" mode="out-in">
        <div
          :key="`${pureLyricMode}-${playCoverType}-${isHasLrc}-${music.getPlaySongData?.id}`"
          class="main-player"
        >
          <div
            v-show="!(pureLyricMode && isHasLrc) || playMode === 'dj'"
            :class="['content', { 'no-lrc': !isHasLrc || playMode === 'dj' }]"
          >
            <!-- 封面 -->
            <PlayerCover />
            <!-- 信息 -->
            <div
              v-show="playCoverType === 'cover' || !isHasLrc || playMode === 'dj'"
              :class="['data', playCoverType]"
            >
              <div class="desc">
                <div class="title">
                  <span class="name">{{ music.getPlaySongData.name || "未知曲目" }}</span>
                  <n-popover :show-arrow="false" placement="right-start" trigger="hover" raw>
                    <template #trigger>
                      <n-tag
                        v-show="playUseOtherSource"
                        :style="{
                          color: `rgb(${coverTheme?.light?.shadeTwo})` || '#efefef',
                          backgroundColor:
                            `rgba(${coverTheme?.light?.shadeTwo}, 0.14)` || '#efefef14',
                        }"
                        round
                      >
                        其他音源
                      </n-tag>
                    </template>
                    <div
                      :style="{
                        color: `rgb(${coverTheme?.light?.shadeTwo})` || '#efefef',
                        backgroundColor:
                          `rgba(${coverTheme?.light?.shadeTwo}, 0.14)` || '#efefef14',
                      }"
                      class="title-tip"
                    >
                      <span>已经使用UnblockNeteaseMusic的第三方音源, 可能会出现匹配不准确的问题</span>
                    </div>
                  </n-popover>
                </div>
                <span v-if="music.getPlaySongData.alia" class="alia">
                  {{ music.getPlaySongData.alia }}
                </span>
                <div v-if="playMode !== 'dj'" class="artist">
                  <n-icon depth="3" size="20">
                    <SvgIcon icon="account-music" />
                  </n-icon>
                  <div v-if="Array.isArray(music.getPlaySongData.artists)" class="all-ar">
                    <span
                      v-for="ar in music.getPlaySongData.artists"
                      :key="ar.id"
                      class="ar"
                      @click.stop="
                        () => {
                          showFullPlayer = false;
                          router.push(`/artist?id=${ar.id}`);
                        }
                      "
                    >
                      {{ ar.name }}
                    </span>
                  </div>
                  <div v-else class="all-ar">
                    <span class="ar"> {{ music.getPlaySongData.artists || "未知艺术家" }} </span>
                  </div>
                </div>
                <div
                  v-if="playMode !== 'dj'"
                  class="album"
                  @click.stop="
                    () => {
                      if (typeof music.getPlaySongData.album !== 'string') {
                        showFullPlayer = false;
                        router.push(`/album?id=${music.getPlaySongData?.album.id}`);
                      }
                    }
                  "
                >
                  <n-icon depth="3" size="20">
                    <SvgIcon icon="album" />
                  </n-icon>
                  <span v-if="music.getPlaySongData.album" class="al">
                    {{
                      typeof music.getPlaySongData.album === "string"
                        ? music.getPlaySongData.album
                        : music.getPlaySongData.album.name
                    }}
                  </span>
                  <span v-else class="album">可莉也不知道专辑是什么~(误)</span>
                </div>
                <div
                  v-if="playMode === 'dj'"
                  class="dj"
                  @click.stop="
                    () => {
                      if (!playSongSource) return;
                      showFullPlayer = false;
                      router.push(`/dj?id=${playSongSource}`);
                    }
                  "
                >
                  <n-icon depth="3" size="20">
                    <SvgIcon icon="record" />
                  </n-icon>
                  <span class="dj-name">
                    {{ music.getPlaySongData.creator?.brand || "未知电台" }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div v-if="playMode !== 'dj'" :class="['right', { pure: pureLyricMode && isHasLrc }]">
            <!-- 唱片模式下信息 -->
            <div
              v-show="(pureLyricMode && isHasLrc) || (playCoverType === 'record' && isHasLrc)"
              class="data"
            >
              <div class="name">
                <span class="name-text">{{ music.getPlaySongData.name || "未知曲目" }}</span>
                <span v-if="music.getPlaySongData.alia" class="name-alias">
                  {{ music.getPlaySongData.alia }}
                </span>
              </div>
              <div class="other">
                <div class="artist">
                  <n-icon depth="3" size="20">
                    <SvgIcon icon="account-music" />
                  </n-icon>
                  <div v-if="Array.isArray(music.getPlaySongData.artists)" class="all-ar">
                    <span
                      v-for="ar in music.getPlaySongData.artists"
                      :key="ar.id"
                      class="ar"
                      @click.stop="
                        () => {
                          showFullPlayer = false;
                          router.push(`/artist?id=${ar.id}`);
                        }
                      "
                    >
                      {{ ar.name }}
                    </span>
                  </div>
                  <div v-else class="all-ar">
                    <span class="ar"> {{ music.getPlaySongData.artists || "未知艺术家" }} </span>
                  </div>
                </div>
                <div
                  class="album"
                  @click.stop="
                    () => {
                      if (typeof music.getPlaySongData.album !== 'string') {
                        showFullPlayer = false;
                        router.push(`/album?id=${music.getPlaySongData?.album.id}`);
                      }
                    }
                  "
                >
                  <n-icon depth="3" size="20">
                    <SvgIcon icon="album" />
                  </n-icon>
                  <span v-if="music.getPlaySongData.album" class="al">
                    {{
                      typeof music.getPlaySongData.album === "string"
                        ? music.getPlaySongData.album
                        : music.getPlaySongData.album.name
                    }}
                  </span>
                  <span v-else class="album">未知专辑</span>
                </div>
              </div>
            </div>
            <!-- 歌词 -->
            <Lyric 
              v-if="!useAMLyrics" 
              :cursorShow="playerControlShow" 
            />
            <!-- AMLL歌词组件 -->
            <AMLyric
              v-else
              :cursorShow="playerControlShow"
              class="amll-lyric-container"
            />
          </div>
        </div>
      </Transition>
      <!-- 控制中心 -->
      <PlayerControl class="player-control"/>
      <!-- 音乐频谱 -->
      <Spectrum v-if="showSpectrums" :show="!playerControlShow" :height="60" />
      <!-- 设置弹窗 -->
      <Settings ref="settingsRef" />
    </div>
  </Transition>
</template>

<script setup>
import { ref } from 'vue';
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
import { musicData, siteStatus, siteSettings } from "@/stores";
import screenfull from "screenfull";
import throttle from "@/utils/throttle";
import SvgIcon from "@/components/Global/SvgIcon";
import Settings from "@/components/Modal/Settings.vue";
import AMLyric from "./AMLyric.vue";
import BackgroundRender from "./BackgroundRender.vue";
import Lyric from "./Lyric.vue";
import PlayerControl from "./PlayerControl.vue";
import PlayerCover from "./PlayerCover.vue";
import Spectrum from "./Spectrum.vue";

const router = useRouter();
const music = musicData();
const status = siteStatus();
const settings = siteSettings();
const { playList, playSongLyric, playSongSource } = storeToRefs(music);
const { playerBackgroundType, showYrc, playCoverType, showSpectrums, useAMLyrics } = storeToRefs(settings);

const {
  playerControlShow,
  controlTimeOut,
  showFullPlayer,
  playUseOtherSource,
  coverTheme,
  coverBackground,
  pureLyricMode,
  playMode,
  playState,
} = storeToRefs(status);


// 是否有歌词
const isHasLrc = computed(() => {
  return playSongLyric.value.lrc?.[0] && playSongLyric.value.lrc?.length > 4;
});

// 全屏状态
const screenfullStatus = ref(false);

// 全屏切换
const screenfullChange = () => {
  if (screenfull.isEnabled) {
    screenfull.toggle();
    screenfullStatus.value = screenfull.isFullscreen ? false : true;
  }
};

// 关闭控制中心
const closePlayerControlShow = () => {
  if (window.innerWidth <= 700) return false;
  playerControlShow.value = false;
};

// 控制中心显隐
const controlShowChange = throttle(() => {
  playerControlShow.value = true;
  if (window.innerWidth <= 700) return false;
  if (controlTimeOut.value) {
    clearTimeout(controlTimeOut.value);
  }
  controlTimeOut.value = setTimeout(() => {
    playerControlShow.value = false;
  }, 2000);
}, 300);

// 打开设置弹窗
const settingsRef = ref(null);
const showSettings = () => {
  if (settingsRef.value) {
    settingsRef.value.showModal();
  }
};

// 监听播放器开启
watch(
  () => showFullPlayer.value,
  (val) => {
    // 性能提示
    if (val && showYrc.value && playList.value?.length >= 400) {
      // $message.warning("当前播放歌曲数量过多，逐字歌词动画已降低帧数");
    }
  },
);

onUnmounted(() => {
  clearTimeout(controlTimeOut.value);
});



</script>

<style lang="scss" scoped>
.full-player {
  position: fixed;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  color: var(--cover-main-color);
  background-color: #00000060;
  backdrop-filter: blur(80px);
  overflow: hidden;
  z-index: 100;
  // 遮罩
  .overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    z-index: -1;
    &::after {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: #00000060;
      backdrop-filter: blur(20px);
    }
    &.blur {
      display: flex;
      align-items: center;
      justify-content: center;
      .overlay-img {
        width: 150%;
        height: 150%;
        filter: blur(80px) contrast(1.2);
      }
    }
    &.animation {
      transform: scale(1.3);
      .overlay-img {
        position: absolute;
        width: 50%;
        height: 50%;
        filter: blur(80px) contrast(1.75);
        &:nth-of-type(1) {
          top: 0;
          left: 0;
          animation: coverRotate 62s infinite linear;
        }
        &:nth-of-type(2) {
          left: 0;
          bottom: 0;
          animation: coverRotate 55s infinite linear reverse;
        }
        &:nth-of-type(3) {
          bottom: 50%;
          right: 0;
          animation: coverRotate 58s infinite linear reverse;
        }
        &:nth-of-type(4) {
          bottom: 0;
          right: 0;
          animation: coverRotate 65s infinite linear;
        }
      }
    }
    &.gradient {
      background: var(--cover-bg);
    }
    &.none {
      &::after {
        display: none;
      }
    }
  }
  // 按钮
  .menu {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 80px;
    padding: 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    z-index: 2;
    box-sizing: border-box;
    -webkit-app-region: no-drag;
    .left,
    .right {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: flex-end;
    }
    .center {
      width: 100%;
      height: 100%;
      flex: 1;
      -webkit-app-region: drag;
    }
    .n-icon {
      margin-left: 12px;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 40px;
      opacity: 0.3;
      border-radius: 8px;
      transition:
        opacity 0.3s,
        transform 0.3s,
        background-color 0.3s;
      cursor: pointer;
      &:hover {
        background-color: #ffffff20;
        transform: scale(1.05);
        opacity: 1;
      }
      &:active {
        transform: scale(1);
      }
    }
    .left {
      justify-content: flex-start;
      .n-icon {
        margin-left: 0;
        &.lrc-open {
          &.open {
            opacity: 0.8;
          }
        }
      }
      .settings-icon {
        margin-left: 15px; // 增加间隔
      }
    }
  }
  .main-player {
    display: flex;
    flex-direction: row;
    align-items: center;
    width: 100%;
    height: 100%;
    // 内容
    .content {
      width: 50%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      transition:
        transform 0.3s,
        opacity 0.3s;
      margin-right: -20px;
      @media (min-width: 700px) {
        margin-left: -75px;
      }
      .data {
        width: 70%;
        max-width: 55vh;
        margin-top: 24px;
        padding: 0 2px;
        box-sizing: border-box;
        .desc {
          display: flex;
          flex-direction: column;
          .title {
            display: flex;
            align-items: center;
            margin-left: 4px;
            .name {
              font-size: 26px;
              font-weight: bold;
              color: var(--cover-main-color);
              -webkit-line-clamp: 2;
            }
            .n-tag {
              margin-left: 12px;
              cursor: pointer;
            }
          }
          .alia {
            margin: 6px 0 6px 2px;
            opacity: 0.6;
            font-size: 18px;
          }
          .artist {
            margin-top: 2px;
            display: flex;
            align-items: center;
            .n-icon {
              margin-right: 4px;
              color: var(--cover-main-color);
            }
            .all-ar {
              display: -webkit-box;
              -webkit-box-orient: vertical;
              -webkit-line-clamp: 2;
              overflow: hidden;
              word-break: break-all;
              .ar {
                font-size: 16px;
                opacity: 0.7;
                display: inline-flex;
                transition: opacity 0.3s;
                cursor: pointer;
                &::after {
                  content: "/";
                  margin: 0 4px;
                  transition: none;
                }
                &:last-child {
                  &::after {
                    display: none;
                  }
                }
                &:hover {
                  opacity: 1;
                }
              }
            }
          }
          .album {
            margin-top: 2px;
            font-size: 16px;
            display: flex;
            align-items: center;
            .n-icon {
              margin-right: 4px;
              color: var(--cover-main-color);
            }
            .al {
              opacity: 0.7;
              transition: opacity 0.3s;
              // -webkit-line-clamp: 2;
              cursor: pointer;
              &:hover {
                opacity: 1;
              }
            }
          }
          .dj {
            margin-top: 12px;
            font-size: 16px;
            display: flex;
            align-items: center;
            .n-icon {
              margin-right: 4px;
              color: var(--cover-main-color);
            }
            .dj-name {
              opacity: 0.7;
              transition: opacity 0.3s;
              -webkit-line-clamp: 2;
              cursor: pointer;
              &:hover {
                opacity: 1;
              }
            }
          }
        }
        &.record {
          width: 100%;
          margin-top: 20px;
          .desc {
            align-items: center;
            .title {
              .name {
                text-align: center;
              }
            }
          }
        }
      }
      &.no-lrc {
        transform: translateX(50%);
      }
    }
    .right {
      width: 50%;
      transition: width 0.3s;
      margin-left: -20px;
      .data {
        padding: 0 80px 0 24px;
        margin-bottom: 26px;
        .name {
          display: flex;
          flex-direction: column;
          font-size: 30px;
          font-weight: bold;
          .name-text {
            -webkit-line-clamp: 2;
          }
          .name-alias {
            margin-top: 6px;
            font-size: 18px;
            font-weight: normal;
            opacity: 0.6;
          }
        }
        .other {
          display: flex;
          flex-direction: column;
          margin-top: 8px;
          font-size: 16px;
          .n-icon {
            margin-right: 4px;
            color: var(--cover-main-color);
          }
          .artist {
            display: flex;
            align-items: center;
            margin-right: 12px;
            .all-ar {
              display: -webkit-box;
              -webkit-box-orient: vertical;
              -webkit-line-clamp: 2;
              overflow: hidden;
              word-break: break-all;
              .ar {
                opacity: 0.7;
                display: inline-flex;
                transition: opacity 0.3s;
                cursor: pointer;
                &::after {
                  content: "/";
                  margin: 0 4px;
                  transition: none;
                }
                &:last-child {
                  &::after {
                    display: none;
                  }
                }
                &:hover {
                  opacity: 1;
                }
              }
            }
          }
          .album {
            display: flex;
            align-items: center;
            margin-top: 4px;
            .al {
              opacity: 0.7;
              transition: opacity 0.3s;
              cursor: pointer;
              &:hover {
                opacity: 1;
              }
            }
          }
        }
      }
      &.pure {
        width: 100%;
        height: calc(100vh - 120px);
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 70px;
        .data {
          padding: 0 80px;
          display: flex;
          flex-direction: column;
          align-items: center;
          .other,
          .name {
            align-items: center;
          }
        }
      }
    }
  }
  // 全局
  span {
    display: -webkit-box;
    overflow: hidden;
    word-break: break-all;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
  }
  @media (max-width: 700px) {
    .menu {
      .hidden {
        display: none;
      }
    }
    .main-player {
      .content {
        width: 100%;
        .data {
          display: block !important;
          &.record {
            margin-top: 0;
          }
        }
        &.no-lrc {
          transform: translateX(0);
        }
      }
      .right {
        display: none;
        .data {
          .name {
            font-size: 24px;
            .name-alias {
              font-size: 16px;
            }
          }
          .other {
            font-size: 14px;
          }
        }
      }
    }
    @media (max-width: 700px) {
      .player-control {
        margin-bottom: 10px;
      }
    }
  }
}
// 局外样式
.title-tip {
  width: 200px;
  padding: 12px 20px;
  border-radius: 12px;
  .n-text {
    display: initial;
  }
}

.player-control {
  @media (max-width: 768px)  {
    margin-bottom: 10px;
  }
}
.amll-tip {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: var(--cover-main-color);
  opacity: 0.6;
  font-style: italic;
}
.lyric-am {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  filter: drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.2));
  mask: linear-gradient(180deg,
      hsla(0, 0%, 100%, 0) 0,
      hsla(0, 0%, 100%, 0.6) 5%,
      #fff 10%,
      #fff 75%,
      hsla(0, 0%, 100%, 0.6) 85%,
      hsla(0, 0%, 100%, 0));
  opacity: 1;
  transform: translateZ(0) scale(1);
  will-change: transform, opacity;
  transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);

  @media (max-width: 768px) {
    padding: 0 16px;
    height: 70vh;
  }

  &.loading {
    opacity: 0;
    transform: scale(0.8);
  }

  &.lyric-left {
    :deep(.am-lyric) {
      text-align: left;

      div {
        transform-origin: left center;
      }
    }
  }

  &.lyric-center {
    :deep(.am-lyric) {
      text-align: center;

      div {
        transform-origin: center;
      }
    }
  }

  :deep(.am-lyric) {
    width: 100%;
    height: 100%;
    position: absolute;
    left: 0;
    top: 0;
    font-synthesis: none;
    text-rendering: optimizeLegibility;

    @media (max-width: 768px) {
      position: relative;
      padding: 20px 0;
    }
  }
}

.v-enter-active,
.v-leave-active {
  transition: opacity 0.3s ease, transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

/* AMLL歌词样式 */
.amll-lyric-container {
  position: relative;
  width: calc(100vh - 90px);
  height: calc(100vh - 200px);
  overflow: hidden;
  margin-bottom: 20px;
  
  .am-lyric {
    width: 100%;
    height: calc(100vh - 200px);
    position: relative;
    box-sizing: border-box;
    overflow: visible;
    /* 确保内容在容器内正确显示 */
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  &.pure {
    text-align: center;
    :deep(.am-lyric) {
      height: calc(100vh - 250px);
      margin: 0;
      div {
        transform-origin: center !important;
      }
    }
  }
}
</style>

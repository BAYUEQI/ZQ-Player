<template>
  <div ref="wrapperRef" class="amll-background" v-bind="$attrs"></div>
</template>

<script setup lang="ts">
// 基于AMLL库实现背景渲染
import {
  BackgroundRender as CoreBackgroundRender,
  AbstractBaseRenderer,
  BaseRenderer,
  MeshGradientRenderer,
  EplorRenderer
} from "@applemusic-like-lyrics/core";
import { ref, onMounted, onUnmounted, watchEffect, defineExpose } from "vue";

// 定义组件属性
interface BackgroundRenderProps {
  // 专辑封面URL
  album?: string;
  // 是否为视频
  albumIsVideo?: boolean;
  // 帧率
  fps?: number;
  // 是否播放
  playing?: boolean;
  // 流动速度
  flowSpeed?: number;
  // 是否有歌词
  hasLyric?: boolean;
  // 低频音量
  lowFreqVolume?: number;
  // 渲染比例
  renderScale?: number;
  // 静态模式
  staticMode?: boolean;
  // 渲染器
  renderer?: typeof AbstractBaseRenderer;
}

// 定义组件引用类型
interface BackgroundRenderRef {
  bgRender: any;
  wrapperEl: HTMLDivElement | undefined;
}

const props = withDefaults(defineProps<BackgroundRenderProps>(), {
  album: "",
  albumIsVideo: false,
  fps: 60,
  playing: true,
  flowSpeed: 1.0,
  hasLyric: true,
  lowFreqVolume: 1.0,
  renderScale: 0.5,
  staticMode: false,
  renderer: undefined
});

const bgRenderRef = ref<AbstractBaseRenderer>();
const wrapperRef = ref<HTMLDivElement>();

// 初始化背景渲染器
const initBackgroundRender = () => {
  if (!wrapperRef.value) return;
  
  // 使用提供的渲染器或默认使用EplorRenderer（流体背景）
  bgRenderRef.value = CoreBackgroundRender.new(props.renderer ?? EplorRenderer);
  
  // 设置初始属性
  if (props.album) bgRenderRef.value?.setAlbum(props.album, props.albumIsVideo);
  bgRenderRef.value?.setFPS(props.fps);
  
  // 设置播放状态
  if (props.playing) {
    bgRenderRef.value?.resume();
  } else {
    bgRenderRef.value?.pause();
  }
  
  // 设置其他属性
  bgRenderRef.value?.setFlowSpeed(props.flowSpeed);
  bgRenderRef.value?.setStaticMode(props.staticMode);
  bgRenderRef.value?.setRenderScale(props.renderScale);
  bgRenderRef.value?.setLowFreqVolume(props.lowFreqVolume);
  bgRenderRef.value?.setHasLyric(props.hasLyric);

  // 将渲染器元素添加到包装器中
  const canvasEl = bgRenderRef.value.getElement();
  canvasEl.style.width = "100%";
  canvasEl.style.height = "100%";
  wrapperRef.value.appendChild(canvasEl);
};

// 使用watchEffect监听属性变化
watchEffect(() => {
  if (bgRenderRef.value && props.album) {
    bgRenderRef.value.setAlbum(props.album, props.albumIsVideo);
  }
});

watchEffect(() => {
  if (bgRenderRef.value && props.fps) {
    bgRenderRef.value.setFPS(props.fps);
  }
});

watchEffect(() => {
  if (!bgRenderRef.value) return;
  
  if (props.playing) {
    bgRenderRef.value.resume();
  } else {
    bgRenderRef.value.pause();
  }
});

watchEffect(() => {
  if (bgRenderRef.value && props.flowSpeed !== undefined) {
    bgRenderRef.value.setFlowSpeed(props.flowSpeed);
  }
});

watchEffect(() => {
  if (bgRenderRef.value && props.staticMode !== undefined) {
    bgRenderRef.value.setStaticMode(props.staticMode);
  }
});

watchEffect(() => {
  if (bgRenderRef.value && props.renderScale !== undefined) {
    bgRenderRef.value.setRenderScale(props.renderScale);
  }
});

watchEffect(() => {
  if (bgRenderRef.value && props.lowFreqVolume !== undefined) {
    bgRenderRef.value.setLowFreqVolume(props.lowFreqVolume);
  }
});

watchEffect(() => {
  if (bgRenderRef.value && props.hasLyric !== undefined) {
    bgRenderRef.value.setHasLyric(props.hasLyric);
  }
});

// 生命周期钩子
onMounted(() => {
  initBackgroundRender();
});

onUnmounted(() => {
  if (bgRenderRef.value) {
    bgRenderRef.value.dispose();
  }
});

// 导出组件引用
defineExpose<BackgroundRenderRef>({
  bgRender: bgRenderRef,
  wrapperEl: wrapperRef,
});
</script>

<style lang="scss" scoped>
.amll-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
}
</style>
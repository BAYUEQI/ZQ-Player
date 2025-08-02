<template>
  <div class="page-transition" ref="pageRef">
    <slot></slot>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, defineProps } from 'vue';
import gsap from 'gsap';

const props = defineProps({
  // 动画类型：fade-up, fade-down, fade-left, fade-right, zoom
  type: {
    type: String,
    default: 'fade-up'
  },
  // 动画持续时间
  duration: {
    type: Number,
    default: 0.6
  },
  // 动画延迟时间
  delay: {
    type: Number,
    default: 0
  },
  // 缓动函数
  ease: {
    type: String,
    default: 'power2.out'
  }
});

const pageRef = ref(null);
let timeline = null;

// 获取动画初始状态配置
const getInitialState = () => {
  const state = {
    opacity: 0,
    scale: props.type === 'zoom' ? 0.95 : 1
  };

  switch (props.type) {
    case 'fade-up':
      state.y = 30;
      break;
    case 'fade-down':
      state.y = -30;
      break;
    case 'fade-left':
      state.x = 30;
      break;
    case 'fade-right':
      state.x = -30;
      break;
  }

  return state;
};

// 获取动画目标状态配置
const getTargetState = () => {
  const state = {
    opacity: 1,
    scale: 1
  };

  if (props.type.includes('fade-')) {
    if (props.type.includes('up') || props.type.includes('down')) {
      state.y = 0;
    } else {
      state.x = 0;
    }
  }

  return state;
};

onMounted(() => {
  // 创建GSAP时间线
  timeline = gsap.timeline({
    defaults: {
      ease: props.ease,
      duration: props.duration
    }
  });

  // 设置初始状态
  gsap.set(pageRef.value, getInitialState());

  // 执行入场动画
  timeline.to(pageRef.value, {
    ...getTargetState(),
    delay: props.delay,
    clearProps: 'all'
  });
});

onBeforeUnmount(() => {
  // 执行离场动画
  if (timeline) {
    timeline.reverse();
  }
});
</script>

<style lang="scss" scoped>
.page-transition {
  width: 100%;
  min-height: 100%;
  will-change: transform, opacity;
}
</style>
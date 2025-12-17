<template>
  <div class="test">
  <PageTransition>
    <n-h1>Test Page</n-h1>
    <n-card title="歌词数据" style="margin-bottom: 20px">
      <n-scrollbar style="max-height: 300px">
        <div class="lyric-data">
          <div class="lyric-status">
            <h3>歌词状态：</h3>
            <p>普通翻译：{{ music.playSongLyric.hasLrcTran }}</p>
            <p>普通音译：{{ music.playSongLyric.hasLrcRoma }}</p>
            <p>逐字歌词：{{ music.playSongLyric.hasYrc }}</p>
            <p>逐字翻译：{{ music.playSongLyric.hasYrcTran }}</p>
            <p>逐字音译：{{ music.playSongLyric.hasYrcRoma }}</p>
          </div>
          <div class="lyric-content">
            <h3>普通歌词：</h3>
            <pre>{{ music.playSongLyric.lrc }}</pre>
            <h3>逐字歌词：</h3>
            <pre>{{ music.playSongLyric.yrc }}</pre>
            <h3>AMLL普通歌词：</h3>
            <pre>{{ music.playSongLyric.lrcAMData }}</pre>
            <h3>AMLL逐字歌词：</h3>
            <pre>{{ music.playSongLyric.yrcAMData }}</pre>
          </div>
        </div>
      </n-scrollbar>
    </n-card>
    <n-card title="频谱数据" style="margin-bottom: 20px">
      <n-scrollbar style="max-height: 120px">
        {{ status.spectrumsData }}
      </n-scrollbar>
      <n-scrollbar style="max-height: 120px">
        {{ status.spectrumsScaleData }}
        <div
          :style="{
            transform: `scale(${status.spectrumsScaleData})`,
          }"
          class="point"
        ></div>
      </n-scrollbar>
    </n-card>
    
    <!-- AMLL歌词测试区域 -->
    <n-card title="AMLL歌词测试" style="margin-bottom: 20px">
      <div class="amll-lyric-container">
        <LyricPlayer
          :lyricLines="testLyrics"
          :currentTime="currentTime"
          :playing="isPlaying"
          :enableSpring="true"
          :enableScale="true"
          :alignPosition="0.5"
          :enableBlur="true"
          :enableInterludeDots="true"
          :style="{
            '--amll-lyric-view-color': `rgb(${status.coverTheme?.light?.shadeTwo})` || 'rgb(239, 239, 239)',
            '--amll-lyric-player-font-size': '36px',
            '--amll-lyric-player-height': '300px',
            '--amll-lyric-player-width': '100%',
            'font-weight': 'normal',
            'visibility': 'visible',
            'opacity': '1',
            'height': '100%',
            'width': '100%'
          }"
          class="am-lyric"
        />
      </div>
      <div class="controls">
        <n-button @click="togglePlay">{{ isPlaying ? '暂停' : '播放' }}</n-button>
        <n-button @click="resetTime">重置</n-button>
      </div>
    </n-card>
    
    <n-card title="频谱图">
      <canvas ref="canvasRef" class="avBars" style="width: 100%" />
    </n-card>
    </PageTransition>
</div>
</template>

<script setup>import PageTransition from "@/components/Global/PageTransition.vue";

import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { siteStatus, musicData } from "@/stores";
import { LyricPlayer } from '@applemusic-like-lyrics/vue';
import { useRafFn } from '@vueuse/core';

const status = siteStatus();

const music = musicData();
// 频谱图相关
const canvasRef = ref(null);

// AMLL歌词相关
const isPlaying = ref(false);
const currentTime = ref(0);

// 测试歌词数据
const testLyrics = [
  {
    startTime: 0,
    endTime: 3000,
    words: [
      { word: "这是", startTime: 0, endTime: 1000 },
      { word: "一个", startTime: 1000, endTime: 2000 },
      { word: "测试", startTime: 2000, endTime: 3000 }
    ],
    translatedLyric: "This is a test",
    romanLyric: "Zhè shì yī gè cè shì"
  },
  {
    startTime: 3000,
    endTime: 6000,
    words: [
      { word: "AMLL", startTime: 3000, endTime: 4000 },
      { word: "歌词", startTime: 4000, endTime: 5000 },
      { word: "组件", startTime: 5000, endTime: 6000 }
    ],
    translatedLyric: "AMLL lyrics component",
    romanLyric: "AMLL gē cí zǔ jiàn"
  },
  {
    startTime: 6000,
    endTime: 9000,
    words: [
      { word: "支持", startTime: 6000, endTime: 7000 },
      { word: "逐词", startTime: 7000, endTime: 8000 },
      { word: "高亮", startTime: 8000, endTime: 9000 }
    ],
    translatedLyric: "Support word-by-word highlighting",
    romanLyric: "Zhī chí zhú cí gāo liàng"
  },
  {
    startTime: 9000,
    endTime: 12000,
    words: [
      { word: "和", startTime: 9000, endTime: 9500 },
      { word: "平滑", startTime: 9500, endTime: 10500 },
      { word: "滚动", startTime: 10500, endTime: 12000 }
    ],
    translatedLyric: "And smooth scrolling",
    romanLyric: "Hé píng huá gǔn dòng"
  }
];

// 控制播放
const togglePlay = () => {
  isPlaying.value = !isPlaying.value;
};

// 重置时间
const resetTime = () => {
  currentTime.value = 0;
  isPlaying.value = false;
};

// 使用requestAnimationFrame更新时间
const { pause, resume } = useRafFn(() => {
  if (isPlaying.value) {
    currentTime.value += 16; // 大约每帧增加16毫秒
    
    // 循环播放
    if (currentTime.value > 12000) {
      currentTime.value = 0;
    }
  }
}, { immediate: true });

// 频谱图绘制函数
const drawSpectrum = (data) => {
  canvasRef.value.width = document.body.clientWidth >= 1600 ? 1600 : document.body.clientWidth;
  canvasRef.value.height = 80;
  const ctx = canvasRef.value.getContext("2d");
  const barWidth = 6;
  const cornerRadius = 3; // 圆角半径
  // 清除画布
  ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);
  for (let i = 0; i < 360; i++) {
    const barHeight = (data[i] / 255) * canvasRef.value.height;
    const x = i * (barWidth * 2);
    const y = canvasRef.value.height - barHeight;
    ctx.fillStyle = `rgb(${status.coverTheme?.light?.shadeTwo})` || "#efefef";
    // ctx.fillRect(x, y, barWidth, barHeight);
    // 检查柱形高度是否大于0
    if (barHeight > 0) {
      roundRect(ctx, x, y, barWidth, barHeight, cornerRadius);
    }
  }
  requestAnimationFrame(() => {
    drawSpectrum(status.spectrumsData);
  });
};

// 辅助函数：绘制圆角矩形
const roundRect = (ctx, x, y, width, height, radius) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
};

onMounted(() => {
  drawSpectrum(status.spectrumsData);
  resume(); // 启动动画帧
});

onBeforeUnmount(() => {
  pause(); // 停止动画帧
});
</script>

<style lang="scss" scoped>
.lyric-data {
  padding: 16px;

  .lyric-status {
    margin-bottom: 20px;

    h3 {
      margin-bottom: 10px;
      font-size: 16px;
      font-weight: bold;
    }

    p {
      margin: 5px 0;
      font-size: 14px;
    }
  }

  .lyric-content {
    h3 {
      margin: 15px 0 10px;
      font-size: 16px;
      font-weight: bold;
    }

    pre {
      white-space: pre-wrap;
      word-wrap: break-word;
      font-family: monospace;
      background-color: rgba(0, 0, 0, 0.02);
      padding: 10px;
      border-radius: 4px;
      margin: 5px 0 15px;
    }
  }
}

.avBars {
  mask: linear-gradient(
    90deg,
    hsla(0, 0%, 100%, 0) 0,
    hsla(0, 0%, 100%, 0.6) 5%,
    #fff 10%,
    #fff 75%,
    hsla(0, 0%, 100%, 0.6) 85%,
    hsla(0, 0%, 100%, 0)
  );
  -webkit-mask: linear-gradient(
    90deg,
    hsla(0, 0%, 100%, 0) 0,
    hsla(0, 0%, 100%, 0.6) 5%,
    #fff 10%,
    #fff 75%,
    hsla(0, 0%, 100%, 0.6) 85%,
    hsla(0, 0%, 100%, 0)
  );
}
.point {
  width: 30px;
  height: 30px;
  margin: 20px;
  border-radius: 50%;
  background-color: var(--main-color);
}

/* AMLL歌词样式 */
.amll-lyric-container {
  position: relative;
  width: 100%;
  height: 300px;
  overflow: hidden;
  margin-bottom: 20px;
  
  .am-lyric {
    width: 100%;
    height: 100%;
    position: relative;
    padding: 0 20px;
    box-sizing: border-box;
    overflow: visible;
    /* 确保内容在容器内正确显示 */
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
}

.controls {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}
</style>

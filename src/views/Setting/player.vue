<template>
  <div class="set-type">
    <n-h3 prefix="bar"> 播放 </n-h3>
    <n-card class="set-item">
      <div class="name">
        启动时自动播放
        <n-text class="tip">
          {{ checkPlatform.electron() ? "程序启动时自动播放上次歌曲" : "大部分浏览器不支持自动播放功能" }}
        </n-text>
      </div>
      <n-switch v-model:value="autoPlay" :disabled="!checkPlatform.electron()" :round="false" />
    </n-card>
    <n-card class="set-item">
      <div class="name">
        记忆上次播放位置
        <n-text v-if="autoPlay" class="tip"> 与自动播放相冲突，已禁用 </n-text>
      </div>
      <n-switch v-model:value="memorySeek" :disabled="autoPlay" :round="false" />
    </n-card>
    <n-card class="set-item">
      <div class="name">
        音乐资源自动缓存
        <n-text class="tip"> 非客户端可能会导致清除列表后播放音乐仍然存在的问题 </n-text>
      </div>
      <n-switch 
        v-model:value="useMusicCache" 
        :round="false" 
        :disabled="!checkPlatform.electron()"
      />
    </n-card>
    <n-card class="set-item">
      <div class="name">音乐渐入渐出</div>
      <n-switch v-model:value="songVolumeFade" :round="false" />
    </n-card>
    <n-card class="set-item">
      <div class="name">
        播放全部搜索歌曲
        <n-text class="tip"> 在播放搜索页面上的歌曲时，是否同时播放所有搜索结果中的歌曲 </n-text>
      </div>
      <n-switch v-model:value="playSearch" :round="false" />
    </n-card>
    <n-card class="set-item">
      <div class="name">显示播放列表歌曲数量</div>
      <n-switch v-model:value="showPlaylistCount" :round="false" />
    </n-card>
    <n-card class="set-item">
      <div class="name">
        尝试替换无法播放的歌曲
        <n-text class="tip">
          替换无法播放的歌曲链接, 如VIP和受限歌曲等
        </n-text>
      </div>
      <n-switch v-model:value="useUnmServer"  :round="false" />
    </n-card>
    <n-card class="set-item">
      <div class="name">
        自定义音乐源
        <n-text class="tip">多个源用逗号分隔，支持 pyncmd, bodian, qq, kuwo, migu, kugou</n-text>
      </div>
      <n-checkbox-group v-model:value="musicSourceChecked" :disabled="!useUnmServer" style="margin-bottom: 8px;">
        <n-checkbox v-for="item in musicSourceOptions" :key="item.value" :value="item.value">{{ item.label }}</n-checkbox>
      </n-checkbox-group>
      <n-input
        v-model:value="settings.customMusicSource"
        :disabled="!useUnmServer"
        type="textarea"
        :autosize="{
          minRows: 1,
          maxRows: 5,
        }"
      />
    </n-card>
    <n-card class="set-item">
      <div class="name">显示前奏倒计时
        <n-text class="tip">在播放时显示前奏倒计时</n-text>
      </div>
      <n-switch v-model:value="countDownShow" :round="false" />
    </n-card>
    <n-card class="set-item">
      <div class="name">底栏歌词显示
        <n-text class="tip">是否在播放时将歌手信息更改为歌词</n-text>
      </div>
      <n-switch v-model:value="bottomLyricShow" :round="false" />
    </n-card>
    <n-card class="set-item">
      <div class="name">
        在线播放音质
        <n-text class="tip">
          {{ songLevelData[songLevel].tip }}
        </n-text>
      </div>
      <n-select v-model:value="songLevel" :options="Object.values(songLevelData)" class="set" />
    </n-card>

    <n-collapse>
      <n-collapse-item title="外观设置">
        
        <n-card class="set-item">
          <div class="name">
            播放器样式
            <n-text class="tip"> 播放器左侧区域样式 </n-text>
          </div>
          <n-select
            v-model:value="playCoverType"
            :options="[
              {
                label: '封面模式',
                value: 'cover',
              },
              {
                label: '唱片模式 (不推荐)',
                value: 'record',
              },
            ]"
            class="set"
          />
        </n-card>
    <n-card class="set-item" :bordered="false">
          <div class="name">
            播放背景样式
            <n-text class="tip">
              {{
                playerBackgroundType === "animation"
                  ? "流体效果，较消耗性能，请谨慎开启"
                  : playerBackgroundType === "blur"
                    ? "将封面模糊处理为背景"
                    : "提取封面主色为渐变色"
              }}
            </n-text>
          </div>
          <n-select
            v-model:value="playerBackgroundType"
            :options="[
              {
                label: '流体效果',
                value: 'animation-legacy',
                disabled: true
              },
              {
                label: '封面模糊',
                value: 'blur',
              },
              {
                label: '主色渐变',
                value: 'gradient',
              },
              {
                label: '无背景',
                value: 'none',
              },
            ]"
            class="set"
          />
        </n-card>
    <n-card class="set-item" :bordered="false">
          <div class="name">
            <div class="dev">
              显示音乐频谱
              <n-tag :bordered="false" round size="small" type="warning">
                开发中
                <template #icon>
                  <n-icon>
                    <SvgIcon icon="code" />
                  </n-icon>
                </template>
              </n-tag>
            </div>
            <n-text class="tip">
              {{
                showSpectrums
                  ? "开启音乐频谱会极大影响性能，如遇问题请关闭"
                  : "是否在播放器底部显示音乐频谱"
              }}
            </n-text>
          </div>
          <n-switch v-model:value="showSpectrums" :round="false" />
        </n-card>
      </n-collapse-item>
    </n-collapse>
  </div>
</template>

<script setup>
import { storeToRefs } from "pinia";
import { siteSettings } from "@/stores";
import { checkPlatform } from "@/utils/helper";
import { ref, watch } from "vue";

const settings = siteSettings();
const {
  songVolumeFade,
  autoPlay,
  countDownShow,
  playerBackgroundType,
  useUnmServer,
  songLevel,
  bottomLyricShow,
  memorySeek,
  playCoverType,
  playSearch,
  showPlaylistCount,
  showSpectrums,
  useMusicCache,
} = storeToRefs(settings);

// 音源选项
const musicSourceOptions = [
  { label: "第三方网易云(pyncmd)", value: "pyncmd" },
  { label: "Bodian音乐源(bodian)", value: "bodian" },
  { label: "QQ音乐(qq)", value: "qq" },
  { label: "酷我(kuwo)", value: "kuwo" },
  { label: "咪咕(migu)", value: "migu" },
  { label: "酷狗(kugou)", value: "kugou" },
];

// 复选框选中项
const musicSourceChecked = ref(settings.customMusicSource?.split(',').map(i => i.trim()).filter(Boolean) || []);

// 复选框变化时同步到输入框
watch(musicSourceChecked, (val) => {
  settings.customMusicSource = val.join(",");
});

// 输入框变化时同步到复选框
watch(() => settings.customMusicSource, (val) => {
  if (typeof val === 'string') {
    musicSourceChecked.value = val.split(',').map(i => i.trim()).filter(Boolean);
  }
});

// 音质数据
const songLevelData = {
  standard: {
    label: "标准音质",
    tip: "标准音质 128kbps",
    value: "standard",
  },
  higher: {
    label: "较高音质",
    tip: "较高音质 328kbps",
    value: "higher",
  },
  exhigh: {
    label: "极高 HQ",
    tip: "近 CD 品质的细节体验，最高 320kbps",
    value: "exhigh",
  },
  lossless: {
    label: "无损 SQ",
    tip: "高保真无损音质，最高 48kHz/16bit",
    value: "lossless",
  },
  hires: {
    label: "高清臻音 Spatial Audio",
    tip: "环绕声体验，声音听感增强，96kHz/24bit",
    value: "hires",
  },
  jymaster: {
    label: "超清母带 Master",
    tip: "还原音频细节，192kHz/24bit",
    value: "jymaster",
  },
  sky: {
    label: "沉浸环绕声 Surround Audio",
    tip: "沉浸式体验，最高 5.1 声道",
    value: "sky",
  },
};
</script>

<style lang="scss" scoped>
.set-type {
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
    margin-bottom: 12px;
    background-color: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    display: flex !important; /* 强制为 flex 容器 */
    flex-direction: column !important; /* 强制垂直排列 */
    align-items: flex-start !important; /* 强制左对齐 */

    :deep(.n-card__content) {
      display: block !important;
    }

    .name {
      display: block !important; /* 强制为块级元素 */
      width: 100% !important; /* 强制占据整行 */
      margin-bottom: 8px;
      font-size: 14px;
    }

    .tip {
      display: block !important;
      width: 100% !important; /* 强制占据整行 */
      margin-top: 4px;
      margin-bottom: 16px; /* 增加与复选框组的间距 */
      font-size: 12px;
      opacity: 0.6;
    }

    .n-checkbox-group {
      display: flex !important;
      flex-wrap: wrap !important;
      width: 100% !important; /* 强制占据整行 */
      margin-bottom: 16px; /* 增加与输入框的间距 */

      .n-checkbox {
        margin-right: 16px;
        margin-bottom: 8px;
      }
    }

    .n-input {
      display: block !important; /* 强制为块级元素 */
      width: 100% !important; /* 强制占据整行 */
    }

    .set {
      width: 100%;
    }
  }
}
</style>

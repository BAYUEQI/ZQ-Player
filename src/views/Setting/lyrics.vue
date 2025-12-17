<template>
  <div class="set-type">
    <n-h3 prefix="bar"> 歌词 </n-h3>
    <n-collapse>
      <n-collapse-item title="字体设置">
<n-card class="set-item" :content-style="{
            flexDirection: 'column',
            alignItems: 'flex-start',
          }">
          <div class="name">
            歌词文本大小
            <n-text :style="{ fontSize: lyricsFontSize + 'px', fontWeight: 'bold' }" class="tip">
              歌词显示测试
            </n-text>
          </div>
          <n-slider v-model:value="lyricsFontSize" :tooltip="false" :max="56" :min="25" :step="1" :marks="{
              25: '最小',
              36: '默认',
              56: '最大',
            }" />
        </n-card>
<n-card class="set-item">
          <div class="name">
            歌词字体
            <n-text class="tip">选择您偏好的字体</n-text>
          </div>
          <n-select
            v-model:value="lyricsFont"
            :options="[
              {
                label: 'LXGW WenKai',
                value: 'LXGW WenKai',
              },
              {
                label: 'HarmonyOS Sans',
                value: 'HarmonyOS Sans', 
              },
              {
                label: 'PingFang SC',
                value: 'PingFang SC',
              },
            ]"
            class="set"
            @update:value="updateLyricsFont"
          />
        </n-card>
<n-card class="set-item">
          <div class="name">
            歌词字体加粗
            <n-text class="tip">是否将歌词字体加粗显示，部分字体可能显示异常</n-text>
          </div>
          <n-switch v-model:value="lyricsBold" :round="false" />
        </n-card>
      </n-collapse-item>
      <n-collapse-item title="显示设置">
<n-card class="set-item">
          <div class="name">
            歌词位置
            <n-text class="tip">歌词的默认垂直位置</n-text>
          </div>
          <n-select v-model:value="lyricsPosition" :options="[
              {
                label: '居左',
                value: 'left',
              },
              {
                label: '居中',
                value: 'center',
              },
              {
                label: '居右',
                value: 'right',
              },
            ]" class="set" />
        </n-card>
<n-card class="set-item">
          <div class="name">
            歌词滚动位置
            <n-text class="tip">歌词高亮时所处的位置</n-text>
          </div>
          <n-select 
            :options="[
              {
                label: '靠近顶部',
                value: 'start',
              },
              {
                label: '水平居中', 
                value: 'center',
              },
            ]"
            :value="lyricsBlock"
            @update:value="(val) => {
              lyricsBlock = val;
              alignAnchor = val === 'start' ? 'top' : 'center';
            }"
            class="set" 
          />
        </n-card>
<n-card class="set-item">
          <div class="name">
            智能暂停滚动
            <n-text class="tip">鼠标移入歌词区域是否暂停滚动</n-text>
          </div>
          <n-switch v-model:value="lrcMousePause" :round="false" />
        </n-card>
      </n-collapse-item>
    <n-collapse-item title="歌词类型设置">
<n-card class="set-item">
        <div class="name">
          <div class="dev">
            显示逐字歌词
          </div>
          <n-text class="tip">是否在具有逐字歌词时显示</n-text>
        </div>
        <n-switch v-model:value="showYrc" :disabled="useTTMLFormat" :round="false" />
      </n-card>
<n-card class="set-item">
        <div class="name">
          <div class="dev">
            显示逐字歌词动画
          </div>
          <n-text class="tip">可能会造成卡顿等性能问题，手机端建议关闭</n-text>
        </div>
        <n-switch v-model:value="showYrcAnimation" :disabled="!showYrc" :round="false" />
      </n-card>
<n-card class="set-item">
        <div class="name">
          显示歌词翻译
          <n-text class="tip">是否在具有翻译歌词时显示</n-text>
        </div>
        <n-switch v-model:value="showTransl" :disabled="useAMLyrics" :round="false" />
      </n-card>
<n-card class="set-item" :bordered="false">
        <div class="name">
          显示歌词音译
          <n-text class="tip">是否在具有音译歌词时显示</n-text>
        </div>
        <n-switch v-model:value="showRoma" :disabled="useAMLyrics" :round="false" />
      </n-card>
    </n-collapse-item>
    <n-collapse-item title="歌词渲染设置">
<n-card class="set-item" :bordered="false">
        <n-collapse>
          <n-collapse-item title="Apple Music Like Lyrics 设置">
            <div class="name">
              使用Apple Music-Like Lyrics渲染器
              <n-text class="tip">
                Apple Music-Like Lyrics渲染器可能会造成卡顿等性能问题，手机端建议关闭
              </n-text>
            </div>
            <n-switch v-model:value="useAMLyrics" :round="false" />
            <div class="name" style="margin-top: 16px;">
              使用AMLL弹簧渲染效果
              <n-text class="tip">
                开启本项会使用Apple Music-Like Lyrics组件的弹簧效果
              </n-text>
            </div>
            <n-switch v-model:value="useAMSpring" :round="false" />
            <div class="name" style="margin-top: 16px;">
              <div class="dev">
                使用TTML格式歌词
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
                开启本项后，歌词将使用TTML格式歌词, 会从SteveXMH的歌词仓库获取TTML歌词, 如果没有TTML歌词则回退使用LRC歌词
              </n-text>
            </div>
            <n-switch v-model:value="useTTMLFormat" :disabled="!useAMLyrics" :round="false" />
          </n-collapse-item>
        </n-collapse>
<n-card class="set-item" :bordered="false">
        <div class="name">
          弹簧动画参数
          <span class="tip">调整歌词动画的弹性效果</span>
        </div>
        <n-collapse>
          <n-collapse-item title="横向移动">
            <n-form-item label="质量">
              <n-input-number v-model:value="springParams.posX.mass" :min="0.1" :step="0.1" />
            </n-form-item>
            <n-form-item label="阻尼">
              <n-input-number v-model:value="springParams.posX.damping" :min="0" :step="1" />
            </n-form-item>
            <n-form-item label="刚度">
              <n-input-number v-model:value="springParams.posX.stiffness" :min="0" :step="1" />
            </n-form-item>
          </n-collapse-item>
          <n-collapse-item title="纵向移动">
            <n-form-item label="质量">
              <n-input-number v-model:value="springParams.posY.mass" :min="0.1" :step="0.1" />
            </n-form-item>
            <n-form-item label="阻尼">
              <n-input-number v-model:value="springParams.posY.damping" :min="0" :step="1" />
            </n-form-item>
            <n-form-item label="刚度">
              <n-input-number v-model:value="springParams.posY.stiffness" :min="0" :step="1" />
            </n-form-item>
          </n-collapse-item>
          <n-collapse-item title="缩放">
            <n-form-item label="质量">
              <n-input-number v-model:value="springParams.scale.mass" :min="0.1" :step="0.1" />
            </n-form-item>
            <n-form-item label="阻尼">
              <n-input-number v-model:value="springParams.scale.damping" :min="0" :step="1" />
            </n-form-item>
            <n-form-item label="刚度">
              <n-input-number v-model:value="springParams.scale.stiffness" :min="0" :step="1" />
            </n-form-item>
          </n-collapse-item>
        </n-collapse>
      </n-card>
      </n-card>
      <n-card class="set-item">
        <div class="name">
          歌词自动聚焦
          <n-text class="tip">是否聚焦显示当前播放行，其他行将模糊显示, 手机端建议关闭</n-text>
        </div>
        <n-switch v-model:value="lyricsBlur" :round="false" />
      </n-card>
    </n-collapse-item>
  </n-collapse>
  </div>
</template>

<script setup>
import { storeToRefs } from "pinia";
import { watch } from "vue";
import { siteSettings } from "@/stores";

const settings = siteSettings();
const {
  alignAnchor,
  showYrc,
  showYrcAnimation,
  showTransl,
  showRoma,
  lyricsPosition,
  lyricsBlock,
  lrcMousePause,
  lyricsFontSize,
  lyricsBlur,
  lyricsBold,
  useAMLyrics,
  useAMSpring,
  lyricsFont,
  springParams,
  useTTMLFormat,
} = storeToRefs(settings);

// 监听TTML格式开关状态
watch(useTTMLFormat, (newVal) => {
  if (newVal) {
    showYrc.value = true;
  }
});

watch(useAMLyrics, (newVal) => {
  if (newVal === false) {
    useTTMLFormat.value = false;
  }
});

// 更新全局歌词字体
const updateLyricsFont = () => {
  document.documentElement.style.setProperty('--main-font-family-lyric', `"${settings.lyricsFont}", system-ui, -apple-system, sans-serif`);
}
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
    border-radius: 8px;

    @media screen and (max-width: 768px) {
      margin-bottom: 8px;
      padding: 12px !important;
    }

    .name {
      margin-bottom: 8px;
      font-size: 14px;

      @media screen and (max-width: 768px) {
        font-size: 13px;
        margin-bottom: 6px;
      }

      .tip {
        display: block;
        margin-top: 4px;
        font-size: 12px;
        opacity: 0.6;

        @media screen and (max-width: 768px) {
          font-size: 11px;
          margin-top: 2px;
        }
      }
    }

    .set {
      width: 100%;
    }

    :deep(.n-form-item) {
      margin-bottom: 12px;
      
      @media screen and (max-width: 768px) {
        margin-bottom: 8px;
      }

      .n-form-item-label {
        font-size: 14px;
        padding-bottom: 4px;

        @media screen and (max-width: 768px) {
          font-size: 13px;
          padding-bottom: 2px;
        }
      }

      .n-input-number {
        width: 100%;
        max-width: 200px;
        background-color: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 4px;

        @media screen and (max-width: 768px) {
          max-width: none;
          padding: 4px 8px;
          margin-top: 4px;
        }

        &:hover, &:focus {
          border-color: rgba(255, 255, 255, 0.2);
        }

        .n-input-wrapper {
          padding: 0 8px;

          @media screen and (max-width: 768px) {
            padding: 0 4px;
          }
        }

        .n-input__input {
          height: 32px;
          padding: 0;
          color: rgba(255, 255, 255, 0.9);

          @media screen and (max-width: 768px) {
            height: 36px;
            font-size: 14px;
          }
        }

        .n-input-number-suffix, 
        .n-input-number-prefix {
          color: rgba(255, 255, 255, 0.5);

          @media screen and (max-width: 768px) {
            font-size: 12px;
          }
        }
      }
    }

    :deep(.n-collapse) {
      @media screen and (max-width: 768px) {
        .n-collapse-item__header {
          padding: 8px;
          font-size: 14px;
        }

        .n-collapse-item__content-inner {
          padding: 8px;
        }
      }
    }

    :deep(.n-switch) {
      @media screen and (max-width: 768px) {
        height: 24px;
        min-width: 44px;
      }
    }

    :deep(.n-tag) {
      @media screen and (max-width: 768px) {
        font-size: 11px;
        padding: 0 6px;
      }
    }
  }
}
</style>

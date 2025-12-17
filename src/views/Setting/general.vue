<!-- 设置 - 常规 -->
<template>
  <div class="set-type">
    <n-h3 prefix="bar"> 常规 </n-h3>
    <n-collapse>
      <!-- 主题设置 -->
      <n-collapse-item title="主题设置" name="theme">
        <n-card class="set-item">
          <div class="name">
            <div class="dev">
              全局动态取色
              <n-tag :bordered="false" round size="small" type="warning">
                开发中
                <template #icon>
                  <n-icon>
                    <SvgIcon icon="code" />
                  </n-icon>
                </template>
              </n-tag>
            </div>
            <n-text class="tip">主题色是否跟随封面</n-text>
          </div>
          <n-switch
            v-model:value="themeAutoCover"
            :round="false"
            :disabled="Object.keys(coverTheme)?.length === 0"
            @update:value="themeAutoCoverChange"
          />
        </n-card>
        <n-card class="set-item">
          <div class="name">
            <div class="dev">
              全局动态取色类别
              <n-tag :bordered="false" round size="small" type="warning">
                开发中
                <template #icon>
                  <n-icon>
                    <SvgIcon icon="code" />
                  </n-icon>
                </template>
              </n-tag>
            </div>
            <n-text class="tip">将在下一首播放或刷新时生效</n-text>
          </div>
          <n-select
            v-model:value="themeAutoCoverType"
            :disabled="!themeAutoCover"
            :options="[
              {
                label: '中性',
                value: 'neutral',
              },
              {
                label: '中性变体',
                value: 'neutralVariant',
              },
              {
                label: '主要',
                value: 'primary',
              },
              {
                label: '次要',
                value: 'secondary',
              },
              {
                label: '次次要',
                value: 'tertiary',
              },
            ]"
            class="set"
          />
        </n-card>
      </n-collapse-item>

      <!-- 字体设置 -->
      <n-collapse-item title="字体设置" name="font">
        <n-card class="set-item">
          <div class="name">
            全局字体
            <n-text class="tip">选择您偏好的网页全局字体</n-text>
          </div>
          <n-select
            v-model:value="settings.webFonts"
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
            @update:value="updateWebFont"
            :disabled="checkPlatform.electron()"
          />
        </n-card>
        <n-card class="set-item">
          <div class="name">字体加粗
            <n-text class="tip">开启后网页字体将会被加粗</n-text>
          </div>
          <n-switch v-model:value="settings.fontBold" :round="false" @update:value="updateWebFont(settings.webFonts)"  :disabled="checkPlatform.electron()"/>
        </n-card>
      </n-collapse-item>

      <!-- 侧边栏设置 -->
      <n-collapse-item title="侧边栏设置" name="sidebar">
        <n-card class="set-item">
          <div class="name">
            开启侧边栏
            <n-text class="tip">将导航栏放于侧边显示，可展开或收起</n-text>
          </div>
          <n-switch v-model:value="showSider" :round="false" />
        </n-card>
        <n-card class="set-item">
          <div class="name">
            侧边栏展示封面
            <n-text class="tip">侧边栏歌单是否展示歌单封面</n-text>
          </div>
          <n-switch v-model:value="siderShowCover" :disabled="!showSider" :round="false" />
        </n-card>
      </n-collapse-item>

      <!-- 其他功能设置 -->
      <n-collapse-item title="其他功能设置" name="other">
        <n-card class="set-item">
          <div class="name">显示搜索历史
            <n-text class="tip">开启后将会在搜索框展示搜索历史</n-text>
          </div>
          <n-switch v-model:value="showSearchHistory" :round="false" />
        </n-card>
        <n-card class="set-item" :bordered="false">
          <div class="name">
            自动签到
            <n-text class="tip">在每日首次加载网站时自动签到</n-text>
          </div>
          <n-switch v-model:value="autoSignIn" :round="false" />
        </n-card>
        <n-card class="set-item" :bordered="false">
          <div class="name">
            隐藏 VIP 歌曲标签
            <n-text class="tip">是否在歌曲列表中隐藏 VIP 歌曲标签</n-text>
          </div>
          <n-switch v-model:value="hiddenVipTags" :round="false" />
        </n-card>
      </n-collapse-item>
    </n-collapse>
  </div>
</template>

<script setup>
import { storeToRefs } from "pinia";
import { useOsTheme } from "naive-ui";
import { siteSettings, siteStatus } from "@/stores";
import { checkPlatform } from "@/utils/helper";

const status = siteStatus();
const settings = siteSettings();
const { coverTheme } = storeToRefs(status);
const {
  themeType,
  themeTypeName,
  themeAuto,
  themeAutoCover,
  themeAutoCoverType,
  showSider,
  showSearchHistory,
  autoSignIn,
  siderShowCover,
  hiddenVipTags,
} = storeToRefs(settings);

// 基础数据
const osThemeRef = useOsTheme();

// 更新全局字体
const updateWebFont = (font) => {
  settings.webFonts = font;
  document.documentElement.style.setProperty('--main-font-family', `"${font}", system-ui, -apple-system, sans-serif`);
  document.documentElement.style.setProperty('font-weight', settings.fontBold ? 'bold' : 'normal');
};
// 封面自动跟随变化
const themeAutoCoverChange = (val) => {
  if ($changeThemeColor !== "undefined" && Object.keys(coverTheme.value)?.length) {
    $changeThemeColor(val ? coverTheme.value : themeTypeName.value, val);
  }
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
    border-radius: 8px;

    .name {
      margin-bottom: 8px;
      font-size: 14px;

      .tip {
        display: block;
        margin-top: 4px;
        font-size: 12px;
        opacity: 0.6;
      }
    }

    .set {
      width: 100%;
    }
  }
}
</style>

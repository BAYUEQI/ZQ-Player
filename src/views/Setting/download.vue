<template>
  <div class="set-type">
    <n-h3 prefix="bar"> 下载 </n-h3>
    <n-card class="set-item">
      <div class="name">
        默认下载文件夹
        <n-text class="tip">{{ downloadPath || "不设置则会每次选择保存位置" }}</n-text>
      </div>
      <n-flex>
        <Transition name="fade" mode="out-in">
          <n-button v-if="downloadPath" type="error" strong secondary @click="downloadPath = null">
            清除
          </n-button>
        </Transition>
        <n-button :disabled="!checkPlatform.electron()" strong secondary @click="choosePath">
          更改
        </n-button>
      </n-flex>
    </n-card>
    <n-card class="set-item">
      <div class="name">
        同时下载歌曲元信息
        <n-text class="tip">为当前下载歌曲附加封面及歌词等元信息</n-text>
      </div>
      <n-switch v-model:value="downloadMeta" :round="false" />
    </n-card>
    <n-card class="set-item">
      <div class="name">下载歌曲时同时下载封面</div>
      <n-switch v-model:value="downloadCover" :disabled="!downloadMeta" :round="false" />
    </n-card>
    <n-card class="set-item">
      <div class="name">下载歌曲时同时下载歌词</div>
      <n-switch v-model:value="downloadLyrics" :disabled="!downloadMeta" :round="false" />
    </n-card>
  </div>
</template>

<script setup>
import { storeToRefs } from "pinia";
import { siteSettings } from "@/stores";
import { checkPlatform } from "@/utils/helper";

const settings = siteSettings();
const {
  downloadPath,

  downloadMeta,
  downloadCover,
  downloadLyrics,
} = storeToRefs(settings);

// 更改下载目录
const choosePath = async () => {
  const selectedDir = await electron.ipcRenderer.invoke("selectDir", true);
  if (selectedDir) downloadPath.value = selectedDir;
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

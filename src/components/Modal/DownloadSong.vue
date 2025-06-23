<!-- 歌曲下载 -->
<template>
  <n-modal
    v-model:show="downloadSongShow"
    :bordered="false"
    :close-on-esc="false"
    :auto-focus="false"
    :mask-closable="!downloadStatus"
    :on-after-leave="closeDownloadModal"
    class="download-song"
    preset="card"
    title="歌曲下载"
    :style="{
      width: isMobile ? '100vw' : '800px',
      maxWidth: '90vw',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      borderRadius: isMobile ? '16px 16px 0 0' : '8px',
      margin: isMobile ? 'auto' : 'auto',
      marginBottom: '100px'
    }"
  >
    <Transition name="fade" mode="out-in">
      <div v-if="songData">
        <div class="song-info">
          <n-text class="name">{{ songData.name }}</n-text>
          <n-text class="artist">{{ songData.artists.map(artist => artist.name).join(', ') }}</n-text>
        </div>
        <n-card class="set-item">
          <div class="name">
            同时下载歌曲元信息
            <n-tag :bordered="false" round size="small" type="warning">
              开发中
              <template #icon>
                <n-icon>
                  <SvgIcon icon="code" />
                </n-icon>
              </template>
            </n-tag>
            <n-text class="tip">下载歌曲的同时下载歌曲元信息, 注意要给两个都开启</n-text>
          </div>
          <n-switch v-model:value="downloadMeta" :disabled="!checkPlatform.electron" :round="false" />
        </n-card>
        <n-card class="set-item">
          <div class="name">
            音质选择
            <n-tag v-if="qualityOptions.find(q => q.value === selectedQuality)?.lossless" :bordered="false" round
              size="small" type="success">
              无损音质
            </n-tag>
          </div>
          <n-select v-model:value="selectedQuality" :options="qualityOptions" :disabled="downloadStatus"
            placeholder="选择音质" />
          <n-text class="tip" depth="3">
            当前选择：{{ selectedQuality }}kbps{{ selectedQuality >= 740 ? ' (FLAC)' : '' }}
          </n-text>
          <n-text class="tip" depth="3">
            音源来自UnblockNeteaseMusic的pyncmd音源
          </n-text>  
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
      <n-text v-else>歌曲信息获取中</n-text>
    </Transition>
    <template #footer>
      <n-flex justify="end" :class="{ setting: true }">
        <!--div class="name">保存歌词到压缩文件</div>
        <n-switch v-model:value="downloadCoverToFile" :round="false"/>
        <div class="name">保存封面到压缩文件</div>
        <n-switch v-model:value="downloadLyricsToFile" :round="false"/-->
        <n-button @click="closeDownloadModal"> 关闭 </n-button>
        <n-button :disabled="!songData" :loading="downloadStatus" :focusable="false" type="primary"
          @click="toSongDownload(songData, lyricData, tlyricData)">
          下载
        </n-button>
      </n-flex>
    </template>
  </n-modal>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
import { siteData, siteSettings } from "@/stores";
import { getSongDetail, getSongLyricLegacy, getSongDownloadNew } from "@/api/song";
import { downloadFile, checkPlatform } from "@/utils/helper";
import formatData from "@/utils/formatData";


const router = useRouter();
const data = siteData();
const settings = siteSettings();
const { userData } = storeToRefs(data);

// 响应式布局
const isMobile = ref(false);
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768;
};

// 监听窗口大小变化
onMounted(() => {
  checkMobile();
  window.addEventListener('resize', checkMobile);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile);
});

const {
  downloadPath,
  downloadMeta,
  downloadCover,
  downloadLyrics,
  downloadLyricsToFile,
  downloadCoverToFile,
} = storeToRefs(settings);

// 歌曲下载数据
const songId = ref(null);
const songData = ref(null);
const lyricData = ref(null); // 歌词
const tlyricData = ref(null); // 翻译歌词
const downloadStatus = ref(false);
const downloadSongShow = ref(false);

// 获取歌曲详情
const getMusicDetailData = async (id) => {
  try {
    const songResult = await getSongDetail(id);
    const lyricResult = await getSongLyricLegacy(id);
    // 获取歌曲详情
    songData.value = formatData(songResult?.songs?.[0], "song")[0];
    lyricData.value = lyricResult?.lrc?.lyric || null;
    tlyricData.value = lyricResult?.tlyric?.lyric || null;
  } catch (error) {
    closeDownloadModal();
    console.error("歌曲信息获取失败：", error);
  }
};
// 新增音质配置 ✅
const qualityOptions = ref([
  { label: '标准音质 (128kbps)', value: 128 },
  { label: '高清音质 (192kbps)', value: 192 },
  { label: '超清音质 (320kbps)', value: 320 },
  {
    label: '无损音质 (740kbps FLAC)',
    value: 740,
    lossless: true,
    description: '高品质无损格式'
  },
  {
    label: 'Hi-Res (999kbps FLAC)',
    value: 999,
    lossless: true,
    description: '超高解析度无损'
  }
]);
const selectedQuality = ref(320); // 默认选择超清音质
// 歌曲下载
const toSongDownload = async (song, lyric, tlyric) => {
  try {
    const fileType = selectedQuality.value >= 740 ? 'flac' : 'mp3';
    console.log(song, lyric, tlyric);
    downloadStatus.value = true;
    // 获取下载数据
    const result = await getSongDownloadNew({
      id: song?.id,
      br: selectedQuality.value
    });
    console.log("下载数据：", result);
    // 检查 result.data 和 result.data.url 是否存在
    if (!result.data) {
      downloadStatus.value = false;
      console.error("下载数据无效：", result);
      return $message.error("下载失败，请重试");
    }
    // 开始下载
    if (!downloadPath.value && checkPlatform.electron()) {
      $notification["warning"]({
        content: "缺少配置",
        meta: "请前往设置页配置默认下载目录",
        duration: 3000,
      });
    }
    // 获取下载结果
    const isDownloaded = await downloadFile({
      type: fileType,
      url: result.data.url
    }, song, lyric, tlyric, {
      path: downloadPath.value,
      downloadMeta: downloadMeta.value,
      downloadCover: downloadCover.value,
      downloadLyrics: downloadLyrics.value,
      downloadCoverToFile: downloadCoverToFile.value,
      downloadLyricsToFile: downloadLyricsToFile.value,
    });
    console.log(lyric);
    if (isDownloaded) {
      $message.success("下载完成");
      closeDownloadModal();
    } else {
      downloadStatus.value = false;
      $message.error("下载失败，请重试");
    }
  } catch (error) {
    console.error("歌曲下载出错：", error);
    $message.error("歌曲下载失败，请重试");
  }
};

// 开启歌曲下载
const openDownloadModal = (data) => {
  console.log(data);
  // 执行下载
  const toDownload = () => {
    songId.value = data.id.toString();
    downloadSongShow.value = true;
    getMusicDetailData(songId.value);
  };
  return toDownload();
};

// 关闭歌曲下载
const closeDownloadModal = () => {
  songId.value = null;
  songData.value = null;
  downloadStatus.value = false;
  downloadSongShow.value = false;
};

// 暴露方法
defineExpose({
  openDownloadModal,
});
</script>

<style lang="scss" scoped>
.download-song {
  :deep(.n-card) {
    background-color: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    transition: all 0.3s ease;

    &:hover {
      background-color: rgba(255, 255, 255, 0.08);
      transform: translateY(-2px);
    }
  }

  .song-info {
    margin-bottom: 16px;
    padding: 0 8px;

    .name {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 8px;
      color: var(--n-text-color);
    }

    .artist {
      font-size: 14px;
      opacity: 0.8;
      color: var(--n-text-color-3);
    }
  }

  :deep(.n-button) {
    border-radius: 8px;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
    }
  }

  @media (max-width: 768px) {
    .set-item {
      margin-bottom: 12px;
    }

    :deep(.n-card) {
      border-radius: 12px;

      &:active {
        transform: scale(0.98);
      }
    }

    :deep(.n-switch) {
      height: 24px;
      min-width: 44px;
    }
  }
}

/* 新增音质选择样式 ✅ */
.set-item {
  .n-select {
    margin: 12px 0;
    width: 100%;
  }

  .tip {
    display: block;
    font-size: 12px;
    margin-top: 8px;
    color: var(--n-text-color-tertiary);
  }
}
.download-song {
  .song-info {
    .name {
      font-size: 18px;
      font-weight: bold;
    }
    .artist {
      font-size: 14px;
      color: #666;
    }
  }
  .tip {
    border-radius: 8px;
    margin-bottom: 20px;
  }
}
</style>

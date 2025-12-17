<!-- 歌曲下载 -->
<template>
  <n-modal v-model:show="downloadSongShow" :bordered="false" :close-on-esc="false" :auto-focus="false"
    :mask-closable="!downloadStatus" :on-after-leave="closeDownloadModal" class="download-song" preset="card"
    title="歌曲下载" :style="{
      width: isMobile ? '100vw' : '800px',
      maxWidth: '90vw',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      borderRadius: isMobile ? '16px 16px 0 0' : '8px',
      margin: isMobile ? 'auto' : 'auto',
      marginBottom: '100px'
    }">
    <Transition name="fade" mode="out-in">
      <div v-if="songData">
        <div class="song-info">
          <n-text class="name">{{ songData.name }}</n-text>
          <n-text class="artist">{{songData.artists.map(artist => artist.name).join(', ')}}</n-text>
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
            <n-text class="tip">下载歌曲的同时下载歌曲元信息</n-text>
          </div>
          <n-switch v-model:value="downloadMeta" :disabled="!checkPlatform.electron" :round="false" />
        </n-card>
        <n-card class="set-item">
          <div class="name">
            音源选择
            <n-text class="tip">选择下载歌曲的音源</n-text>
            <n-alert v-if="selectedSource.includes('meting')" type="warning" show-icon>
              注意: 该音源不支持音质选择
            </n-alert>
            <n-alert v-if="selectedSource.includes('unblock')" type="warning" show-icon>
              注意: 该音源不支持音质选择, 音源受播放设置的影响, 有几率匹配不成功
            </n-alert>
          </div>
          <n-select v-model:value="selectedSource" :options="sourceOptions" :disabled="downloadStatus"
            placeholder="选择音源" />
        </n-card>
        <n-card v-if="!selectedSource.includes('unblock') && !selectedSource.includes('meting')" class="set-item">
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
        </n-card>
        <n-card v-if="selectedSource==='unblock'" class="set-item">
          <div class="name">解灰使用源
            <n-text class="tip">多个源用逗号分隔，支持 pyncmd, qq, kuwo, migu, kugou</n-text>
          </div>
          <n-checkbox-group v-model:value="musicSourceChecked" style="margin-bottom: 8px;">
            <n-checkbox v-for="item in musicSourceOptions" :key="item.value" :value="item.value">{{ item.label }}</n-checkbox>
          </n-checkbox-group>
          <n-input v-model:value="settings.customMusicSource" />
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
import { getSongDetail, getSongLyricLegacy, getSongDownloadFromPyncmd, getSongDownload, getMusicNumUrlNew, getMetingSongDownload, getPythonSongDownload } from "@/api/song";
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
const lyricData = ref(null);
const tlyricData = ref(null);
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
// 新增音质配置
const qualityOptions = ref([
  { label: '标准音质 (128kbps)', value: 128, desc: 'standard' },
  { label: '高清音质 (192kbps)', value: 192, desc: 'high' },
  { label: '超清音质 (320kbps)', value: 320, desc: 'exhigh' },
  { label: '无损音质 (740kbps FLAC)', value: 740, lossless: true, desc: 'lossless', description: '高品质无损格式' },
  { label: 'Hi-Res (999kbps FLAC)', value: 999, lossless: true, desc: 'hires', description: '超高解析度无损' }
]);
// 音源选项
const sourceOptions = ref([
  { label: '默认源 (pyncmd)', value: 'pyncmd' },
  { label: '网易云音乐 (部分歌曲需登陆黑胶账号)', value: 'netease' },
  { label: '解灰专用源 (有几率匹配不成功)', value: 'unblock' },
  { label: 'GD音乐台', value: 'gd' },
  { label: '网易云音乐工具箱', value: 'python1' },
  { label: '岑鬼鬼音乐API (meting)', value: 'meting1' },
  { label: '祈杰音乐源 (meting)', value: 'meting2' },
  { label: 'injahow(meting)', value: 'meting3' },
  { label: '云海花瑶(meting)', value: 'meting4' },
])

const selectedSource = ref('pyncmd'); const selectedQuality = ref(320);

// 歌曲下载
const toSongDownload = async (song, lyric, tlyric) => {
  try {
    const fileType = selectedQuality.value >= 740 ? 'flac' : 'mp3';
    downloadStatus.value = true;
    // 获取下载数据
    if (selectedSource.value === 'netease') {
      var result = await getSongDownload(song?.id, selectedQuality.value * 1000);
    } else if (selectedSource.value === 'pyncmd') {
      var result = await getSongDownloadFromPyncmd({
        id: song?.id,
        br: selectedQuality.value
      });
    } else if (selectedSource.value === 'unblock') {
      var result = await getMusicNumUrlNew(song?.id, settings.customMusicSource);
    } else if (selectedSource.value === 'gd') {
      var result = await getSongDownloadFromPyncmd({  // 暂时设定为pyncmd音源, 因为pyncmd就是GD音乐源
        id: song?.id,
        br: selectedQuality.value
      });
    } else if (selectedSource.value.includes('python')) {
      const qualityOption = qualityOptions.value.find(q => q.value === selectedQuality.value);
      var result = await getPythonSongDownload(song?.id, selectedSource.value, qualityOption?.desc);
    } else if (selectedSource.value.includes('meting')) {
      var url = await getMetingSongDownload(song?.id, selectedSource.value);
      var result = { data: { url } };
    } else {
      $message.error("未知音源，请选择正确的音源");
      downloadStatus.value = false;
      return;
    }

    console.log("下载数据：", result);
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

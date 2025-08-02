<template>
  <n-modal
    v-model:show="showModal"
    title="设置"
    size="large"
    :style="{
      width: isMobile ? '100vw' : '800px',
      maxWidth: '90vw',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      borderRadius: isMobile ? '16px 16px 0 0' : '8px',
      margin: isMobile ? 'auto auto 0 auto' : 'auto',
      marginBottom: isMobile ? '100px' : '50px',
    }"
  >
    <div class="settings-modal">
      <!-- 移动端下拉选择器 -->
      <div v-if="isMobile" class="mobile-selector">
        <n-select
          v-model:value="setTabsValue"
          :options="tabOptions"
          size="large"
          @update:value="settingTabChange"
        />
      </div>

      <!-- 桌面端标签页 -->
      <div v-else class="tabs-container">
        <n-tabs
          ref="setTabsRef"
          v-model:value="setTabsValue"
          type="line"
          @update:value="settingTabChange"
        >
          <n-tab name="setTab1">常规</n-tab>
          <n-tab name="setTab2">播放</n-tab>
          <n-tab name="setTab3">系统</n-tab>
          <n-tab name="setTab4">歌词</n-tab>
          <n-tab name="setTab5">下载</n-tab>
          <n-tab name="setTab6">其他</n-tab>
        </n-tabs>
        
        <!-- 添加跳转按钮 -->
        <n-button 
          class="web-settings-btn" 
          quaternary 
          size="small" 
          @click="openWebSettings"
        >
          <template #icon>
            <n-icon>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d="M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z" />
              </svg>
            </n-icon>
          </template>
          网页设置
        </n-button>
      </div>

      <div class="settings-content">
        <n-scrollbar
          ref="setScrollRef"
          :style="{
            height: '100%'
          }"
          class="all-set"
          @scroll="allSetScroll"
        >
          <!-- 常规 -->
          <General />
          <!-- 播放 -->
          <Player />
          <!-- 系统 -->
          <System />
          <!-- 歌词 -->
          <Lyrics />
          <!-- 下载 -->
          <Download />
          <!-- 其他 -->
          <Other />
        </n-scrollbar>
      </div>
    </div>
  </n-modal>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from "pinia";
import { siteSettings, siteStatus, musicData } from "@/stores";
import debounce from "@/utils/debounce";
// 设置子项
import General from "@/views/Setting/general.vue";
import Player from "@/views/Setting/player.vue";
import System from "@/views/Setting/system.vue";
import Lyrics from "@/views/Setting/lyrics.vue";
import Download from "@/views/Setting/download.vue";
import Other from "@/views/Setting/other.vue";

const router = useRouter();
const music = musicData();
const status = siteStatus();
const { showPlayBar, showFullPlayer } = storeToRefs(status);

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

// 标签页数据
const setTabsRef = ref(null);
const setScrollRef = ref(null);
const setTabsValue = ref("setTab1");
const showModal = ref(false);

// 标签选项
const tabOptions = computed(() => [
  { label: '常规', value: 'setTab1' },
  { label: '播放', value: 'setTab2' },
  { label: '系统', value: 'setTab3' },
  { label: '歌词', value: 'setTab4' },
  { label: '下载', value: 'setTab5' },
  { label: '其他', value: 'setTab6' }
]);

// 计算滚动区域高度
const getScrollHeight = () => {
  if (isMobile.value) {
    return music.getPlaySongData?.id && showPlayBar.value ? 420 : 340;
  } else {
    return music.getPlaySongData?.id && showPlayBar.value ? 368 : 288;
  }
};

// 标签页切换
const settingTabChange = (name) => {
  const index = Number(name.replace("setTab", ""));
  const setDom = document.querySelectorAll(".set-type")?.[index - 1];
  if (!setDom) return false;
  // 滚动至设置分类
  setDom.scrollIntoView({ behavior: "smooth" });
};

// 设置列表滚动
const allSetScroll = debounce((e) => {
  const distance = e.target.scrollTop + 30;
  const allSetDom = document.querySelectorAll(".set-type");
  allSetDom.forEach((v, i) => {
    if (distance >= v.offsetTop) setTabsValue.value = `setTab${i + 1}`;
  });
}, 100);


// 方法：显示弹窗
const openModal = () => {
  showModal.value = true;
};

// 新增打开网页端设置方法
const openWebSettings = () => {
  showFullPlayer.value = false;
  router.push({ path: "/setting" });
  showModal.value = false;
};

defineExpose({ showModal: openModal });
</script>

<style lang="scss" scoped>
.settings-modal {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 100px);
  background-color: transparent;
  transition: all 0.3s ease;
  .n-base-selection {
    border-radius: 8px;
    background-color: transparent;
  }

  .mobile-selector {
    flex-shrink: 0;
    padding: 16px 16px 8px;
    background-color: transparent;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    :deep(.n-select) {
      width: 100%;
      .n-base-selection {
        border-radius: 8px;
        background-color: transparent;
      }
    }
  }

  .tabs-container {
    flex-shrink: 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    background-color: transparent;
    position: relative;

    :deep(.n-tabs-nav) {
      padding: 0 20px;
    }

    :deep(.n-tabs-tab) {
      padding: 12px 16px;
      transition: all 0.3s ease;
    }

    :deep(.n-tabs-tab-active) {
      font-weight: 600;
    }
    
    .web-settings-btn {
      position: absolute;
      right: 16px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 12px;
      border-radius: 6px;
      transition: all 0.2s ease;
      
      &:hover {
        background-color: var(--hover-color);
      }
    }
  }

  .settings-content {
    flex: 1;
    overflow: hidden;
    padding: 16px 24px;
    background-color: transparent;
    transition: padding 0.3s ease;

    .n-scrollbar {
      padding-right: 12px;
      background-color: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }
  }
}

/* 移动端样式 */
@media (max-width: 768px) {
  .settings-modal {
    height: 80vh;

    .settings-content {
      padding: 12px 16px;

      :deep(.set-type) {
        .set-item {
          margin-bottom: 12px;
        }
      }

      :deep(.n-card) {
        border-radius: 12px;
        transition: transform 0.2s ease;

        &:active {
          transform: scale(0.98);
        }
      }
    }
  }

  /* 优化移动端触摸体验 */
  :deep(.n-switch) {
    height: 24px;
    min-width: 44px;
  }

  :deep(.n-input) {
    .n-input__input-el {
      height: 40px;
      font-size: 15px;
    }
  }

  :deep(.n-input-number) {
    .n-input-number-input {
      height: 40px;
      font-size: 15px;
    }
  }
}
</style>
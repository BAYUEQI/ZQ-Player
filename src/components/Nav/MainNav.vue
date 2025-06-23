<template>
  <nav :class="{ 'main-nav': true, 'no-sider': !showSider }">
    <div class="left">
      <!-- ...左侧内容... -->
    </div>
    <div class="right">
      <n-button
        class="main-menu"
        secondary
        strong
        round
        @click="drawerShow = true"
      >
        <template #icon>
          <n-icon>
            <SvgIcon icon="menu" />
          </n-icon>
        </template>
      </n-button>
      <userData />
      <TitleBar v-if="checkPlatform.electron()" />
    </div>
  </nav>
  <settings ref="settingsRef" />
  <n-drawer
    v-model:show="drawerShow"
    placement="left"
    :width="240"
    :mask-closable="false"  <!-- 关键：禁止点击遮罩关闭 -->
    class="mobile-drawer"
  >
    <Menu />
  </n-drawer>
</template>

<script setup>
import { ref } from "vue";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
import { siteStatus, siteSettings } from "@/stores";
import { checkPlatform } from "@/utils/helper";
import settings from "@/components/Modal/Settings.vue"
import Menu from "@/components/Global/Menu";
import packageJson from "@/../package.json";

const router = useRouter();
const status = siteStatus();
const sitesettings = siteSettings();
const { asideMenuCollapsed, searchInputFocus } = storeToRefs(status);
const { showGithub, showSider, themeAutoCover } = storeToRefs(sitesettings);

const siteVersion = packageJson.version;
const siteTemp = import.meta.env.RENDERER_VITE_SITE_TITLE;
const siteName = siteTemp + " v." + siteVersion;

const openGithub = () => {
  window.open(packageJson.github);
};

const settingsRef = ref(null);
const openSettings = () => {
  if (settingsRef.value) {
    settingsRef.value.showModal();
  }
};

const drawerShow = ref(false);
</script>

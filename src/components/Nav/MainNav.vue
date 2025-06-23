<template>
  <nav :class="{ 'main-nav': true, 'no-sider': !showSider }">
    <div class="left">
      <div :class="['logo', asideMenuCollapsed ? 'collapsed' : null]" @click="router.push('/')">
        <n-icon class="logo-img" size="30">
          <!-- 你的LOGO SVG内容 -->
        </n-icon>
        <Transition name="fade" mode="out-in">
          <n-text v-if="!asideMenuCollapsed && showSider" class="site-name">
            {{ siteName }}
          </n-text>
        </Transition>
      </div>
      <n-flex :class="['navigation', { hidden: searchInputFocus }]" :size="6">
        <n-button :focusable="false" class="nav-icon" quaternary @click="router.go(-1)">
          <template #icon>
            <n-icon>
              <SvgIcon icon="chevron-left" />
            </n-icon>
          </template>
        </n-button>
        <n-button :focusable="false" class="nav-icon" quaternary @click="router.go(1)">
          <template #icon>
            <n-icon>
              <SvgIcon icon="chevron-right" />
            </n-icon>
          </template>
        </n-button>
      </n-flex>
      <SearchInp />
      <Transition name="fade" mode="out-in">
        <n-button
          v-if="showGithub"
          :focusable="false"
          class="github"
          circle
          quaternary
          @click="openGithub"
        >
          <template #icon>
            <n-icon size="20">
              <SvgIcon icon="github" />
            </n-icon>
          </template>
        </n-button>
      </Transition>
    </div>
    <div class="right">
      <!-- 只保留这个菜单按钮 -->
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
  <n-drawer v-model:show="drawerShow" placement="left" :width="240" :mask-closable="true" class="mobile-drawer">
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

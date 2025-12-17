<template>
  <div class="set-type">
    <n-h3 prefix="bar"> 测试标题Test Title </n-h3>
  <n-card class="set-item">
      <div class="name">
        Button Switch
        <n-text class="tip">Tips are inputted here</n-text>
      </div>
      <n-switch round="false" />
    </n-card>
  <n-card class="set-item">
      <div class="name">
        Input field
        <n-text class="tip">Tips are inputted here</n-text>
      </div>
      <n-input
        :disabled="!useRealIP"
        class="set"
        type="text"
        placeholder="Input..."
      >
        <template #prefix>
          <n-text depth="3">内容</n-text>
        </template>
      </n-input>
    </n-card>
    <div v-if="checkPlatform.electron()" class="all-porxy" style="margin-bottom: 12px">
  <n-card class="set-item">
        <div class="name">
          Electron测试选项
          <n-text class="tip">修改后请点击保存或重启软件以应用</n-text>
        </div>
        <n-flex>
          <Transition name="fade" mode="out-in">
            <n-button type="error" strong secondary @click="setProxy"> 保存并应用 </n-button>
          </Transition>
          <n-select
            v-model:value="proxyProtocol"
            :options="[
              {
                label: '关闭代理',
                value: 'off',
              },
              {
                label: 'HTTP 代理',
                value: 'HTTP',
              },
              {
                label: 'HTTPS 代理',
                value: 'HTTPS',
              },
            ]"
            class="set"
            @update:value="themeAuto = false"
          />
        </n-flex>
      </n-card>
  <n-card class="set-item">
        <div class="name">
          代理服务器地址
          <n-text class="tip">请填写代理服务器地址，如 127.0.0.1</n-text>
        </div>
        <n-input
          v-model:value="proxyServe"
          :disabled="proxyProtocol === 'off'"
          class="set"
          type="text"
          placeholder="请填写代理服务器地址"
        >
          <template #prefix>
            <n-text depth="3">{{ proxyProtocol === "off" ? "-" : proxyProtocol }}</n-text>
          </template>
        </n-input>
      </n-card>
  <n-card class="set-item">
        <div class="name">
          代理服务器端口
          <n-text class="tip">请填写代理服务器端口，如 80</n-text>
        </div>
        <n-input-number
          v-model:value="proxyPort"
          :disabled="proxyProtocol === 'off'"
          :show-button="false"
          :min="1"
          :max="65535"
          class="set"
          placeholder="请填写代理服务器端口"
        />
      </n-card>
    </div>
  <n-card class="set-item" :bordered="false">
      <div class="name">
        列表选项Lists
        <n-text class="tip">在部分列表页面显示几条数据, 过多数据可能会造成响应过慢</n-text>
      </div>
      <n-select
        :options="[
          {
            label: '1',
          },
          {
            label: '2',
          },
          {
            label: '3',
          },
        ]"
        class="set"
        @update:value="themeAuto = false"
      />
    </n-card>
  <n-card class="set-item" :bordered="false">
      <div class="name">
        Button
        <n-text class="tip">Tips</n-text>
      </div>
      <n-button strong secondary type="error"> Click </n-button>
    </n-card>
  </div>
</template>

<script setup>
import { storeToRefs } from "pinia";
import { siteSettings } from "@/stores";
import { checkPlatform } from "@/utils/helper";
import debounce from "@/utils/debounce";

const settings = siteSettings();
const { themeAuto, loadSize, showGithub, proxyProtocol, proxyServe, proxyPort, useRealIP, realIP } =
  storeToRefs(settings);

// 程序重置
const resetApp = () => {
  $dialog.warning({
    title: "网站重置",
    content: "确认重置为默认状态？你的登录状态以及自定义设置都将丢失！",
    positiveText: "重置",
    negativeText: "取消",
    onPositiveClick: () => {
      if (typeof $cleanAll === "undefined") {
        return $message.error("重置操作出现错误，请重试");
      }
      $cleanAll(false);
      $message.success("重置成功，正在重启");
      setTimeout(() => {
        if (checkPlatform.electron()) {
          electron.ipcRenderer.send("window-relaunch");
        } else {
          window.location.href = "/";
        }
      }, 1000);
    },
  });
};

// 应用代理
const setProxy = debounce(() => {
  if (proxyProtocol.value === "off" || !proxyServe.value || !proxyPort.value) {
    electron.ipcRenderer.send("remove-proxy");
    $message.success("成功关闭网络代理");
    return false;
  }
  const proxyConfig = {
    protocol: proxyProtocol.value,
    server: proxyServe.value,
    port: proxyPort.value,
  };
  if (checkPlatform.electron()) {
    electron.ipcRenderer.send("set-proxy", proxyConfig);
  }
  $message.success("网络代理配置完成，请重启软件");
}, 300);
</script>

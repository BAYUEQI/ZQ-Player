<template>
  <div class="set-type">
    <n-h3 prefix="bar"> 其他 </n-h3>
  <n-card class="set-item">
      <div class="name">
        显示版本号
        <n-text class="tip">将会在左上角显示当前版本号, 刷新后或重启软件生效</n-text>
      </div>
      <n-switch v-model:value="showVersion" :round="false" />
    </n-card>
  <n-card class="set-item">
      <div class="name">
        使用真实 IP 地址
        <n-text class="tip">十分推荐开启的功能，尤其是用国外服务器或部署平台的网易云音乐API, 在海外或部分地区可能会受到限制，可开启此处解决</n-text>
      </div>
      <n-switch v-model:value="useRealIP" :round="false" />
    </n-card>
  <n-card class="set-item">
      <div class="name">
        真实 IP 地址
        <n-text class="tip">可在此处输入国内 IP, 可以通过CMD的ping music.163.com获取</n-text>
      </div>
      <n-input v-model:value="realIP" :disabled="!useRealIP" class="set" type="text" placeholder="请填写真实 IP 地址">
        <template #prefix>
          <n-text depth="3">IP</n-text>
        </template>
      </n-input>
    </n-card>
    <div v-if="checkPlatform.electron()" class="all-porxy" style="margin-bottom: 12px">
  <n-card class="set-item">
        <div class="name">
          网络代理
          <n-text class="tip">修改后请点击保存或重启软件以应用</n-text>
        </div>
        <n-flex>
          <Transition name="fade" mode="out-in">
            <n-button type="error" strong secondary @click="setProxy"> 保存并应用 </n-button>
          </Transition>
          <n-select v-model:value="proxyProtocol" :options="[
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
      ]" class="set" @update:value="themeAuto = false" />
        </n-flex>
      </n-card>
  <n-card class="set-item">
        <div class="name">
          代理服务器地址
          <n-text class="tip">请填写代理服务器地址，如 127.0.0.1</n-text>
        </div>
        <n-input v-model:value="proxyServe" :disabled="proxyProtocol === 'off'" class="set" type="text"
          placeholder="请填写代理服务器地址">
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
        <n-input-number v-model:value="proxyPort" :disabled="proxyProtocol === 'off'" :show-button="false" :min="1"
          :max="65535" class="set" placeholder="请填写代理服务器端口" />
      </n-card>
    </div>
  <n-card class="set-item">
      <div class="name">显示 GitHub 仓库按钮</div>
      <n-switch v-model:value="showGithub" :round="false" />
    </n-card>
    <n-collapse>
      <n-collapse-item title="网易云API设定">
  <n-card class="set-item">
          <n-text class="tip">网站当前的默认API有可能随时超出而关闭, 可以通过目前自部署或者目前网络上公开使用的API来解决</n-text>
        </n-card>
  <n-card class="set-item" :bordered="false">
          <div class="name">
            使用自定义网易云API
            <n-text class="tip">开启后将使用自定义网易云音乐API地址, 切换或刷新页面生效</n-text>
          </div>
          <n-switch v-model:value="useCustomNCMServer" :round="false" />
        </n-card>
  <n-card class="set-item" :bordered="false">
          <div class="name">
            网易云API地址
            <n-text class="tip">请输入自定义网易云API地址（如 http://localhost:3000 ,后面不带斜杠）</n-text>
          </div>
          <n-input v-model:value="ncmServer" :disabled="!useCustomNCMServer" class="set" type="text" placeholder="请输入网易云API地址" />
        </n-card>
  <n-card class="set-item" :bordered="false">
          <div class="name">
            使用自定义 UNM 服务器
            <n-text class="tip">开启后将使用自定义 UnblockNeteaseMusic 服务器地址, 切换或刷新页面生效</n-text>
          </div>
          <n-switch v-model:value="useCustomUNMServer" :round="false" />
        </n-card>
  <n-card class="set-item" :bordered="false">
          <div class="name">
            UNM 服务器地址
            <n-text class="tip">请输入自定义 UNM 服务器地址（如 http://localhost:3000 ,后面不带斜杠）</n-text>
          </div>
          <n-input v-model:value="unmServer" :disabled="!useCustomUNMServer" class="set" type="text" placeholder="请输入 UNM 服务器地址" />
        </n-card>
  <n-card class="set-item" :bordered="false">
            <n-text class="tip" style="word-break: break-all; white-space: pre-line;">
            提示: 如果您使用NeteaseCloudMusicApi的Reborn版本, 可以在网易云音乐API地址的基础上增加"/song/url"地址, 如 http://localhost:3000/song/url
            </n-text>
        </n-card>
      </n-collapse-item>
    </n-collapse>
  <n-card class="set-item" :bordered="false">
      <div class="name">
        默认加载数量
        <n-text class="tip">在部分列表页面显示几条数据, 过多数据可能会造成响应过慢</n-text>
      </div>
      <n-select v-model:value="loadSize" :options="[
        {
          label: '少一点（ 30 条 ）',
          value: 30,
        },
        {
          label: '差不多刚刚好（ 50 条 ）',
          value: 50,
        },
        {
          label: '我要很多（ 100 条 ）',
          value: 100,
        },
      ]" class="set" @update:value="themeAuto = false" />
    </n-card>
  <n-card class="set-item" :bordered="false">
      <div class="name">
        清除PWA缓存
        <n-text class="tip">此操作会清除PWA缓存并拉取新的版本, 适用于同步仓库部署完成后使用</n-text>
      </div>
      <n-button strong secondary type="error" @click="getNewPage"> 获取 </n-button>
    </n-card>
    <n-card class="set-item">
      <div class="name">
        程序重置
        <n-text class="tip">若程序显示异常或出现问题时可尝试此操作</n-text>
      </div>
      <n-button strong secondary type="error" @click="resetApp"> 重置 </n-button>
    </n-card>
    <!--n-card class="set-item">
      <div class="name">
        打开完整设置页
        <n-text class="tip">打开完整设置页面，可在此处查看更多设置</n-text>
      </div>
      <n-button strong secondary type="error" @click="toSettingsPage"> 打开 </n-button>
    </n-card-->
  </div>
</template>

<script setup>
import { storeToRefs } from "pinia";
import { siteSettings, siteStatus } from "@/stores";
import { checkPlatform } from "@/utils/helper";
import debounce from "@/utils/debounce";

const status = siteStatus();
const settings = siteSettings();
const { themeAuto, loadSize, showGithub, proxyProtocol, proxyServe, proxyPort, useRealIP, realIP, useCustomNCMServer, ncmServer, useCustomUNMServer, unmServer, showVersion } =
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
          location.replace("/");
          // window.location.href = "/";
        }
      }, 1000);
    },
  });
};

// 清除PWA缓存
const getNewPage = () => {
  $dialog.warning({
    title: "确定要清除缓存并刷新页面吗?",
    content: "此操作将会清除 PWA 缓存并重新获取最新页面",
    positiveText: "确定",
    negativeText: "取消",
    onPositiveClick: async () => {
      try {
        // 清除所有 PWA 缓存
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const registration of registrations) {
            await registration.unregister();
          }
          const cacheNames = await caches.keys();
          for (const cacheName of cacheNames) {
            await caches.delete(cacheName);
          }
        }

        $message.success("缓存已清除，正在刷新页面");

        setTimeout(() => {
          if (checkPlatform.electron()) {
            electron.ipcRenderer.send("window-relaunch");
          } else {
            window.location.reload(true);
          }
        }, 1000);
      } catch (err) {
        $message.error("清除缓存失败:" + err.message);
      }
    },
  });
};
// 打开完整设置页面
const toSettingsPage = () => {
  status.showFullPlayer = false;
  window.location.href = "/#/setting";
};

// 应用代理
const setProxy = debounce(() => {
  if (proxyProtocol.value === "off" || !proxyServe.value || !proxyPort.value) {
    electron.ipcRenderer.send("remove-proxy");
    $message.success("成功关闭网络代理");
    return false;
  };
  const proxyConfig = {
    protocol: proxyProtocol.value,
    server: proxyServe.value,
    port: proxyPort.value,
  };
  if (checkPlatform.electron()) {
    electron.ipcRenderer.send("set-proxy", proxyConfig);
  };
  $message.success("网络代理配置完成，请重启软件");
}, 300);
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
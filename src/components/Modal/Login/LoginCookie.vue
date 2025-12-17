<template>
  <div class="login-cookie">
    <n-alert type="info" :bordered="bordered" style="margin-bottom: 16px;">
      可在官方的
      <n-a href="https://music.163.com/" target="_blank">网页端</n-a>
      或者点击下方使用官方网页端登录获取cookie, 格式: <code>MUSIC_U=xxxxxx;</code>
    </n-alert>
    <n-input v-model:value="cookie" :autosize="{ minRows: 3, maxRows: 6 }" type="textarea" placeholder="请输入 Cookie" />
    <n-flex class="menu">
      <n-button type="primary" @click="openWeb">打开官方登陆页面</n-button>
      <n-button type="primary" @click="login">登录</n-button>
    </n-flex>
  </div>
</template>

<script setup>

import { checkPlatform } from "@/utils/helper";
const isWeb = !checkPlatform.electron();
const cookie = ref("");
const emit = defineEmits(["setLoginData"]);

// 开启窗口
const openElectronBrowser = () => {
  window.$dialog.info({
    title: "使用前告知",
    content:
      "请知悉，该功能仍旧处于测试阶段, 无法确保账号的安全性以及稳定性！请自行决定是否使用！如遇打开窗口后页面出现白屏或者无法点击等情况，请关闭后重试",
    positiveText: "我已了解",
    negativeText: "取消",
    onPositiveClick: () => electron.ipcRenderer.send("open-login-web"),
  });
};

// Cookie 登录
const login = async () => {
  if (!cookie.value) {
    $message.warning("请输入 Cookie");
    return;
  }
  cookie.value = cookie.value.trim();
  console.log(cookie.value.endsWith(";"));

  // 是否为有效 Cookie
  if (!cookie.value.includes("MUSIC_U") || !cookie.value.endsWith(";")) {
    $message.warning("请输入有效的 Cookie");
    return;
  }
  // 写入 Cookie
  try {
    $message.success("登录成功");
    const res = { code: 200, cookie: cookie.value };
    emit("setLoginData", res);
  } catch (error) {
    $message.error("登录失败，请重试");
    console.error("Cookie 登录出错：", error);
  }
};

const openWeb = () => {
  if (isWeb) {
    $message.warning("功能开发中!");
    // window.open("https://music.163.com/", "_blank");
  } else {
    openElectronBrowser();
  }
};

onMounted(() => {
  if (!isWeb) {
    electron.ipcRenderer.on("send-cookies", (_, value) => {
      if (!value) return;
      cookie.value = value;
      // 测试用
      // cookie.value = "MUSIC_U=1eb9ce22024bb666e99b6743b2222f29ef64a9e88fda0fd5754714b900a5d70d993166e004087dd3b95085f6a85b059f5e9aba41e3f2646e3cebdbec0317df58c119e5;";
      login();
    });
  }
});

</script>

<style lang="scss" scoped>
.login-cookie {
  margin-top: 20px;
  min-height: 240px;
  transition: height 0.3s ease;

  .n-input,
  .n-button {
    width: 100%;
  }

  code {
    font-size: 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background-color: var(--n-border-color);
    padding: 4px 6px;
    border-radius: 8px;
    margin: 4px 0;
    font-family: auto;
  }

  .menu {
    margin-top: 20px;
    opacity: 1;
    transition: opacity 0.3s ease; // 添加按钮透明度过渡

    .n-button {
      width: auto;
      flex: 1;
      margin: 0;
    }
  }
}
</style>
<template>
  <div class="login-cookie">
    <n-alert type="info" :bordered="bordered" style="margin-bottom: 16px;">
      可在官方的
      <n-a href="https://music.163.com/" target="_blank">网页端</n-a>
      获取Cookie，Cookie格式: <code>MUSIC_U=xxxxxx;</code>
    </n-alert>
    <n-input v-model:value="cookie" :autosize="{ minRows: 3, maxRows: 6 }" type="textarea" placeholder="请输入 Cookie" />
    <n-flex class="menu">
      <n-button type="primary" tag="a" href="https://github.com/BAYUEQI/ZQ-Player/blob/main/README.md#-%E7%BD%91%E6%98%93%E4%BA%91%E9%9F%B3%E4%B9%90cookie%E8%8E%B7%E5%8F%96" target="_blank">获取Cookie教程</n-button>
      <n-button type="primary" @click="login">登录</n-button>
    </n-flex>
  </div>
</template>

<script setup>

const cookie = ref("");
const emit = defineEmits(["setLoginData"]);

// Cookie 登录
const login = async () => {
  if (!cookie.value) {
    $message.warning("请输入 Cookie");
    return;
  }
  cookie.value = cookie.value.trim();

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

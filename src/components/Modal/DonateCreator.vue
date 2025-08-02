<template>
  <n-modal v-model:show="show" preset="dialog" title="捐赠支持作者" :mask-closable="true" :close-on-esc="true" @after-leave="onClose">
    <div class="donate-content">
      <div class="donate-imgs">
        <!-- 你可以在这里添加多张图片，src为相对路径 -->
        <img v-for="(img, idx) in donateImgs" :key="idx" :src="img" class="donate-img" alt="捐赠二维码" style="width:180px;height:180px;" />
      </div>
    <a href="https://blog.520jacky.ip-ddns.com/img/8.jpg" target="_blank" rel="noopener" style="margin-bottom: 8px; color: #409eff; text-decoration: underline;">
        跳转到捐赠页面
    </a>
      <div class="donate-tip">感谢您的支持！</div>
    </div>
  </n-modal>
</template>

<script setup>
import { ref, watch, defineExpose } from 'vue';
import { NModal } from 'naive-ui';

const show = ref(false);
const donateImgs = ref([
  'https://blog.520jacky.ip-ddns.com/img/8.jpg'// ,'/imgs/donate/wechat.png', '/imgs/donate/alipay.png'
]);

function open(imgs) {
  if (Array.isArray(imgs) && imgs.length) {
    donateImgs.value = imgs;
  }
  show.value = true;
}
function close() {
  show.value = false;
}
function onClose() {
  // 关闭后清空图片
  donateImgs.value = [];
}

defineExpose({ open, close });
</script>

<style scoped>
.donate-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 260px;
}
.donate-imgs {
  display: flex;
  flex-direction: row;
  gap: 16px;
  margin-bottom: 12px;
}
.donate-img {
  width: 120px;
  height: 120px;
  object-fit: contain;
  border-radius: 8px;
  border: 1px solid #eee;
  background: #fafbfc;
}
.donate-tip {
  margin-top: 8px;
  color: #888;
  font-size: 14px;
}
</style>

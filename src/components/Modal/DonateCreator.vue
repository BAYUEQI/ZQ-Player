<template>
  <n-modal v-model:show="show" preset="dialog" title="捐赠支持作者" :mask-closable="true" :close-on-esc="true" @after-leave="onClose">
    <div class="donate-content">
      <div class="donate-imgs">
        <img v-for="(img, idx) in donateImgs" :key="idx" :src="img" class="donate-img" alt="捐赠二维码" />
      </div>
      <div class="donate-tip">感谢您的支持！</div>
    </div>
  </n-modal>
</template>

<script setup>
import { ref, watch, defineExpose } from 'vue';
import { NModal } from 'naive-ui';

const show = ref(false);
const defaultImg = 'https://blog.520jacky.dpdns.org/img/8.jpg';
const donateImgs = ref([defaultImg]);

function open(imgs) {
  if (Array.isArray(imgs) && imgs.length) {
    donateImgs.value = imgs;
  } else {
    donateImgs.value = [defaultImg];
  }
  show.value = true;
}
function close() {
  show.value = false;
}
function onClose() {
  // 关闭后恢复默认图片
  donateImgs.value = [defaultImg];
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
  width: 240px;
  height: auto;
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

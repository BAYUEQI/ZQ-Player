<template>
  <n-result class="error" status="404" title="你要去哪(っ °Д °;)っ" description="怎么跑到这来了？">
    <template #footer>
      <n-button type="primary" @click="router.go(-1)"> 返回上一级 </n-button>
    </template>
  </n-result>
</template>

<script setup>import PageTransition from "@/components/Global/PageTransition.vue";

import { useRouter } from "vue-router";

const router = useRouter();
</script>

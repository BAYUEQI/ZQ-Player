<template>
  <div class="like-artists">
  <PageTransition>
    <Transition name="fade" mode="out-in">
      <div v-if="userLikeData.artists?.length" class="list">
        <!-- 列表 -->
        <MainCover :data="userLikeData.artists" type="artist" columns="3 s:4 m:5 l:6" />
      </div>
      <n-empty
        v-else
        description="当前暂无收藏歌手"
        class="tip"
        style="margin-top: 60px"
        size="large"
      />
    </Transition>
    </PageTransition>
</div>
</template>

<script setup>import PageTransition from "@/components/Global/PageTransition.vue";

import { storeToRefs } from "pinia";
import { siteData } from "@/stores";

const data = siteData();
const { userLikeData } = storeToRefs(data);
</script>

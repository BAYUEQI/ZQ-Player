<!-- 搜索 - 歌手 -->
<template>
  <div class="search-artists">
  <PageTransition>
    <!-- 列表 -->
    <Transition name="fade" mode="out-in">
      <div v-if="searchData !== 'empty'" class="list">
        <MainCover :data="searchData" type="artist" columns="3 s:4 m:5 l:6" />
      </div>
      <n-empty
        v-else
        :description="`很抱歉，未能找到与 ${searchKeywords} 相关的任何歌手`"
        style="margin-top: 60px"
        size="large"
      >
        <template #icon>
          <n-icon>
            <SvgIcon icon="search-off" />
          </n-icon>
        </template>
      </n-empty>
    </Transition>
    </PageTransition>
</div>
</template>

<script setup>import PageTransition from "@/components/Global/PageTransition.vue";

import { getSearchRes } from "@/api/search";
import { useRouter } from "vue-router";
import { siteSettings } from "@/stores";
import formatData from "@/utils/formatData";

const router = useRouter();
const settings = siteSettings();

// 搜索数据
const searchData = ref([]);
const totalCount = ref(0);
const searchKeywords = ref(router.currentRoute.value.query?.keywords || "");
const pageNumber = ref(Number(router.currentRoute.value.query?.page) || 1);

// 获取搜索数据
const getSearchResData = (
  keywords = searchKeywords.value,
  limit = settings.loadSize,
  offset = 0,
  type = 100,
) => {
  try {
    searchData.value = [];
    getSearchRes(keywords, limit, offset, type).then((res) => {
      console.log(res);
      // 数据总数
      totalCount.value = res.result.artistCount;
      if (res.result.artistCount === 0) return (searchData.value = "empty");
      // 处理数据
      searchData.value = formatData(res.result.artists, "artist");
    });
  } catch (error) {
    console.error("搜索出现错误：", error);
    $message.error("搜索出现错误");
  }
};

// 监听路由变化
watch(
  () => router.currentRoute.value,
  (val) => {
    if (val.name == "sea-artists") {
      // 更改参数
      pageNumber.value = Number(val.query?.page) || 1;
      searchKeywords.value = val.query?.keywords || "";
      // 调用接口
      getSearchResData(
        searchKeywords.value,
        settings.loadSize,
        (pageNumber.value - 1) * settings.loadSize,
      );
    }
  },
);

onBeforeMount(() => {
  getSearchResData(
    searchKeywords.value,
    settings.loadSize,
    (pageNumber.value - 1) * settings.loadSize,
  );
});
</script>

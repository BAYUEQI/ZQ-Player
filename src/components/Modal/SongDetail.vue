<template>
  <n-modal
    v-model:show="show"
    class="song-detail"
    preset="card"
    :style="{
      width: '80vw',
      maxWidth: '1200px',
      '@media screen and (max-width: 768px)': {
        width: '100vw !important',
        maxWidth: '100vw !important',
        margin: '0 !important',
        borderRadius: '0 !important'
      }
    }"
    :bordered="false"
    size="huge"
    :segmented="{ content: true }"
    :mask-closable="true"
  >
    <template #header>
      <div class="modal-title">
        <n-text>歌曲详情</n-text>
      </div>
    </template>

    <div class="detail" v-if="songDetail">
      <div class="pic">
        <n-image
          class="coverImg"
          :previewed-img-props="{ style: { borderRadius: '8px' } }"
          :src="songDetail?.coverSize?.l || songDetail?.cover"
          fallback-src="/imgs/pic/album.jpg?assest"
        >
          <template #placeholder>
            <div class="cover-loading">
              <n-spin />
            </div>
          </template>
        </n-image>
        <n-image
          class="shadow"
          preview-disabled
          :src="songDetail?.coverSize?.l || songDetail?.cover"
          fallback-src="/imgs/pic/album.jpg?assest"
        />
      </div>
      <div class="right">
        <div class="intr">
          <n-text class="name text-hidden">{{ songDetail.name }}</n-text>
          <n-text depth="3" class="alia" v-if="songDetail.alia">{{ songDetail.alia }}</n-text>
          <n-space class="tag">
            <n-tag v-if="songDetail.fee == 1 || songDetail.fee == 4" class="vip" round :bordered="false">
              {{ songDetail.fee == 1 ? "VIP" : "EP" }}
            </n-tag>
            <n-tag v-if="songDetail.pc" class="cloud" round type="info" :bordered="false">
              云盘歌曲
            </n-tag>
          </n-space>
          <div class="item">
            <n-icon :depth="3">
              <SvgIcon icon="user" />
            </n-icon>
            <div v-if="songDetail.artists && Array.isArray(songDetail.artists)" class="all-ar">
              <n-text v-for="ar in songDetail.artists" :key="ar.id" class="ar" depth="3">
                {{ ar.name }}
              </n-text>
            </div>
            <n-text v-else class="ar" depth="3">
              {{ songDetail.artists || "未知艺术家" }}
            </n-text>
          </div>
          <div class="item" v-if="songDetail.album">
            <n-icon :depth="3">
              <SvgIcon icon="disc" />
            </n-icon>
            <n-text class="text" @click="router.push(`/album?id=${songDetail.album.id}`)">
              {{ songDetail.album.name }}
            </n-text>
          </div>
        </div>
        <n-space class="button">
          <n-button type="primary" strong secondary @click="playSong(songDetail)">
            <template #icon>
              <n-icon>
                <SvgIcon icon="play" />
              </n-icon>
            </template>
            立即播放
          </n-button>
          <n-button strong secondary @click="addPlaylistRef?.openAddToPlaylist(songId)">
            <template #icon>
              <n-icon>
                <SvgIcon icon="playlist-add" />
              </n-icon>
            </template>
            添加到歌单
          </n-button>
          <n-button strong secondary @click="router.push(`/comment?id=${songDetail.id}`)">
            <template #icon>
              <n-icon>
                <SvgIcon icon="comment-text" />
              </n-icon>
            </template>
            查看评论
          </n-button>
          <n-button strong secondary v-if="songDetail.mv" @click="router.push(`/videos-player?id=${songDetail.mv}`)">
            <template #icon>
              <n-icon>
                <SvgIcon icon="video" />
              </n-icon>
            </template>
            观看 MV
          </n-button>
        </n-space>
      </div>
    </div>

    <!-- 热门评论 -->
    <div class="comments" v-if="hotCommentData.length > 0">
      <n-h6 prefix="bar">热门评论</n-h6>
      <div class="content">
        <CommentList :data="hotCommentData" :loadingNum="5" />
      </div>
    </div>

    <!-- 相似歌单 -->
    <div class="simiPlayList" v-if="simiPlayList.length > 0">
      <n-divider />
      <n-h6 prefix="bar">包含这首歌的歌单</n-h6>
      <div class="cover-lists">
        <n-grid cols="2 s:3 m:4 l:5" responsive="screen" :x-gap="16" :y-gap="16">
          <n-gi v-for="(item, index) in simiPlayList" :key="index">
            <n-card
              class="cover"
              :content-style="{ padding: 0 }"
              hoverable
              @click="router.push(`/playlist?id=${item.id}`)"
            >
              <div class="img">
                <n-image
                  :src="item.cover + '?param=512y512'"
                  class="cover-img"
                  preview-disabled
                  lazy
                  @load="(e) => { e.target.style.opacity = 1; }"
                >
                  <template #placeholder>
                    <div class="cover-loading">
                      <img class="loading-img" src="/imgs/pic/album.jpg?assest" alt="album" />
                    </div>
                  </template>
                </n-image>
                <div class="mask">
                  <div class="play-count">
                    <n-icon>
                      <SvgIcon icon="play" />
                    </n-icon>
                    <span>{{ item.playCount }}</span>
                  </div>
                  <div class="play-button">
                    <n-icon>
                      <SvgIcon icon="play-circle" />
                    </n-icon>
                  </div>
                </div>
              </div>
              <div class="info">
                <div class="name">{{ item.name }}</div>
                <div class="creator">by {{ item.artist?.nickname }}</div>
              </div>
            </n-card>
          </n-gi>
        </n-grid>
      </div>
    </div>

    <!-- 添加到歌单 -->
    <AddPlaylist ref="addPlaylistRef" />
  </n-modal>
</template>

<script setup>
import { useRouter } from "vue-router";
import { getSongDetail, getSimiPlayList } from "@/api/song";
import { getHotComment } from "@/api/comment";
import { addSongToNext, initPlayer, fadePlayOrPause } from "@/utils/Player";
import { musicData, siteStatus, siteSettings } from "@/stores";
import { formatNumber } from "@/utils/helper";
import formatData from "@/utils/formatData";
import AddPlaylist from "@/components/Modal/AddPlaylist.vue";
import CommentList from "@/components/List/CommentList.vue";

const router = useRouter();
const music = musicData();
const status = siteStatus();

// 子组件
const addPlaylistRef = ref(null);

// 控制显示
const show = ref(false);

// 歌曲信息
const songId = ref(null);
const songDetail = ref(null);

// 热门评论数据
const hotCommentData = ref([]);

// 相似歌单数据
const simiPlayList = ref([]);

// 获取歌曲详情
const getSongDetailData = async (ids) => {
  if (!ids) {
    $message.error("歌曲ID不能为空");
    return;
  }

  try {
    const detail = await getSongDetail(ids);
    if (!detail?.songs?.length) {
      throw new Error("未找到歌曲信息");
    }
    const data = formatData(detail.songs[0], "song");
    songDetail.value = data?.[0] ?? null;
    // 获取热门评论
    getHotCommentData(ids);
    // 获取相似歌单
    getSimiPlayListData(ids);
  } catch (error) {
    console.error("获取歌曲详情失败：", error);
    songDetail.value = null;
    $message.error(error.message === "未找到歌曲信息" ? error.message : "获取歌曲详情失败，请稍后重试");
  }
};

// 获取热门评论
const getHotCommentData = async (id) => {
  try {
    const res = await getHotComment(id, 0, 5);
    if (res.hotComments?.length > 0) {
      hotCommentData.value = res.hotComments;
    }
  } catch (error) {
    console.error("获取热门评论失败：", error);
  }
};

// 获取相似歌单
const getSimiPlayListData = async (id) => {
  try {
    const res = await getSimiPlayList(id);
    if (res.playlists?.length > 0) {
      simiPlayList.value = [];
      res.playlists.forEach((v) => {
        simiPlayList.value.push({
          id: v.id,
          cover: v.coverImgUrl,
          name: v.name,
          artist: v.creator,
          playCount: formatNumber(v.playCount),
        });
      });
    }
  } catch (error) {
    console.error("获取相似歌单失败：", error);
  }
};

// 播放歌曲
const playSong = async (data) => {
  if (!data) return;
  
  // 若开启了缓存且正在加载
  const settings = siteSettings();
  if (settings.useMusicCache && status.playLoading) {
    $message.warning("歌曲正在缓冲中，请稍后");
    return false;
  }
  
  // 更改播放模式为普通模式
  status.playMode = "normal";
  
  // 检查当前页面
  const isPage = router.currentRoute.value.matched?.[0].path || null;
  
  // 是否关闭心动模式
  if (isPage !== "/like-songs") status.playHeartbeatMode = false;
  
  // 是否为当前播放歌曲
  if (music.getPlaySongData?.id === data?.id) {
    // 继续播放
    fadePlayOrPause();
  } else {
    // 添加到播放列表并播放
    addSongToNext(data, true);
    // 设置当前播放歌曲
    music.playSongData = data;
    // 初始化播放器
    await initPlayer(true);
  }
  
  // 附加来源
  music.playSongSource = Number(songId.value);
};

// 打开详情
const openDetail = (id) => {
  songId.value = id;
  // 重置数据
  songDetail.value = null;
  hotCommentData.value = [];
  simiPlayList.value = [];
  // 获取歌曲详情
  getSongDetailData(id);
  // 显示弹窗
  show.value = true;
};

// 关闭详情
const closeDetail = () => {
  show.value = false;
  // 清理组件数据
  songDetail.value = null;
  hotCommentData.value = [];
  simiPlayList.value = [];
};

defineExpose({
  openDetail,
  closeDetail,
});
</script>

<style lang="scss" scoped>
.song-detail {
  .modal-title {
    font-size: 20px;
    font-weight: bold;
  }

  .detail {
    display: flex;
    flex-direction: row;

    .pic {
      height: auto;
      display: flex;
      min-width: 180px;
      align-items: center;
      justify-content: center;
      max-width: 280px;
      border-radius: 8px;
      margin-right: 40px;
      position: relative;
      transition: transform 0.3s;

      &:active {
        transform: scale(0.95);
      }

      .coverImg {
        border-radius: 8px;
        width: 100%;
        height: 100%;
        overflow: hidden;
        z-index: 1;

        :deep(img) {
          width: 100%;
        }

        .cover-loading {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 0;
          padding-bottom: 100%;
          background-color: #0001;

          .n-spin-body {
            position: absolute;
            top: 0;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }
      }

      .shadow {
        position: absolute;
        top: 12px;
        height: 100%;
        width: 100%;
        filter: blur(16px) opacity(0.6);
        transform: scale(0.92, 0.96);
        z-index: 0;
        background-size: cover;
        aspect-ratio: 1/1;

        :deep(img) {
          width: 100%;
        }
      }
    }

    .right {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;

      .intr {
        display: flex;
        flex-direction: column;

        .name {
          -webkit-line-clamp: 2;
          font-size: 40px;
          font-weight: bold;
        }

        .alia {
          font-size: 20px;
        }

        .tag {
          margin: 12px 0;
        }

        .item {
          font-size: 16px;
          display: flex;
          align-items: center;
          margin-bottom: 4px;

          .n-icon {
            margin-right: 6px;
          }

          .text {
            cursor: pointer;
            transition: all 0.3s;

            &:hover {
              color: var(--main-color);
            }
          }

          .all-ar {
            margin-top: 4px;
            font-size: 13px;
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 1;
            overflow: hidden;
            word-break: break-all;

            .ar {
              display: inline-flex;

              &::after {
                content: "/";
                margin: 0 4px;
              }

              &:last-child {
                &::after {
                  display: none;
                }
              }
            }
          }
        }
      }

      .button {
        margin-top: 16px;
        gap: 12px !important;
      }
    }

    @media (max-width: 768px) {
      flex-direction: column;
      width: 100%;

      .pic {
        margin-bottom: 20px;
      }

      .right {
        .intr {
          .name {
            font-size: 24px;
          }

          .alia {
            font-size: 16px;
          }
        }
      }
    }
  }

  .comments {
    margin-top: 40px;
  }

  .simiPlayList {
    margin-top: 40px;

    .cover-lists {
      margin-top: 16px;

      .cover {
        cursor: pointer;
        transition: all 0.3s;
        border-radius: 8px;
        overflow: hidden;

        &:hover {
          transform: translateY(-6px);

          .img .mask {
            opacity: 1;
          }
        }

        .img {
          position: relative;
          width: 100%;
          height: 0;
          padding-bottom: 100%;
          overflow: hidden;

          .cover-img {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;

            :deep(img) {
              width: 100%;
              height: 100%;
              object-fit: cover;
              opacity: 0;
              transition: opacity 0.35s ease-in-out;
            }

            .cover-loading {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              background-color: #0001;

              .loading-img {
                width: 100%;
                height: 100%;
                object-fit: cover;
              }
            }
          }

          .mask {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(to bottom, transparent 60%, rgba(0, 0, 0, 0.6) 100%);
            opacity: 0.8;
            transition: all 0.3s;
            display: flex;
            flex-direction: column;
            justify-content: space-between;

            .play-count {
              padding: 8px;
              display: flex;
              align-items: center;
              color: #fff;
              font-size: 12px;
              align-self: flex-end;

              .n-icon {
                margin-right: 4px;
              }
            }

            .play-button {
              align-self: center;
              margin-bottom: 40%;
              width: 48px;
              height: 48px;
              border-radius: 50%;
              background-color: rgba(255, 255, 255, 0.2);
              backdrop-filter: blur(4px);
              display: flex;
              align-items: center;
              justify-content: center;
              color: #fff;
              font-size: 24px;
              cursor: pointer;
              transition: all 0.3s;

              &:hover {
                transform: scale(1.1);
                background-color: rgba(255, 255, 255, 0.3);
              }
            }
          }
        }

        .info {
          padding: 12px;

          .name {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 4px;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
          }

          .creator {
            font-size: 12px;
            color: var(--text-color-3);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }
      }
    }
  }
}
</style>
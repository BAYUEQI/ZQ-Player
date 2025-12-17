import axios from "@/utils/request";
import packageJson from "../../package.json"
/**
 * 杂项
 */

/**
 * 获取轮播图
 * @param {number} type - 资源类型 / 0: pc / 1: android / 2: iphone / 3: ipad
 */
export const getBanner = (type = 0) => {
  return axios({
    method: "GET",
    url: `/banner?type=${type}`,
  });
};

/**
 * 资源点赞 ( MV,电台,视频 )
 * @param {number} id - 资源 id
 * @param {number} t - 操作, 1 为点赞, 其他为取消点赞
 * @param {number} type - 资源类型 / 0: 歌曲 / 1: mv / 2: 歌单 / 3: 专辑 / 4: 电台节目 / 5: 视频 / 6: 动态 / 7: 电台
 */
export const resourceLike = (id, t = 1, type = 0) => {
  return axios({
    method: "GET",
    url: "/resource/like",
    params: {
      id,
      t,
      type,
    },
  });
};

/**
 * 检查更新
 */
export const checkWebUpdates = async () => {
  const nowVersion = packageJson.version;
  const rawUrl = "https://raw.githubusercontent.com/BAYUEQI/ZQ-Player/refs/heads/master-fix/package.json";
  const response = await fetch(rawUrl,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  if (response && response?.version) {
    const latestVersion = response.version;
    if (nowVersion !== latestVersion) {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
};

/**
 * 获取最新版本信息
 */
export const getWebUpdates = async () => {
  const rawUrl = "https://raw.githubusercontent.com/BAYUEQI/ZQ-Player/refs/heads/master-fix/package.json"
  const getLatestVersion = await fetch(rawUrl,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  if (getLatestVersion) {
    return getLatestVersion; 
  } else {
    return null;
  }
}

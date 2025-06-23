import axios from "@/utils/request";
import { convertToTTML } from '@/utils/parseLyric';
/**
 * 歌曲部分
 */

/**
 * 获取指定音乐的详情
 * @param {string} ids - 要获取详情的音乐ID，多个ID用逗号分隔
 */
export const getSongDetail = (ids) => {
  const timestamp = new Date().getTime();
  return axios({
    method: "POST",
    url: `/song/detail?timestamp=${timestamp}`,
    params: {
      ids,
    },
  });
};
/**
 * 获取指定音乐的歌词
 * @param {number} id - 要获取歌词的音乐ID
 */
export const getSongLyricLegacy = async (id) => {
  return axios({
    method: "GET",
    url: "/lyric/new", 
    params: {
      id,
    }
  })
};

/**
 * 获取音乐 URL
 * @param {number} id - 要获取音乐的 ID。
 * @param {string} [level=standard] - 播放音质等级 / standard: 标准 /  higher: 较高 / exhigh: 极高 / lossless: 无损 / hires: Hi-Res / jyeffect: 高清环绕声 / sky: 沉浸环绕声 / jymaster: 超清母带
 */
export const getSongUrl = (id, level = "standard") => {
  return axios({
    method: "GET",
    url: "/song/url/v1",
    params: {
      id,
      level,
      timestamp: new Date().getTime(),
    },
  });
};

/**
 * 网易云解灰
 * @param {number} id - 要替换播放链接的音乐ID
 */
export const getMusicNumUrl = async (id) => {
  const server = "pyncmd,kuwo";
  if (import.meta.env["RENDERER_VITE_SITE_ROOT"] === "true") {
    var unmurl = "/api/unblock";
  } else {
    var unmurl = `${import.meta.env.VITE_UNM_API}`;
  }
  const url = `${unmurl}/match?id=${id}&server=${server}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    return Promise.reject(new Error());
  }
  return await response.json();
};

/**
 * 获取指定音乐的歌词
 * @param {number} id - 要获取歌词的音乐ID
 */
export const getSongLyric = async (id) => {
  const response = await axios({
    method: "GET",
    url: "/lyric/new",
    params: { id }
  });
  
  // 确保response.data存在再进行转换
  const responseData = response || {};
  
  return {
    original: responseData,
    ttml: responseData,
  };
};

/**
 * 歌曲下载
 * @param {number} id - 要替换播放链接的音乐ID
 * @param {number} br - 码率, 默认设置了 999000 即最大码率, 如果要 320k 则可设置为 320000, 其他类推
 */
export const getSongDownloadNew = async (params) => {
  // 参数校验
  if (!params?.id || !params?.br) {
    throw new Error("Missing required parameters");
  }

  // 参数处理
  const { id, br } = params;
  const encodedId = encodeURIComponent(id);
  const encodedBr = encodeURIComponent(br);

  // 构建 URL
  if (import.meta.env["RENDERER_VITE_SITE_ROOT"] === "true") {
    var unmurl = "/api/unblock";
  } else {
    var unmurl = `${import.meta.env.VITE_UNM_API}`;
  };
  const url = `${
    unmurl
  }/ncmget?id=${encodedId}&br=${encodedBr}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`请求失败，状态码：${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API 请求错误:", error);
    throw new Error("下载服务暂时不可用");
  }
};

/**
 * 获取客户端歌曲下载
 * @param {number} id - 要下载的音乐ID
 * @param {number} br - 码率, 默认设置了 999000 即最大码率, 如果要 320k 则可设置为 320000, 其他类推
 */
export const getSongDownload = (id, br = 999000) => {
  return axios({
    method: "GET",
    url: "/song/download/url",
    params: {
      id,
      br,
      timestamp: new Date().getTime(),
    },
  });
};

/**
 * 听歌打卡
 * @param {number} id - 音乐ID
 * @param {number} sourceid - 来源ID
 */
export const songScrobble = (id, sourceid = 0, time = 0) => {
  return axios({
    method: "GET",
    url: "/scrobble",
    params: {
      id,
      sourceid,
      time,
      timestamp: new Date().getTime(),
    },
  });
};

/**
 * 获取包含指定音乐的相似歌单
 * @param {number} id - 要查询的音乐ID
 */
export const getSimiPlayList = (id) => {
  return axios({
    method: "GET",
    url: "/simi/playlist",
    params: {
      id,
    },
  });
};

/**
 * 获取与指定音乐相似的音乐列表
 * @param {number} id - 要查询的音乐ID
 */
export const getSimiSong = (id) => {
  return axios({
    method: "GET",
    url: "/simi/song",
    params: {
      id,
    },
  });
};

import axios from "@/utils/request";
import { siteSettings } from "@/stores";


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
 * 网易云解灰(新)
 * @param {number} id - 要替换播放链接的音乐ID
 * @param {string} source - 音乐源，默认为 "pyncmd
 * @returns {Promise} - 返回一个 Promise 对象，解析为音乐 URL
 */
export const getMusicNumUrlNew = async (id, source = "pyncmd") => {
  return axios({
    method: "GET",
    url: "/song/url/match",
    params: {
      id,
      source,
    },
  })
}

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
export const getSongDownloadFromPyncmd = async (params) => {
  // 参数处理
  const { id, br } = params;
  const encodedId = encodeURIComponent(id);
  const encodedBr = encodeURIComponent(br);
  try {
    return axios({
      url: "/song/url/ncmget",
      method: "GET",
      params: {
        id: encodedId,
        br: encodedBr,
      },
    });
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

/**
 * 获取TTML格式歌词(AMLL歌词专属)
 * @param {number} id - 要获取歌词的音乐ID
 */
export const getSongTTML = async (id) => {
    const url = `https://amll-ttml-db.stevexmh.net/ncm/${id}`;
    try {
        const response = await fetch(url);
        if (response === null || response.status !== 200) {
            console.error(`TTML API请求失败或TTML仓库没有歌词: ${error.message}, 将会使用默认歌词`);
            return null;
        }
        const data = await response.text();
      return data;
  } catch (error) {}
}

/**
 * 获取Meting音乐源歌曲下载
 * @param {number} id - 要下载的音乐ID
 * @param {string} source - 音乐源，默认为 "pyncmd"，可选值包括"meting1", "meting2"
 * @returns {string} - 返回下载链接
 */
export const getMetingSongDownload = async (id, source) => {
  const metingApi = {
    "meting1": "https://music.cenguigui.cn/?type=url&id=",
    "meting2": "https://api.qijieya.cn/meting/?type=url&id=",
    "meting3": "https://api.injahow.cn/meting/?type=url&id=",
    "meting4": "https://api.moeyao.cn/meting/?type=url&id="
  };
  const url = metingApi[source] + id;
  return url;
}

export const getPythonSongDownload = async (id, source, quality) => {
  const pythonApi = {
    "python1": `https://music.loveu.im/Song_V1?id=${id}&level=${quality}&type=json`
  };
  const res = await fetch(pythonApi[source], {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  });
  const data = await res.json();
  console.info("Python API response:", data);
  return { data: { url: data.data.url } };
}
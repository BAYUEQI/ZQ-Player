import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";
import localizedFormat from "dayjs/plugin/localizedFormat";

dayjs.extend(duration);
dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);




/**
 * 歌曲时长时间戳转换
 * @param {number} mss 毫秒数
 * @returns {string} 格式为 "mm:ss" 的字符串
 */
export const getSongTime = (mss: number) => {
  const minutes: number = Math.floor(mss / (1000 * 60));
  let seconds: any = Math.floor((mss % (1000 * 60)) / 1000);
  if (seconds < 10) {
    seconds = `0${seconds}`;
  }
  return `${minutes}:${seconds}`;
};


// 毫秒转为秒
export const msToS = (milliseconds: number, decimalPlaces: number = 2): number => {
  return Number((milliseconds / 1000).toFixed(decimalPlaces));
};


/**
 * 获取当前时间段的问候语
 */
export const getGreetings = () => {
  const hour = dayjs().hour();
  if (hour < 6) {
    return "凌晨好";
  } else if (hour < 9) {
    return "早上好";
  } else if (hour < 12) {
    return "上午好";
  } else if (hour < 14) {
    return "中午好";
  } else if (hour < 17) {
    return "下午好";
  } else if (hour < 19) {
    return "傍晚好";
  } else if (hour < 22) {
    return "晚上好";
  } else {
    return "夜深了";
  }
};

/**
 * 获取时间戳对应的日期
 * @param {number} mss - 时间戳
 * @returns {string} - 日期字符串
 */
export const getTimestampTime = (mss: any, showYear = true) => {
  const date = new Date(parseInt(mss));
  const y: number = date.getFullYear();
  const m: any = `0${date.getMonth() + 1}`.slice(-2);
  const d: any = `0${date.getDate()}`.slice(-2);
  return showYear ? `${y}-${m}-${d}` : `${m}-${d}`;
};

/**
 * 歌曲播放时间转换
 * @param {number} num 歌曲播放时间，单位为秒
 * @returns {string} 格式为 "mm:ss" 的字符串
 */
export const getSongPlayTime = (num) => {
  const minutes = String(Math.floor(num / 60)).padStart(2, "0");
  const seconds = String(Math.floor(num % 60)).padStart(2, "0");
  return `${minutes}:${seconds}`;
};

/**
 * 将评论时间戳转化为对应的时间格式
 * @param {number} t - 时间戳，单位为毫秒
 * @returns {string} - 转换后的时间字符串
 */
export const getCommentTime = (t) => {
  // 获取当前 Unix 时间戳
  const nowDate: any = new Date();
  // 获取今天 23:59:59.999 时间戳
  const todayLast = new Date(
    nowDate.getFullYear(),
    nowDate.getMonth(),
    nowDate.getDate(),
    23,
    59,
    59,
    999,
  ).getTime();
  // 将传入的时间戳转换为 Date 对象
  const userDate = new Date(Number(t));
  // 获取评论时间的小时和分钟数，并进行补零处理
  const UH = userDate.getHours() < 10 ? `0${userDate.getHours()}` : userDate.getHours();
  const Um = userDate.getMinutes() < 10 ? `0${userDate.getMinutes()}` : userDate.getMinutes();
  // 判断时间差
  if (nowDate - t <= 60000) {
    return "刚刚发布";
  } else if (nowDate - t > 60000 && nowDate - t <= 3600000) {
    const pastTimeUnix = nowDate - t;
    const pastTime = new Date(Number(pastTimeUnix));
    return `${pastTime.getMinutes()} 分钟前`;
  } else if (todayLast - t > 3600000 && todayLast - t <= 86400000) {
    return `${UH}:${Um}`;
  } else if (nowDate.getFullYear() === userDate.getFullYear()) {
    // 如果在今年，不显示年份
    return `${userDate.getMonth() + 1}月${userDate.getDate()}日 ${UH}:${Um}`;
  } else if (todayLast - t <= 172800000) {
    return `昨天 ${UH}:${Um}`;
  } else {
    return `${userDate.getFullYear()}年${
      userDate.getMonth() + 1
    }月${userDate.getDate()}日 ${UH}:${Um}`;
  }
};

/**
 * 电台时间戳格式化
 * @param {number} timestamp - 要格式化的时间戳（毫秒）
 * @returns {string} - 格式化后的日期描述
 */
export const djFormatDate = (timestamp) => {
  const now: any = new Date();
  const targetDate: any = new Date(timestamp);
  const timeDiff = now - targetDate;
  const oneDay = 24 * 60 * 60 * 1000; // 一天的毫秒数
  const daysDiff = Math.floor(timeDiff / oneDay);
  // 数字补零
  const formatNumber = (num) => {
    return num < 10 ? `0${num}` : num;
  };
  if (daysDiff === 0) {
    return "今日";
  } else if (daysDiff === 1) {
    return "昨日";
  } else if (daysDiff <= 7) {
    return `${daysDiff}天前`;
  } else if (targetDate.getFullYear() === now.getFullYear() - 1) {
    return `${targetDate.getFullYear()}-${formatNumber(targetDate.getMonth() + 1)}`;
  } else {
    return `${formatNumber(targetDate.getMonth() + 1)}-${formatNumber(targetDate.getDate())}`;
  }
};

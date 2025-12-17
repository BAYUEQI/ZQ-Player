import { checkPlatform } from "@/utils/helper";
import { playOrPause, changePlayIndex } from "@/utils/Player";
import { siteStatus } from "@/stores";

/**
 * 全局事件
 * @param {import('vue-router').Router} router - router
 */
const globalEvents = (router) => {
  if (!checkPlatform.electron()) return false;
  const ipcRenderer = window.electron?.ipcRenderer;
  if (!ipcRenderer) return false;
  // 显示播放器
  ipcRenderer.on("showPlayer", () => {
    const status = siteStatus();
    status.showFullPlayer = true;
  });
  // 播放或暂停
  ipcRenderer.on("playOrPause", () => {
    playOrPause();
  });
  // 上一曲或下一曲
  ipcRenderer.on("playNextOrPrev", (_, val) => {
    changePlayIndex(val, true);
  });
  // 全局设置
  ipcRenderer.on("open-setting", () => {
    if (router) router.push("/setting");
    const status = siteStatus();
    status.showFullPlayer = false;
  });

  // 处理主进程发送的应用内消息弹框
  ipcRenderer.on("show-message-box", (_, { type, message }) => {
    if (typeof window.$message !== "undefined") {
      if (type === "success") {
        window.$message.success(message, { duration: 3000 });
      } else if (type === "warning") {
        window.$message.warning(message, { duration: 6000 });
      }
    }
  });
};

export default globalEvents;

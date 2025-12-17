import { dialog } from "electron";
import { is } from "@electron-toolkit/utils";
// import pkg from "electron-updater";

// const { autoUpdater } = pkg;

// 更新弹窗
const hasNewVersion = (info) => {
  dialog
    .showMessageBox({
      title: "发现新版本 v" + info.version,
      message: "发现新版本 v" + info.version,
      detail: "是否立即下载并安装新版本？",
      buttons: ["立即下载", "取消"],
      type: "question",
      noLink: true,
    })
    .then((result) => {
      if (result.response === 0) {
        // 触发手动下载
        autoUpdater.downloadUpdate();
      }
    });
};

export const configureAutoUpdater = () => {
  if (is.dev) return false;



  // 自动更新已禁用
  // autoUpdater.on("download-progress", (progressObj) => { /* ... */ });
  // autoUpdater.on("update-downloaded", () => { /* ... */ autoUpdater.quitAndInstall(); });
  // autoUpdater.on("error", (err) => { /* ... */ });
  // autoUpdater.on("update-available", (info) => { hasNewVersion(info); });
  // autoUpdater.checkForUpdatesAndNotify();
  // autoUpdater.downloadUpdate();
  // 下载失败
  autoUpdater.on("error", (err) => {
    console.error("下载更新失败:", err);
    dialog.showErrorBox("下载更新失败", "请检查网络连接并稍后重试！");
  });

  // 若有更新
  autoUpdater.on("update-available", (info) => {
    hasNewVersion(info);
  });

  // 检查更新
  autoUpdater.checkForUpdatesAndNotify();
};

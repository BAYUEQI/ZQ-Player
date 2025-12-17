import { globalShortcut, app } from "electron";

/**
 * 注册全局快捷键
 * @param {BrowserWindow} win - 程序窗口
 */
const createGlobalShortcut = (win) => {
  // 刷新程序
  globalShortcut.register("CmdOrCtrl+Shift+R", () => {
    if (win && win.isFocused()) win?.reload();
  });

  // 打开开发者工具
  globalShortcut.register("CmdOrCtrl+Shift+I", () => {
    if (win && win.isFocused()) {
      win?.webContents.openDevTools({
        mode: "right",
        activate: true,
      });
    }
  });

  // 退出程序（macOS 默认 Cmd+Q）
  // 确保触发真正退出而不是仅隐藏窗口
  globalShortcut.register("Cmd+Q", () => {
    try {
      app.isQuiting = true;
      app.quit();
    } catch (_) {}
  });
};

export default createGlobalShortcut;
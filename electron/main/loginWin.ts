import { BrowserWindow, MenuItemConstructorOptions, Menu, session, dialog } from "electron";

const openLoginWin = (mainWin: BrowserWindow) => {
  const loginSession = session.fromPartition("login-win");
  const loginWin = new BrowserWindow({
    parent: mainWin,
    width: 1280,
    height: 800,
    center: true,
    modal: true,
    // resizable: false,
    // movable: false,
    // minimizable: false,
    // maximizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      partition: "login-win",
    },
  });

  // 打开网易云
  loginWin.loadURL("https://music.163.com/#/login");

  // 阻止新窗口创建
  loginWin.webContents.setWindowOpenHandler(() => {
    return { action: "deny" };
  });

  // 菜单栏
  const menuTemplate: MenuItemConstructorOptions[] = [
    {
      label: "登录完成",
      click: async () => {
        if (!loginWin) return;
        // 获取 Cookie
        const cookies = await loginWin.webContents.session.cookies.get({ name: "MUSIC_U" });
        if (!cookies?.[0]?.value) {
          dialog.showMessageBox({
            type: "info",
            title: "登录失败",
            message: "未查找到登录信息，请重试",
          });
          return;
        }
        const value = `MUSIC_U=${cookies[0].value};`;
        // 发送回主进程
        mainWin?.webContents.send("send-cookies", value);
        await loginSession?.clearStorageData();
        loginWin.close();
      },
    },
  ];
  const menu = Menu.buildFromTemplate(menuTemplate);
  loginWin.setMenu(menu);
};

export default openLoginWin;
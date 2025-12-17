import { Tray, Menu, app, ipcMain, nativeImage, nativeTheme } from "electron";
import { join } from "path";

// 当前歌曲数据
let playSongName = "当前暂无播放歌曲";
let playSongState = false;

// 全局托盘
let globalMainTray = null;
// 用于存储当前快捷键列表，是构建托盘菜单的数据来源
let currentShortcutList = {};

/**
 * 创建系统托盘
 * @param {BrowserWindow} win - 程序窗口
 * @param {Store} store - 存储对象
 */
const createSystemTray = (win, store) => {
  // 初始化快捷键列表，从持久化存储中获取
  currentShortcutList = store?.get?.("shortcutList") || {};
  // 系统托盘
  const mainTray = new Tray(
    nativeImage
      .createFromPath(
        join(
          __dirname,
          process.platform === "win32"
            ? "../../public/imgs/icons/favicon.ico"
            : "../../public/imgs/icons/favicon-32x32.png",
        ),
      )
      .resize({
        height: 32,
        width: 32,
      }),
  );
  globalMainTray = mainTray;

  // 应用内菜单
  Menu.setApplicationMenu(createTrayMenu(win, store));
  // 默认名称
  win.setTitle(app.getName());
  mainTray.setTitle(app.getName());
  mainTray.setToolTip(app.getName());
  // 左键事件
  mainTray.on("click", () => win.show());
  // 托盘菜单
  // 初始化托盘菜单，使用当前快捷键列表生成菜单项
  mainTray.setContextMenu(createTrayMenu(win, store));
  // 系统主题改变
  // 监听系统主题变化，重新设置托盘菜单以适应主题，此机制也用于快捷键的实时更新
  nativeTheme.on("updated", () => {
    mainTray.setContextMenu(createTrayMenu(win, store));
  });
  // 播放歌曲改变
  // 监听歌曲名称变化，更新托盘菜单显示
  ipcMain.on("songNameChange", (_, val) => {
    playSongName = val;
    win.setTitle(val);
    mainTray.setTitle(val);
    mainTray.setToolTip(val);
    mainTray.setContextMenu(createTrayMenu(win, store));
  });
  // 播放状态改变
  // 监听播放状态变化，更新托盘菜单显示
  ipcMain.on("songStateChange", (_, val) => {
    playSongState = val;
    mainTray.setContextMenu(createTrayMenu(win, store));
  });


};

// 生成图标
const createIcon = (name) => {
  // 系统是否为暗色
  const isDarkMode = nativeTheme.shouldUseDarkColors;
  // 返回图标
  return nativeImage
    .createFromPath(
      isDarkMode
        ? join(__dirname, `../../public/imgs/icons/${name}-dark.png`)
        : join(__dirname, `../../public/imgs/icons/${name}-light.png`),
    )
    .resize({ width: 16, height: 16 });
};

// 规范化快捷键字符串，使其符合 Electron 的 accelerator 格式
const normalizeAccelerator = (shortcut) => {
  if (!shortcut) return '';

  // 将快捷键字符串拆分为单个键
  const keys = shortcut.split('+').map(key => key.trim());
  const normalizedKeys = [];

  for (const key of keys) {
    switch (key.toLowerCase()) {
      case 'cmd':
      case 'command':
      case 'control':
      case 'ctrl':
        normalizedKeys.push('CmdOrCtrl');
        break;
      case 'shift':
        normalizedKeys.push('Shift');
        break;
      case 'alt':
      case 'option':
        normalizedKeys.push('Alt');
        break;
      case 'arrowleft':
        normalizedKeys.push('Left');
        break;
      case 'arrowright':
        normalizedKeys.push('Right');
        break;
      case 'arrowup':
        normalizedKeys.push('Up');
        break;
      case 'arrowdown':
        normalizedKeys.push('Down');
        break;
      case 'space':
        normalizedKeys.push('Space');
        break;
      case 'return':
        normalizedKeys.push('Return');
        break;
      default:
        const keyLetter = key.match(/^Key([A-Z])$/i);
        if (keyLetter) {
          normalizedKeys.push(keyLetter[1].toUpperCase());
        } else {
          const digit = key.match(/^(Digit|Numpad)([0-9])$/i);
          if (digit) {
            normalizedKeys.push(digit[2]); // Extract the number
          } else {
            normalizedKeys.push(key); // Keep other keys as is
          }
        }
        break;
    }
  }

  // 确保修饰键在前，并去除重复项
  const uniqueKeys = [...new Set(normalizedKeys)];
  const modifiers = ['CmdOrCtrl', 'Shift', 'Alt'];
  const sortedKeys = uniqueKeys.filter(key => modifiers.includes(key)).sort((a, b) => modifiers.indexOf(a) - modifiers.indexOf(b));
  const otherKeys = uniqueKeys.filter(key => !modifiers.includes(key));

  return [...sortedKeys, ...otherKeys].join('+');
};

// 生成右键菜单
const createTrayMenu = (win, store) => {
  // 获取快捷键配置
  const shortcutList = currentShortcutList;
  // 返回菜单
  const playPrevAccelerator = shortcutList.playPrev?.shortcut || 'CmdOrCtrl+Left';
  const playOrPauseAccelerator = shortcutList.playOrPause?.shortcut || "CmdOrCtrl+Space";
  const playNextAccelerator = shortcutList.playNext?.shortcut || 'CmdOrCtrl+Right';

  // console.log("createTrayMenu - final playPrev accelerator:", playPrevAccelerator);
  // console.log("createTrayMenu - final playOrPause accelerator:", playOrPauseAccelerator);
  // console.log("createTrayMenu - final playNext accelerator:", playNextAccelerator);

  return Menu.buildFromTemplate([
    {
      label: playSongName,
      icon: createIcon("open"),
      click() {
        win.show();
        win.focus();
        win.webContents.send("showPlayer");
      },
    },
    {
      type: "separator",
    },
    {
      label: "上一曲",
      icon: createIcon("prev"),
      // 确保快捷键格式符合 Electron 规范，实现实时更新
      accelerator: normalizeAccelerator(playPrevAccelerator),
      click: () => {
        win.webContents.send("playNextOrPrev", "prev");
      },
    },
    {
      label: playSongState ? "暂停" : "播放",
      icon: createIcon(playSongState ? "pause" : "play"),
      // 确保快捷键格式符合 Electron 规范，实现实时更新
      accelerator: normalizeAccelerator(playOrPauseAccelerator),
      click: () => {
        win.webContents.send("playOrPause");
      },
    },
    {
      label: "下一曲",
      icon: createIcon("next"),
      // 确保快捷键格式符合 Electron 规范，实现实时更新
      accelerator: normalizeAccelerator(playNextAccelerator),
      click: () => {
        win.webContents.send("playNextOrPrev", "next");
      },
    },
    {
      type: "separator",
    },
    {
      label: "全局设置",
      icon: createIcon("setting"),
      click: () => {
        win.show();
        win.focus();
        win.webContents.send("open-setting");
      },
    },
    {
      type: "separator",
    },
    {
      label: "退出",
      icon: createIcon("power"),
      click: () => {
        win.close();
        app.isQuiting = true;
        app.quit();
      },
    },
  ]);
};

export const updateTrayMenu = (win, store, newShortcutList) => { // 新增: 实时更新托盘菜单，以响应快捷键列表的变化
  currentShortcutList = newShortcutList;
  if (globalMainTray) {
    // 重建系统托盘菜单，实现实时更新
    globalMainTray.setContextMenu(createTrayMenu(win, store));
  }
};

export default createSystemTray;

// src/stores/shortcut.js - 快捷键配置存储，使用 Pinia 管理状态，支持持久化
import { defineStore } from "pinia";
import { cloneDeep } from "lodash-es"; // 用于深拷贝对象
import { checkPlatform, formatForGlobalShortcut } from "@/utils/helper";

// 创建 Pinia store
export const useShortcutStore = defineStore("shortcut", {
  state: () => ({
    globalOpen: false, // 默认关闭全局快捷键
    // 正在编辑全局快捷键：用于在设置页输入时临时禁用渲染层本地快捷键监听
    editingGlobal: false,
    shortcutList: {
      playOrPause: {
        name: "播放/暂停",
        shortcut: "Space",
        globalShortcut: "",
      },
      toggleFullPlayer: {
        name: "打开/收起全屏播放器",
        shortcut: "KeyF",
        globalShortcut: "",
      },
      hideWindow: {
        name: "隐藏/显示窗口",
        // 仅作为全局快捷键使用，本地快捷键默认留空
        shortcut: "",
        globalShortcut: "",
      },
      playPrev: {
        name: "上一曲",
        shortcut: "CmdOrCtrl+ArrowLeft",
        // 避免与系统快捷键冲突（macOS 上 Cmd+Shift+Left 可能被系统占用）
        globalShortcut: "",
      },
      playNext: {
        name: "下一曲",
        shortcut: "CmdOrCtrl+ArrowRight",
        // 避免与系统快捷键冲突
        globalShortcut: "",
      },
      volumeUp: {
        name: "音量加",
        shortcut: "CmdOrCtrl+ArrowUp",
        // 避免与系统快捷键冲突
        globalShortcut: "",
      },
      volumeDown: {
        name: "音量减",
        shortcut: "CmdOrCtrl+ArrowDown",
        // 避免与系统快捷键冲突
        globalShortcut: "",
      },
    },
  }),
  actions: {
    setEditingGlobal(val) {
      this.editingGlobal = !!val;
    },
    // 此 action 负责更新 Pinia Store 中的 shortcutList，并触发主进程更新状态栏菜单
    updateShortcutList(newShortcutList) {
      this.shortcutList = newShortcutList;
      if (window.electron?.ipcRenderer) {
        const normalizedList = cloneDeep(newShortcutList);
        Object.values(normalizedList).forEach((item) => {
          item.globalShortcut = formatForGlobalShortcut(item.globalShortcut || "");
        });
        // 向主进程发送 IPC 消息，携带格式化后的最新快捷键列表，触发状态栏菜单实时更新
        window.electron.ipcRenderer.send("set-shortcut-list", normalizedList);
      }
    },
    // 注册所有全局快捷键，通过 IPC 调用主进程
    async registerAllShortcuts(options = {}) {
      const { notifySuccess = false, notifyFailure = false, message } = options;
      // 全局开关关闭时不进行注册
      if (!this.globalOpen) return [];
      if (!checkPlatform.electron()) return [];
      try {
        // 在注册前统一格式化为 Electron Accelerator，兼容历史持久化数据
        const normalizedList = cloneDeep(this.shortcutList);
        Object.values(normalizedList).forEach((item) => {
          item.globalShortcut = formatForGlobalShortcut(item.globalShortcut || "");
        });
        const result = await window.electron.ipcRenderer.invoke(
          "register-all-shortcut",
          normalizedList
        );
        // 结果提示（在渲染进程可见），帮助定位是否因系统占用导致注册失败
        const entries = Object.entries(normalizedList);
        const failedSet = new Set(result || []);
        const successTexts = entries
          .filter(([key]) => !failedSet.has(key))
          .map(([key, item]) => `${item.name}(${item.globalShortcut})`);
        const failedTexts = entries
          .filter(([key]) => failedSet.has(key))
          .map(([key, item]) => `${item.name}(${item.globalShortcut})`);

        if (successTexts.length && notifySuccess) {
          console.info("已注册全局快捷键:", successTexts.join(", "));
          if (message) {
            message.success(`已注册全局快捷键: ${successTexts.join(", ")}`, { duration: 3000 });
          }
        }
        if (failedTexts.length && notifyFailure) {
          console.warn("注册快捷键失败:", failedTexts.join(", "));
          if (message) {
            message.error(
              `以下快捷键注册失败: ${failedTexts.join(", ")}. 请在“设置-键盘”中修改为不与系统冲突的组合（推荐使用 CmdOrCtrl+Alt+字母 或 CmdOrCtrl+Alt+Up/Down）`,
              { duration: 6000 }
            );
          }
        }
        return result;
      } catch (error) {
        console.warn("注册全局快捷键失败:", error);
        return [];
      }
    },
  },
  persist: {
    key: "shortcut-store", // 持久化键名，用于本地存储
    // 仅持久化与业务相关的配置，避免临时编辑态被持久化
    paths: ["globalOpen", "shortcutList"],
  },
});
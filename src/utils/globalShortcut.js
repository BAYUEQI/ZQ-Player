// src/utils/globalShortcut.js - 本地快捷键监听（渲染进程）
import { playOrPause, setVolume, changePlayIndex } from "@/utils/Player";
import { siteStatus } from "@/stores";
import { useShortcutStore } from "@/stores/shortcut";
import { storeToRefs } from "pinia"; // 从 pinia 导入 storeToRefs

/**
 * 全局快捷键监听
 * @param e - 键盘事件对象
 * @param router - Vue Router 实例
 * @returns - 如果事件对象不存在，则返回false
 */
const globalShortcut = (e, router) => {
  if (!e) return false;

  // 获取快捷键存储
  const shortcutStore = useShortcutStore();
  const { shortcutList } = storeToRefs(shortcutStore);
  const status = siteStatus(); // 移到 switch 外部，只声明一次

   // 设置页正在编辑全局快捷键时，禁用本地快捷键，避免拦截输入
   if (shortcutStore.editingGlobal) return false;

   // 输入环境下（表单/可编辑区域）不触发本地快捷键，避免影响输入
   const tagName = (e.target && e.target.tagName ? e.target.tagName : "").toLowerCase();
   const isEditable = tagName === "input" || tagName === "textarea" || !!(e.target && e.target.isContentEditable);
   if (isEditable) return false;

  // 遍历存储中的快捷键配置（使用本地字段 shortcut）
  for (const shortcutKey in shortcutList.value) {
    const cfg = shortcutList.value[shortcutKey];
    const accelerator = cfg?.shortcut || "";
    if (!accelerator) continue;

    const parts = accelerator.split("+").map((p) => p.trim()).filter(Boolean);
    let match = true;

    // 修饰键判定
    const requireCmdOrCtrl = parts.includes("CmdOrCtrl");
    const requireCtrl = parts.includes("Ctrl");
    const requireMeta = parts.includes("Meta");
    const requireShift = parts.includes("Shift");
    const requireAlt = parts.includes("Alt");

    const isCtrl = !!e.ctrlKey;
    const isMeta = !!e.metaKey;
    const isShift = !!e.shiftKey;
    const isAlt = !!e.altKey;

    // 修饰键严格匹配：不允许额外修饰键参与
    if (requireCmdOrCtrl) {
      if (!(isCtrl || isMeta)) match = false; // 至少需要一个
      if (isCtrl && isMeta) match = false;   // 不能同时按下
    } else if (requireCtrl) {
      if (!isCtrl || isMeta) match = false;  // 需要 Ctrl，且不能有 Meta
    } else if (requireMeta) {
      if (!isMeta || isCtrl) match = false;  // 需要 Meta，且不能有 Ctrl
    } else {
      // 不需要 Ctrl/Meta：两者都必须未按下
      if (isCtrl || isMeta) match = false;
    }
    // Shift/Alt 必须与需求一致
    if (isShift !== requireShift) match = false;
    if (isAlt !== requireAlt) match = false;

    // 主键（非修饰键）比较，使用 event.code 与设置页保持一致
    const modifiers = ["CmdOrCtrl", "Ctrl", "Meta", "Shift", "Alt"];
    const mainKey = parts.find((key) => !modifiers.includes(key)) || "";

    // 允许少量规范化（容错旧数据）
    const normalizeCode = (code) => {
      switch (code) {
        case "Left": return "ArrowLeft"; // 兼容旧加速器样式
        case "Right": return "ArrowRight";
        case "Up": return "ArrowUp";
        case "Down": return "ArrowDown";
        default: return code || "";
      }
    };
    const expectedCode = normalizeCode(mainKey);
    const actualCode = normalizeCode(e.code);

    if (expectedCode && expectedCode.toLowerCase() !== actualCode.toLowerCase()) match = false;

    if (match && shortcutKey) {
      // 调试：打印命中的快捷键名称
      console.log(shortcutKey, `本地快捷键触发: ${cfg?.name || shortcutKey}`);
      switch (shortcutKey) {
        case "playOrPause":
          e.preventDefault();
          e.stopPropagation();
          if (router.currentRoute.value.name === "videos-player") return false;
          playOrPause();
          break;
        case "toggleFullPlayer":
          e.preventDefault();
          e.stopPropagation();
          // 切换全屏播放器显隐
          status.showFullPlayer = !status.showFullPlayer;
          break;
        case "playPrev":
          e.preventDefault();
          e.stopPropagation();
          // 使用统一的换曲逻辑，确保相关状态与播放器同步
          changePlayIndex("prev", true);
          break;
        case "playNext":
          e.preventDefault();
          e.stopPropagation();
          // 使用统一的换曲逻辑，确保相关状态与播放器同步
          changePlayIndex("next", true);
          break;
        case "volumeUp":
          e.preventDefault();
          e.stopPropagation();
          const volumeUp = Math.min(1, status.playVolume + 0.1);
          setVolume(volumeUp);
          status.playVolume = volumeUp;
          break;
        case "volumeDown":
          e.preventDefault();
          e.stopPropagation();
          const volumeDown = Math.max(0, status.playVolume - 0.1);
          setVolume(volumeDown);
          status.playVolume = volumeDown;
          break;
      }
    }
  }
};

export default globalShortcut;
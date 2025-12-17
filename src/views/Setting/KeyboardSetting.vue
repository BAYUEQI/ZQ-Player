<!-- src/views/Setting/KeyboardSetting.vue - 快捷键设置界面 -->
<template>
  <div class="keyboard-setting set-type">
    <n-h3 prefix="bar"> 快捷键 </n-h3>
    <n-collapse>
      <n-collapse-item name="shortcut" arrow-placement="right">
        <template #header>
          <div class="collapse-title">
            快捷键设置
          </div>
        </template>
        <!-- 全局快捷键开关卡片：恢复默认结构以继承统一布局（左右分布） -->
        <n-card class="set-item">
          <div class="name">
            全局快捷键
            <n-text class="tip">开启后可在客户端全局响应快捷键（仅 Electron）</n-text>
          </div>
          <n-switch
            v-model:value="shortcutStore.globalOpen"
            :round="false"
            :disabled="!isElectron"
          />
        </n-card>

        <!-- 快捷键列表卡片：统一卡片样式并优化布局以避免溢出 -->
    <n-card id="shortcut-list" class="set-item" :content-style="{
            flexDirection: 'column',
            alignItems: 'stretch'
          }">
          <div
            v-for="(item, key, index) in shortcutListRef"
            :key="index"
            class="shortcut-row"
          >
            <div class="name">{{ item.name }}</div>
            <div class="set-group">
              <!-- 本地快捷键输入 -->
              <n-input
                :value="item.shortcut"
                placeholder="请输入快捷键"
                :disabled="key === 'hideWindow'"
                @click="selectShortcutFn('shortcut', key)"
                @focus="selectShortcutFn('shortcut', key)"
                @keydown.stop="inputKeyDown"
                @blur="inputBlur"
                @keyup="keyHandled = ''"
                class="set"
              />
              <!-- 全局快捷键输入 -->
              <n-input
                :value="item.globalShortcut"
                :disabled="!shortcutStore.globalOpen || !isElectron || key === 'toggleFullPlayer'"
                :status="item?.isRegistered ? 'error' : 'success'"
                placeholder="请输入全局快捷键"
                @click="selectShortcutFn('globalShortcut', key)"
                @focus="selectShortcutFn('globalShortcut', key)"
                @keydown.stop="inputKeyDown"
                @blur="inputBlur"
                @keyup="keyHandled = ''"
                class="set"
              />
            </div>
          </div>
          <!-- 恢复默认按钮 -->
          <n-button type="primary" strong secondary @click="resetShortcut">恢复默认</n-button>
        </n-card>
      </n-collapse-item>
    </n-collapse>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { useShortcutStore } from "@/stores/shortcut";
import { storeToRefs } from "pinia"; // 从 pinia 导入 storeToRefs
import { cloneDeep, includes, some } from "lodash-es"; // lodash 工具函数
import { formatForGlobalShortcut, checkPlatform } from "@/utils/helper"; // 快捷键格式化函数 & 平台检测
import { useMessage } from "naive-ui";
import { debounce } from "lodash-es";

const shortcutStore = useShortcutStore();
const { shortcutList } = storeToRefs(shortcutStore);
const message = useMessage();
const isElectron = checkPlatform.electron();

const selectShortcut = ref(null); // 当前选中的快捷键
const selectGlobal = ref(false); // 是否为全局快捷键
const keyHandled = ref(""); // 已处理的按键
const lastModifiedShortcutKey = ref(null); // 最后一次修改的本地快捷键的 key
const shortcutListRef = ref(cloneDeep(shortcutStore.shortcutList)); // 列表副本，用于界面显示

// 选择快捷键
const selectShortcutFn = (type, key) => {
  selectGlobal.value = type === "globalShortcut";
  selectShortcut.value = key;
  if (isElectron && selectGlobal.value) {
    // 仅在编辑全局快捷键时暂时取消用户快捷键，防止冲突
    window.electron.ipcRenderer.send("unregister-all-shortcut");
    // 同时暂停渲染层本地快捷键，避免输入被本地快捷键截获
    shortcutStore.setEditingGlobal(true);
  } else if (selectGlobal.value) {
    message.warning("全局快捷键仅在客户端(Electron)中可用");
  } else {
    // 非全局输入：确保编辑态关闭
    shortcutStore.setEditingGlobal(false);
  }
};

// 允许的按键 code 列表（与原版保持一致，确保采集稳定）
const allowedCodes = [
  // 字母 A-Z
  "KeyA","KeyB","KeyC","KeyD","KeyE","KeyF","KeyG","KeyH","KeyI","KeyJ","KeyK","KeyL","KeyM",
  "KeyN","KeyO","KeyP","KeyQ","KeyR","KeyS","KeyT","KeyU","KeyV","KeyW","KeyX","KeyY","KeyZ",
  // 数字 0-9 与数字键盘
  "Digit0","Digit1","Digit2","Digit3","Digit4","Digit5","Digit6","Digit7","Digit8","Digit9",
  "Numpad0","Numpad1","Numpad2","Numpad3","Numpad4","Numpad5","Numpad6","Numpad7","Numpad8","Numpad9",
  // 空格与方向键
  "Space","ArrowLeft","ArrowUp","ArrowRight","ArrowDown",
];

// 按键输入处理（使用 e.code，避免 e.key 在不同布局与空格键上的不一致）
const inputKeyDown = (e) => {
  e.preventDefault();
  e.stopPropagation();
  if (!selectShortcut.value) return;

  // 退格删除当前设置
  if (e.code === "Backspace") {
    changeShortcut("");
    return;
  }

  // 防抖：相同 code 不重复处理
  if (e.code === keyHandled.value) return;
  keyHandled.value = e.code;

  // 仅采集白名单中的按键，避免出现不可用的组合
  if (!allowedCodes.includes(e.code)) return;

  const isCtrl = e.ctrlKey || e.metaKey;
  const isShift = e.shiftKey;
  const isAlt = e.altKey;
  const parts = [isCtrl && "CmdOrCtrl", isShift && "Shift", isAlt && "Alt", e.code].filter(Boolean);
  const composed = parts.join("+");

  // 本地快捷键（使用 code 保持与原版一致，例如 CmdOrCtrl+KeyD）
  if (!selectGlobal.value) {
    if (isRepeat(composed)) {
      message.warning("快捷键已存在");
      changeShortcut("");
      return;
    }
    changeShortcut(composed);
    return;
  }

  // 全局快捷键（Electron Accelerator 需格式化，如 ArrowLeft->Left, KeyD->D）
  // 若用户仅输入单键，则自动补齐为 CmdOrCtrl+Shift+<Key>
  const hasModifier = isCtrl || isShift || isAlt;
  const rawGlobal = hasModifier ? composed : `CmdOrCtrl+Shift+${e.code}`;
  const formattedGlobal = formatForGlobalShortcut(rawGlobal);
  if (!formattedGlobal) return;
  if (isRepeat(formattedGlobal)) {
    message.warning("快捷键已存在");
    changeShortcut("");
    return;
  }
  changeShortcut(formattedGlobal);
  // 统一在失焦时注册，避免编辑过程中频繁触发 IPC 与重复注册
};

// 更新快捷键
const changeShortcut = async (shortcut) => {
  if (!selectShortcut.value) return;
  const field = selectGlobal.value ? "globalShortcut" : "shortcut";
  shortcutListRef.value[selectShortcut.value][field] = shortcut;
  shortcutStore.shortcutList[selectShortcut.value][field] = shortcut;
  if (!selectGlobal.value) {
    // 记录最后一次修改的本地快捷键，用于失焦时提供更详细的更新通知
    lastModifiedShortcutKey.value = selectShortcut.value;
  }
  // 调用 Pinia Store 的 action 更新快捷键列表，这将触发 IPC 通信，进而更新主进程的状态栏菜单
  shortcutStore.updateShortcutList(shortcutStore.shortcutList);
};

// 输入框失焦：结束编辑并恢复全局注册
const inputBlur = () => {
  // 若正在编辑全局快捷键且开关开启，则统一注册一次，确保之前临时注销被恢复
  if (selectGlobal.value && shortcutStore.globalOpen && isElectron) {
    shortcutStore.registerAllShortcuts({ notifySuccess: true, notifyFailure: true, message });
  } else if (!selectGlobal.value && lastModifiedShortcutKey.value) {
      // 本地快捷键失焦时，根据记录的 lastModifiedShortcutKey 提供详细的更新通知，增强用户体验
      const currentShortcut = shortcutStore.shortcutList[lastModifiedShortcutKey.value];
      if (currentShortcut && currentShortcut.shortcut) {
        message.success(`已更新本地快捷键: ${currentShortcut.name}(${currentShortcut.shortcut})`, { duration: 3000 });
      } else {
        message.success("本地快捷键已更新");
      }
      // 重置 lastModifiedShortcutKey，为下一次本地快捷键修改做准备
      lastModifiedShortcutKey.value = null;
    }
  // 结束编辑：恢复渲染层本地快捷键
  shortcutStore.setEditingGlobal(false);
  // 复位本地状态，避免“窗口不再出现/不再生效”的卡住体验
  selectShortcut.value = null;
  selectGlobal.value = false;
  keyHandled.value = "";
};

// 检查快捷键是否重复（对比时全局字段使用格式化后的值，避免同形不同义）
const isRepeat = (shortcut) => {
  return some(Object.values(shortcutStore.shortcutList), (item) => {
    const local = item.shortcut;
    const global = formatForGlobalShortcut(item.globalShortcut || "");
    return includes([local, global], shortcut);
  });
};

// 移除“系统占用”预检：Electron 无法检测系统占用，仅能在注册失败时获知
// 统一改为在失焦或值更新后进行注册，并依赖注册结果提示

// 恢复默认快捷键
const resetShortcut = () => {
  shortcutStore.$reset();
  shortcutStore.updateShortcutList(shortcutStore.shortcutList);
  shortcutListRef.value = cloneDeep(shortcutStore.shortcutList);
  message.success("快捷键已恢复默认");
  if (isElectron && shortcutStore.globalOpen) {
    shortcutStore.registerAllShortcuts({ notifySuccess: true, notifyFailure: true, message });
  } else if (isElectron) {
    window.electron.ipcRenderer.send("unregister-all-shortcut");
  }
};

// 监听全局快捷键开关
watch(
  () => shortcutStore.globalOpen,
  (val) => {
    if (!isElectron) return;
    if (val) shortcutStore.registerAllShortcuts({ message });
    else window.electron.ipcRenderer.send("unregister-all-shortcut");
  }
);
</script>

<style lang="scss" scoped>
.keyboard-setting {
  display: block;
}
.collapse-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px; // 与条目标题统一大小，缓解视觉紧凑
}
.shortcut-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0; // 行内上下留白
  margin-bottom: 16px; // 增大条目间距，减少紧凑感
}
// 条目标题字号与“快捷键设置”一致，避免显得过大
.shortcut-row .name {
  font-size: 14px;
  margin: 0; // 与原有形式对齐，移除额外间距
}

/* 已移除列表组件，改为自定义行，统一为透明背景 */

/* 卡片内内容纵向排列但保持整体大框视觉（保留父级统一的低灰大框样式） */
#shortcut-list :deep(.n-card__content) {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 24px; // 统一调整为 24px
}

/* 右侧输入组，两个输入保持 20px 间距 */
.set-group {
  display: flex;
  align-items: center;
  gap: 24px; // 右侧两个输入的间距改为 24px
}

/* 额外防护：禁用自定义行的 hover/focus 背景与描边 */
.shortcut-row:hover,
.shortcut-row:focus,
.shortcut-row:focus-within {
  background-color: transparent !important;
  outline: none !important;
}

@media (max-width: 768px) {
  .shortcut-row {
    flex-direction: column;
    align-items: stretch;
  }
}

/* 统一布局由父级设置页样式控制（左右分布），本组件不再覆写 */
</style>
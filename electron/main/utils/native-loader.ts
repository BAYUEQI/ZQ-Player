import { app } from "electron";
import path from "path";
import { createRequire } from "module";
import { processLog } from "../logger";

const requireNative = createRequire(import.meta.url);

/**
 * 加载一个原生插件
 * @param fileName 编译后的文件名 (例如: "smtc-for-splayer.node")
 * @param devDirName 开发环境下的目录名 (例如: "smtc-for-splayer")，必须位于项目根目录的 native/ 下
 */
export function loadNativeModule(fileName: string, devDirName: string) {
  let nativeModulePath: string;

  if (app.isPackaged) {
    nativeModulePath = path.join(process.resourcesPath, "native", fileName);
  } else {
    nativeModulePath = path.join(process.cwd(), "native", devDirName, fileName);
  }

  try {
    return requireNative(nativeModulePath);
  } catch (error) {
    processLog.error(`[NativeLoader] 加载 ${fileName} 失败:`, error);
    return null;
  }
}

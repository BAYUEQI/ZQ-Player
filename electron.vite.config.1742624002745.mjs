// electron.vite.config.mjs
import { resolve } from "path";
import { defineConfig, externalizeDepsPlugin, loadEnv } from "electron-vite";
import { NaiveUiResolver } from "unplugin-vue-components/resolvers";
import { VitePWA } from "vite-plugin-pwa";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import viteCompression from "vite-plugin-compression";

// electron/main/utils/checkPort.js
import net from "net";
var checkPort = (port, maxPort = 65535) => {
  return new Promise((resolve2, reject) => {
    if (port > maxPort) {
      reject(new Error(`${port} \u8D85\u51FA\u7AEF\u53E3\u8303\u56F4\uFF0C\u65E0\u6CD5\u627E\u5230\u53EF\u7528\u7AEF\u53E3`));
      return;
    }
    port = Number(port);
    const server = net.createServer();
    server.listen(port, "0.0.0.0", () => {
      server.once("close", () => {
        resolve2(port);
      });
      server.close();
    });
    server.on("error", (err) => {
      if (err.code === "EADDRINUSE" || err.code === "EACCES") {
        resolve2(checkPort(port + 1, maxPort));
      } else {
        reject(err);
      }
    });
  });
};
var checkPort_default = checkPort;

// electron.vite.config.mjs
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
var __electron_vite_injected_dirname = "D:\\VSProject\\Github\\SPlayer";
var electron_vite_config_default = defineConfig(async ({ mode }) => {
  const getEnv = (name) => {
    return loadEnv(mode, process.cwd())[name];
  };
  const devPort = await checkPort_default(getEnv("MAIN_VITE_DEV_PORT"));
  const serverPort = await checkPort_default(getEnv("MAIN_VITE_SERVER_PORT"));
  return {
    // 主进程
    main: {
      resolve: {
        alias: {
          "@main": resolve(__electron_vite_injected_dirname, "electron/main")
        }
      },
      plugins: [externalizeDepsPlugin()],
      build: {
        publicDir: resolve(__electron_vite_injected_dirname, "public"),
        rollupOptions: {
          input: {
            index: resolve(__electron_vite_injected_dirname, "electron/main/index.js")
          }
        }
      }
    },
    // 预渲染
    preload: {
      plugins: [externalizeDepsPlugin()],
      build: {
        rollupOptions: {
          input: {
            index: resolve(__electron_vite_injected_dirname, "electron/preload/index.mjs")
          }
        }
      }
    },
    // 渲染进程
    renderer: {
      resolve: {
        extensions: [".js", ".vue", ".json"],
        alias: {
          "@": resolve(__electron_vite_injected_dirname, "src")
        }
      },
      plugins: [
        wasm(),
        topLevelAwait(),
        vue(),
        AutoImport({
          imports: [
            "vue",
            {
              "naive-ui": ["useDialog", "useMessage", "useNotification", "useLoadingBar"]
            }
          ]
        }),
        Components({
          resolvers: [NaiveUiResolver()]
        }),
        // viteCompression
        viteCompression(),
        // PWA
        VitePWA({
          registerType: "autoUpdate",
          workbox: {
            clientsClaim: true,
            skipWaiting: true,
            cleanupOutdatedCaches: true,
            runtimeCaching: [
              {
                urlPattern: /(.*?)\.(woff2|woff|ttf)/,
                handler: "CacheFirst",
                options: {
                  cacheName: "file-cache"
                }
              },
              {
                urlPattern: /(.*?)\.(webp|png|jpe?g|svg|gif|bmp|psd|tiff|tga|eps)/,
                handler: "CacheFirst",
                options: {
                  cacheName: "image-cache"
                }
              }
            ]
          },
          manifest: {
            name: getEnv("RENDERER_VITE_SITE_TITLE"),
            short_name: getEnv("RENDERER_VITE_SITE_TITLE"),
            description: getEnv("RENDERER_VITE_SITE_DES"),
            display: "standalone",
            start_url: "/",
            theme_color: "#fff",
            background_color: "#efefef",
            icons: [
              {
                src: "/imgs/icons/favicon-32x32.png",
                sizes: "32x32",
                type: "image/png"
              },
              {
                src: "/imgs/icons/favicon-96x96.png",
                sizes: "96x96",
                type: "image/png"
              },
              {
                src: "/imgs/icons/favicon-256x256.png",
                sizes: "256x256",
                type: "image/png"
              },
              {
                src: "/imgs/icons/favicon-512x512.png",
                sizes: "512x512",
                type: "image/png"
              }
            ]
          }
        })
      ],
      // 服务器配置
      server: {
        port: devPort,
        // 代理
        proxy: {
          "/api": {
            target: `http://${getEnv("MAIN_VITE_SERVER_HOST")}:${serverPort}`,
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, "")
          }
        }
      },
      // 构建
      root: ".",
      build: {
        target: "esnext",
        minify: "terser",
        publicDir: resolve(__electron_vite_injected_dirname, "public"),
        rollupOptions: {
          input: {
            index: resolve(__electron_vite_injected_dirname, "index.html")
          }
        },
        terserOptions: {
          compress: {
            pure_funcs: ["console.log"]
          }
        },
        sourcemap: false
      }
    }
  };
});
export {
  electron_vite_config_default as default
};

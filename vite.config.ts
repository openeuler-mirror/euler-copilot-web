import { fileURLToPath, URL } from "node:url";
import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
// https://vitejs.dev/config/

export default defineConfig(async () => ({
  plugins: [vue()],
  resolve: {
    alias: {
      src: fileURLToPath(new URL("./src", import.meta.url)),
      assets: fileURLToPath(new URL("./src/assets", import.meta.url)),
      components: fileURLToPath(new URL("./src/components", import.meta.url)),
    },
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
    proxy: {
      "/plugin": {
        target: 'https://eulercopilot.gitee.com',
        changeOrigin: true,
        ws: false,
        secure: false,
      },
      "/api": {
        target: 'https://eulercopilot.gitee.com',
        changeOrigin: true,
        ws: false,
        rewrite: (path: string) => path.replace(/^\/api/, "/api"),
      },
    },
  },
}));

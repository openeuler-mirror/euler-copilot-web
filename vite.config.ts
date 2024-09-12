import { fileURLToPath, URL } from "node:url";
import { defineConfig, loadEnv } from "vite";
// import vue from "@vitejs/plugin-vue";

// import type { UserConfigExport } from "vite";

// // https://vitejs.dev/config/
// export default ({ mode }): UserConfigExport => {
//   const env = loadEnv(mode, process.cwd());

//   return defineConfig({
//     resolve: {
//       alias: {
//         src: fileURLToPath(new URL("./src", import.meta.url)),
//         assets: fileURLToPath(new URL("./src/assets", import.meta.url)),
//         components: fileURLToPath(new URL("./src/components", import.meta.url)),
//       },
//     },
//     plugins: [vue()],
//     build: {
//       rollupOptions: {
//         output: {
//           manualChunks(id) {
//             if (/\/opendesign2\/themes\/es\/(.*?)\//.test(id)) {
//               return "opendesign2";
//             }
//             if (/\/element-plus\/es\/components\/(.*?)\/(.*)\/?style/.test(id)) {
//               return "element-plus";
//             }
//           },
//           chunkFileNames: (chunkInfo: any) => {
//             const faceadeModuleId = chunkInfo.faceadeModuleId
//               ? chunkInfo.faceadeModuleId.split("/")
//               : [];
//             const fileName = faceadeModuleId[faceadeModuleId.length - 2] || "[name]";
//             return `assets/${fileName}.[hash].js`;
//           },
//         },
//       },
//     },

//     server: {
//       host: "localhost",
//       hmr: true,
//       open: true,
//       // port: 1000,
//       strictPort: true,
//       watch: {
//       // 3. tell vite to ignore watching `src-tauri`
//       ignored: ["**/src-tauri/**"],
//     },
//       proxy: {
//         "/plugin": {
//           target: 'http://116.63.164.87:30007',
//           changeOrigin: true,
//           ws: false,
//           secure: false,
//         },
//         "/rag": {
//           target: 'http://116.63.164.87:30007',
//           secure: false,
//           changeOrigin: true,
//           ws: false,
//           rewrite: (path: string) => path.replace(/^\/rag/, ""),
//         },
//         "/stream": {
//           target: 'http://116.63.164.87:30007',
//           secure: false,
//           changeOrigin: true,
//           ws: false,
//           rewrite: (path: string) => path.replace(/^\/stream/, ""),
//         },
//         "/qabot": {
//           target: env.VITE_QABOT_URL,
//           changeOrigin: true,
//           ws: false,
//           rewrite: (path: string) => path.replace(/^\/qabot/, ""),
//         },
//         "/test": {
//           target: 'http://116.63.164.87:30007',
//           changeOrigin: true,
//           ws: false,
//           rewrite: (path: string) => path.replace(/^\/test/, ""),
//         },
//         "/api": {
//           target: 'http://116.63.164.87:30007',
//           changeOrigin: true,
//           ws: false,
//           rewrite: (path: string) => path.replace(/^\/api/, "/api"),
//         },
//       },
//     },
//   });
// };
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
                target: 'http://116.63.164.87:30007',
                changeOrigin: true,
                ws: false,
                secure: false,
              },
              "/rag": {
                target: 'http://116.63.164.87:30007',
                secure: false,
                changeOrigin: true,
                ws: false,
                rewrite: (path: string) => path.replace(/^\/rag/, ""),
              },
              "/stream": {
                target: 'http://116.63.164.87:30007',
                secure: false,
                changeOrigin: true,
                ws: false,
                rewrite: (path: string) => path.replace(/^\/stream/, ""),
              },
              "/test": {
                target: 'http://116.63.164.87:30007',
                changeOrigin: true,
                ws: false,
                rewrite: (path: string) => path.replace(/^\/test/, ""),
              },
              "/api": {
                target: 'http://116.63.164.87:30007',
                changeOrigin: true,
                ws: false,
                rewrite: (path: string) => path.replace(/^\/api/, "/api"),
              },
            },
  },
}));

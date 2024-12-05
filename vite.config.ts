// Copyright (c) Huawei Technologies Co., Ltd. 2023-2024. All rights reserved.
// licensed under the Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.
import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import Qiankun from 'vite-plugin-qiankun'

import { resolve } from "path";
import type { UserConfigExport } from "vite";

// https://vitejs.dev/config/
export default ({ mode }): UserConfigExport => {
  const env = loadEnv(mode, process.cwd());
  const {
    VITE_BASE_URL
  } = env

  const baseUrl = mode === 'micro' ? VITE_BASE_URL : '/'
  return defineConfig({
    base: baseUrl,
    resolve: {
      alias: {
        "@": resolve(__dirname, "./src"),
        src: resolve(__dirname, "./src"),
        assets: resolve(__dirname, "./src/assets"),
        components: resolve(__dirname, "./src/components"),
      },
    },
    plugins: [
      vue(),
      Qiankun("copilot", {
        useDevMode: mode === 'micro'
      })
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (/\/opendesign2\/themes\/es\/(.*?)\//.test(id)) {
              return "opendesign2";
            }
            if (/\/element-plus\/es\/components\/(.*?)\/(.*)\/?style/.test(id)) {
              return "element-plus";
            }
          },
          chunkFileNames: (chunkInfo: any) => {
            const faceadeModuleId = chunkInfo.faceadeModuleId
              ? chunkInfo.faceadeModuleId.split("/")
              : [];
            const fileName = faceadeModuleId[faceadeModuleId.length - 2] || "[name]";
            return `assets/${fileName}.[hash].js`;
          },
        },
      },
    },

    server: {
      host: "localhost",
      hmr: true,
      open: true,
      port: 3000,
      origin: 'http://localhost:3000',
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      proxy: {
        "/plugin": {
          target: env.VITE_BASE_PROXY_URL,
          changeOrigin: true,
          ws: false,
          secure: false,
        },
        "/rag": {
          target: env.VITE_BASE_PROXY_URL,
          secure: false,
          changeOrigin: true,
          ws: false,
          rewrite: (path: string) => path.replace(/^\/rag/, ""),
        },
        "/stream": {
          target: env.VITE_BASE_PROXY_URL,
          secure: false,
          changeOrigin: true,
          ws: false,
          rewrite: (path: string) => path.replace(/^\/stream/, ""),
        },
        "/test": {
          target: env.VITE_BASE_PROXY_URL,
          changeOrigin: true,
          ws: false,
          rewrite: (path: string) => path.replace(/^\/test/, ""),
        },
        "/api": {
          target: env.VITE_BASE_PROXY_URL,
          changeOrigin: true,
          ws: false,
          rewrite: (path: string) => path,
          cookieDomainRewrite: '.euler-copilot-master.test.osinfra.cn'
        },
      },
    },
  });
};

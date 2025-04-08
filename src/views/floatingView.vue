<template>
  <div
    data-tauri-drag-region
    class="floating-icon"
    @dblclick="toggleMainWindow"
    @contextmenu.prevent="showContextMenu"
  >
    <img src="src/assets/svgs/euler_copilot_logo.svg" />
  </div>
</template>

<script lang="ts" setup>
import { invoke } from "@tauri-apps/api/tauri";
import { WebviewWindow } from "@tauri-apps/api/window";
import { showMenu } from "tauri-plugin-context-menu";

const toggleMainWindow = async () => {
  const mainWindow: WebviewWindow | null = WebviewWindow.getByLabel("main");
  if (!mainWindow) {
    await invoke("show_main_window");
  } else {
    if (await mainWindow.isVisible()) {
      await mainWindow.hide();
    } else {
      await invoke("show_main_window");
    }
  }
};

const showContextMenu = (event: MouseEvent) => {
  const mainWindow: WebviewWindow | null = WebviewWindow.getByLabel("main");
  showMenu({
    pos: { x: event.clientX, y: event.clientY },
    items: [
      {
        label: "显示窗口",
        event: () => {
          invoke("show_main_window");
        },
      },
      {
        label: "隐藏窗口",
        event: () => {
          mainWindow?.hide();
        },
      },
      { is_separator: true },
      {
        label: "设置",
        event: () => {
          invoke("show_settings_window");
        },
      },
      { is_separator: true },
      {
        label: "退出",
        event: () => {
          invoke("exit_app");
        },
      },
    ],
  });
};
</script>

<style>
body {
  background: transparent;
  overflow: hidden;
  position: fixed;
  width: 100vw;
  height: 100vh;
  padding: 10px;
}
</style>

<style scoped>
.floating-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background-color: white;
  display: flex;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
  transition: transform 0.2s ease-in-out;
}

.floating-icon:hover {
  transform: scale(1.05);
}

.floating-icon img {
  width: 75%;
  height: 75%;
  object-fit: cover;
  pointer-events: none;
}
</style>

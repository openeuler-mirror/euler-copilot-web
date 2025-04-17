<script setup lang="ts">
import { ref } from 'vue';
import { ipcRenderer } from '@/utils/electron';
import { useChangeThemeStore } from '@/store';
import { storeToRefs } from 'pinia';

const { theme } = storeToRefs(useChangeThemeStore());

const changeTheme = (e: PointerEvent) => {
  if (!e.target) return;
  const { updateTheme } = useChangeThemeStore();
  updateTheme(theme.value === 'light' ? 'dark' : 'light');
};
</script>

<template>
  <div class="operations">
    <div class="theme" @click="changeTheme">
      <div class="theme-icon" v-if="theme === 'light'">
        <img id="sun-icon" src="@/assets/svgs/sun.svg" alt="" />
      </div>
      <div class="theme-icon" v-else>
        <img id="moon-icon" src="@/assets/svgs/moon.svg" alt="" />
      </div>
    </div>
    <div class="settings">
      <img src="@/assets/svgs/settings.svg" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.operations {
  display: flex;
  align-items: center;
  gap: 20px;

  img {
    cursor: pointer;
  }

  .theme {
    &-icon {
      width: 24px;
      height: 24px;
      img {
        width: 100%;
        height: 100%;
      }
    }
  }

  .settings {
    width: 24px;
    height: 24px;

    img {
      width: 100%;
      height: 100%;
    }
  }
}
</style>

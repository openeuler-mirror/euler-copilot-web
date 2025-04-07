<script setup lang="ts">
import { ref } from 'vue';
import { ipcRenderer } from '@/utils/electron';

const isDark = ref(localStorage.getItem('theme') === 'dark');

const changeTheme = (e: PointerEvent) => {
  if (!e.target) return;
  isDark.value = !isDark.value;
  const theme = isDark.value ? 'dark' : 'light';
  if (ipcRenderer) {
    ipcRenderer.invoke('copilot:theme', {
      theme,
      backgroundColor: isDark.value ? '#1f2329' : '#ffffff',
    });
  }

  isDark.value
    ? document.body.setAttribute('theme', 'dark')
    : document.body.setAttribute('theme', 'light');
  localStorage.setItem('theme', theme);
};
</script>

<template>
  <div class="operations">
    <div class="theme" @click="changeTheme">
      <div class="theme-icon" v-if="isDark">
        <img id="sun-icon" src="../../assets/svgs/sun.svg" alt="" />
      </div>
      <div class="theme-icon" v-else>
        <img id="moon-icon" src="../../assets/svgs/moon.svg" alt="" />
      </div>
    </div>
    <div class="edit">
      <img src="../../assets/images/edit.png" />
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
      width: 20px;
      height: 20px;
      img {
        width: 100%;
        height: 100%;
      }
    }
  }

  .edit {
    width: 20px;
    height: 20px;

    img {
      width: 100%;
      height: 100%;
    }
  }
}
</style>

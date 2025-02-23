<script lang="ts" setup>
import { onMounted, reactive } from 'vue'
import { errorMsg, successMsg } from 'src/components/Message';
import { invoke } from '@tauri-apps/api/tauri';
import { enable, isEnabled, disable } from "tauri-plugin-autostart-api";

const settingsItems = reactive({
  url: '',
  key: '',
  autoStart: false
})

async function loadSettings() {
  try {
    await invoke('get_base_url').then(async (url: any) => {
      settingsItems.url = url;
    });
    await invoke('get_api_key').then(async (apiKey: any) => {
      settingsItems.key = apiKey;
    });
    await isEnabled().then(async (isEnabled: boolean) => {
      settingsItems.autoStart = isEnabled;
    });
  } catch (err) {
    errorMsg('加载失败');
    console.error(err);
  }
}

async function saveSettings() {
  if (!settingsItems.key) {
    errorMsg('请输入 API Key');
    return;
  }

  if (settingsItems.key.length != 32) {
    errorMsg('API Key 长度不正确');
    return;
  }

  try {
    await invoke('update_config', {
      url: settingsItems.url,
      apiKey: settingsItems.key,
    });
    successMsg('保存成功');
  } catch (err) {
    errorMsg('保存失败');
    console.error(err);
  }
}

async function toggleAutoStart() {
  await isEnabled().then(async (isEnabled: boolean) => {
    if (isEnabled) {
      await disable().then(() => {
        settingsItems.autoStart = false;
      }).catch((err) => {
        errorMsg('开机启动关闭失败')
        console.error(err);
      });
    } else {
      await enable().then(() => {
        settingsItems.autoStart = true;
      }).catch((err) => {
        errorMsg('开机启动开启失败')
        console.error(err);
      });
    }
  });
}

onMounted(() => {
  loadSettings();
})
</script>

<template>
  <div class="dialogue">
    <header class="dialogue-header">
      <span>
        <img src="src/assets/svgs/euler_copilot_logo.svg" />
        <h4>EulerCopilot</h4>
      </span>
    </header>
    <div class="dialogue-container">
      <div class="dialogue-container-main">
        <div class="settings">
          <el-form ref="ruleFormRef" style="max-width: 600px" :model="settingsItems"
            label-width="auto" class="demo-ruleForm">
            <el-form-item label="服务地址" prop="url">
              <el-input v-model="settingsItems.url" />
            </el-form-item>
            <el-form-item label="API Key" prop="key">
              <el-input v-model="settingsItems.key" autocomplete="off" />
            </el-form-item>
            <el-form-item label="开机启动">
              <el-checkbox v-model="settingsItems.autoStart" @change="toggleAutoStart" :lable="settingsItems.autoStart ? '已开启' : '已关闭'" />
            </el-form-item>
              <el-button class='button' type="primary" @click="saveSettings">
                保存
              </el-button>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
body {
  overflow: hidden;
  position: fixed;
  width: 100vw;
  height: 100vh;
}

.button{
  left: calc(50% - 23px);
  position: relative;
}

.popper-class {
  padding: 3px 0 !important;

  .exit-button {
    width: 100%;
    border-radius: 0;
  }
}
</style>

<style lang="scss" scoped>
.settings {
  top: 25%;
  position: relative;
}

.dialogue {
  overflow: hidden;
  height: 100vh;
  width: 100vw;
  min-height: 360px;
  min-width: 540px;
  display: flex;
  flex-direction: column;
  background-image: var(--o-bg-image);
  background-size: cover;
  &-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 48px;
    padding: 0 24px;
    background-color: var(--o-bg-color-base);
    span {
      align-items: center;
      display: flex;
      align-content: center;
      vertical-align: top;
      font-size: 16px;
      height: 48px;
      img {
        width: 24px;
        height: 48px;
        border-radius: 50%;
      }

      h4 {
        font-size: 18px;
        margin-left: 5px;
        color: var(--o-text-color-primary);
      }
    }

    .header-right {
      display: flex;

      .mode {
        margin-right: 18px;
      }
    }
  }

  &-container {
    display: flex;
    padding: 16px 24px 16px 24px;
    height: calc(100% - 70px);
    justify-content: space-between;

    &-main {
      // display: flex;
      flex: 1;
    }
  }
}
</style>

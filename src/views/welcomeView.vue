<script lang="ts" setup>
import { reactive } from 'vue'
import { errorMsg, successMsg } from 'src/components/Message';
import { invoke } from '@tauri-apps/api/tauri';

const settingsItems = reactive({
  key: '',
})

async function saveSettings() {
  try {
    await invoke('update_config', {
      url: null,
      apiKey: settingsItems.key,
    });
    successMsg('保存成功');
  } catch (error) {
    errorMsg('保存失败');
    console.error(error);
  }
}

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
            <el-form-item label="API KEY" prop="key">
              <el-input v-model="settingsItems.key" type="password" autocomplete="off" />
            </el-form-item>
            <el-form-item>
              <el-button class='button' type="primary" @click="saveSettings">
                保存
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">

.button{
  left: 50%;
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
  height: 100vh;
  width: 100vw;
  min-height: 540px;
  min-width: 720px;
  overflow: scroll;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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
      display: flex;
      flex: 1;
    }
  }
}
</style>

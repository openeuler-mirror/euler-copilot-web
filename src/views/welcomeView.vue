<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import { errorMsg, successMsg } from 'src/components/Message';
import { invoke } from '@tauri-apps/api/tauri';
import { WebviewWindow } from '@tauri-apps/api/window';
import marked from 'src/utils/marked';
import EulerDialog from 'src/components/EulerDialog.vue';


const tip = ref<string>('');

const settingsItems = reactive({
  key: '',
})

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
      url: null,
      apiKey: settingsItems.key,
    });
    successMsg('保存成功');
  } catch (error) {
    errorMsg('保存失败');
    console.error(error);
  }

  await invoke('show_main_window');
  await WebviewWindow.getByLabel('welcome')?.close();
}

const theme = localStorage.getItem('theme') === 'dark' ? 'dark' : 'light';
const agreeDialogVisiable = ref(false);

const openCopilotWeb = () => {
  invoke('open_url', {
    url: 'https://eulercopilot.gitee.com'
  }).catch(err => {
    console.error(err);
  });
}

const readAgreementTip = async () => {
  console.log('123');
  const response = await import('src/conf/agreement-tip.md?raw');
  tip.value = marked.parse(response.default) as string;
  agreeDialogVisiable.value = true;
};


onMounted(() => {
  readAgreementTip();
});

</script>

<template>
  <div class="dialogue">
    <header class="dialogue-header">
      <span>
        <h4>欢迎使用 </h4>
        <img class='logo' src="src/assets/images/logo_text.png" />
      </span>
    </header>
    <div class="dialogue-container">
      <div class="dialogue-container-main">
        <div class="tip">
          <img v-if='theme === "dark"' class='tips' src='src/assets/images/api_key_tips_dark.png'/>
          <img v-else class='tips' src='src/assets/images/api_key_tips_light.png'/>
          <p @click='openCopilotWeb'>没有 API Key？点击前往获取</p>
        </div>
        <div class="settings">
          <el-form ref="ruleFormRef" :model="settingsItems"
            label-width="auto" class="demo-ruleForm">
            <el-form-item label="API KEY" prop="key">
              <el-input v-model="settingsItems.key" autocomplete="off" />
            </el-form-item>
            <el-form-item>
              <el-button class='button' type="primary" @click="saveSettings">
                开始使用！
              </el-button>
            </el-form-item>
          </el-form>
        </div>
        <EulerDialog
      :visible="agreeDialogVisiable"
      :content="tip"
      :need-check="false"
      agreement-name="《服务协议》"
      @submit="agreeDialogVisiable = false"
    ></EulerDialog>
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

.logo{
  width: 100px;
}

.tip{
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;

  p{
    text-decoration:none;
    display: block;
  }
}

.tips{
  width: 200px;
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
  top: 5%;
  position: relative;
}
.dialogue {
  overflow: hidden;
  height: 100vh;
  width: 100vw;
  min-height: 540px;
  min-width: 720px;
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
        width: auto;
        height: 32px;
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
      flex: 1;
    }
  }
}
</style>

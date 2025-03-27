<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue';
import { errorMsg, successMsg } from 'src/components/Message';
import { invoke } from '@tauri-apps/api/tauri';
import { WebviewWindow } from '@tauri-apps/api/window';
import { open } from '@tauri-apps/api/dialog';
import { readTextFile } from '@tauri-apps/api/fs';
import marked from 'src/utils/marked';
import EulerDialog from 'src/components/EulerDialog.vue';

const tip = ref<string>('');

const settingsItems = reactive({
  url: '',
  key: '',
});

const modelOptions = ref<{ value: string; label: string }[]>([]);

async function openFileDialog() {
  try {
    const selected = await open({
      multiple: false,
      filters: [
        {
          name: 'JSON',
          extensions: ['json'],
        },
      ],
    });

    if (selected === null) {
      // 用户取消了选择，不做任何处理
      return;
    }

    if (!Array.isArray(selected)) {
      settingsItems.url = selected;
      await loadModelOptions();
    }
  } catch (error) {
    console.error('文件选择器错误:', error);
    errorMsg(
      `打开文件选择器失败: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

async function loadModelOptions() {
  try {
    if (!settingsItems.url) return;

    const content = await readTextFile(settingsItems.url);
    const config = JSON.parse(content);

    if (config.models && Array.isArray(config.models)) {
      modelOptions.value = config.models.map((model: any) => ({
        value: model.title,
        label: model.title,
      }));

      if (modelOptions.value.length > 0 && !settingsItems.key) {
        settingsItems.key = modelOptions.value[0].value;
      }
    } else {
      errorMsg('配置文件格式不正确，未找到models字段');
    }
  } catch (error) {
    errorMsg('读取配置文件失败');
    console.error(error);
  }
}

async function saveSettings() {
  if (!settingsItems.key) {
    errorMsg('请选择模型');
    return;
  }

  if (!settingsItems.url) {
    errorMsg('请选择 MCP 配置文件');
    return;
  }

  try {
    await invoke('update_config', {
      url: settingsItems.url,
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

const agreeDialogVisiable = ref(false);

const readAgreementTip = async () => {
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
        <h4>欢迎使用</h4>
        <img class="logo" src="src/assets/images/logo_text.png" />
      </span>
    </header>
    <div class="dialogue-container">
      <div class="dialogue-container-main">
        <div class="tip">
          <p>请先配置 MCP 和大模型信息</p>
        </div>
        <div class="settings">
          <el-form
            ref="ruleFormRef"
            :model="settingsItems"
            label-width="120px"
            class="demo-ruleForm"
            label-position="left"
          >
            <el-form-item label="MCP 配置路径" prop="url">
              <div class="file-selector">
                <el-input v-model="settingsItems.url" readonly />
                <el-button type="primary" @click="openFileDialog"
                  >选择文件</el-button
                >
              </div>
            </el-form-item>
            <el-form-item label="模型名称" prop="key">
              <el-select
                v-model="settingsItems.key"
                placeholder="请选择模型"
                style="width: 100%"
              >
                <el-option
                  v-for="item in modelOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-form>
        </div>
        <div class="bottom-button-container">
          <el-button type="primary" @click="saveSettings">开始使用！</el-button>
        </div>
        <EulerDialog
          :visible="agreeDialogVisiable"
          :content="tip"
          :need-check="false"
          agreement-name="内测声明"
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

.logo {
  width: 100px;
}

.tip {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;

  p {
    text-decoration: none;
    display: block;
    font-size: 18px;
  }
}

.tips {
  width: 200px;
}

.popper-class {
  padding: 3px 0 !important;

  .exit-button {
    width: 100%;
    border-radius: 0;
  }
}

.file-selector {
  display: flex;
  gap: 10px;
  width: 100%;

  .el-input {
    flex-grow: 1;
  }
}

/* 添加表单对齐样式 */
.demo-ruleForm {
  width: 100%;
  max-width: 500px;
  margin: 0 auto;

  .el-form-item__content {
    display: flex;
    justify-content: flex-start;
    width: 100%;
  }

  .el-select {
    width: 100%;
  }
}

/* 添加底部按钮容器样式 */
.bottom-button-container {
  position: absolute;
  bottom: 50px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  padding: 20px 0;
}
</style>
<style lang="scss" scoped>
.settings {
  /* top: 5%; 删除这行以避免影响居中效果 */
  position: relative;
  margin-top: 20px;
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
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
  }
}
</style>

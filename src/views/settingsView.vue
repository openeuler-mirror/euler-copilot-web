<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue';
import { errorMsg, successMsg } from 'src/components/Message';
import { invoke } from '@tauri-apps/api/tauri';
import { enable, isEnabled, disable } from 'tauri-plugin-autostart-api';
import { open } from '@tauri-apps/api/dialog';
import { readTextFile } from '@tauri-apps/api/fs';

const settingsItems = reactive({
  url: '',
  key: '',
  autoStart: false,
});

const modelOptions = ref<{ value: string; label: string }[]>([]);

async function loadSettings() {
  try {
    // 获取基本URL
    const url = (await invoke('get_base_url')) as string;
    console.log('获取到的配置路径:', url);
    settingsItems.url = url;

    // 如果URL存在，先加载模型列表
    if (url && url.trim() !== '') {
      await loadModelOptions();
    } else {
      console.log('配置路径为空，清空模型选项');
      modelOptions.value = [];
    }

    // 获取模型名称
    const apiKey = (await invoke('get_api_key')) as string;
    settingsItems.key = apiKey;
    console.log('获取到的模型名称:', apiKey);

    // 获取自启动状态
    const autoStartEnabled = await isEnabled();
    settingsItems.autoStart = autoStartEnabled;
  } catch (err) {
    errorMsg('加载设置失败');
    console.error('加载设置错误:', err);
  }
}

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
    if (!settingsItems.url || settingsItems.url.trim() === '') {
      console.log('配置路径为空，无法加载模型选项');
      return;
    }

    console.log('正在从路径加载模型选项:', settingsItems.url);
    try {
      const content = await readTextFile(settingsItems.url);
      console.log('读取到的配置文件内容:', content.substring(0, 100) + '...');

      const config = JSON.parse(content);

      if (config.models && Array.isArray(config.models)) {
        modelOptions.value = config.models.map((model: any) => ({
          value: model.title,
          label: model.title,
        }));

        console.log('解析出的模型选项:', modelOptions.value);

        if (modelOptions.value.length > 0 && !settingsItems.key) {
          settingsItems.key = modelOptions.value[0].value;
        }
      } else {
        errorMsg('配置文件格式不正确，未找到models字段或格式错误');
        console.error('配置文件格式不正确:', config);
      }
    } catch (readError) {
      errorMsg(
        `读取配置文件失败: ${
          readError instanceof Error ? readError.message : String(readError)
        }`
      );
      console.error('读取配置文件错误:', readError);
      modelOptions.value = [];
    }
  } catch (error) {
    errorMsg('加载模型选项失败');
    console.error('加载模型选项错误:', error);
    modelOptions.value = [];
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
  } catch (err) {
    errorMsg('保存失败');
    console.error(err);
  }
}

async function toggleAutoStart() {
  await isEnabled().then(async (isEnabled: boolean) => {
    if (isEnabled) {
      await disable()
        .then(() => {
          settingsItems.autoStart = false;
        })
        .catch((err) => {
          errorMsg('开机启动关闭失败');
          console.error(err);
        });
    } else {
      await enable()
        .then(() => {
          settingsItems.autoStart = true;
        })
        .catch((err) => {
          errorMsg('开机启动开启失败');
          console.error(err);
        });
    }
  });
}

onMounted(() => {
  loadSettings();
});
</script>

<template>
  <div class="dialogue">
    <div class="dialogue-container">
      <div class="dialogue-container-main">
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
            <el-form-item label="开机启动">
              <el-switch
                v-model="settingsItems.autoStart"
                @change="toggleAutoStart"
              />
            </el-form-item>
            <div class="bottom-button-container">
              <el-button type="primary" @click="saveSettings"> 保存 </el-button>
            </div>
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

.file-selector {
  display: flex;
  gap: 10px;
  width: 100%;

  .el-input {
    flex-grow: 1;
  }
}

.demo-ruleForm {
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;

  .el-form-item__content {
    display: flex;
    justify-content: flex-start;
    width: 100%;
  }

  .el-select {
    width: 100%;
  }
}

.bottom-button-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
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
  position: relative;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.dialogue {
  overflow: hidden;
  height: 100vh;
  width: 100vw;
  min-height: 256px;
  min-width: 540px;
  display: flex;
  flex-direction: column;
  background-image: var(--o-bg-image);
  background-size: cover;

  &-container {
    display: flex;
    padding: 16px 24px 16px 24px;
    height: 100%;
    justify-content: space-between;

    &-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
  }
}
</style>

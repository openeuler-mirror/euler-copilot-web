<script lang="ts" setup>
import { CSSProperties, onMounted, ref } from 'vue';
import { ElEmpty, ElMessage } from 'element-plus';
import { View, Hide, CopyDocument } from '@element-plus/icons-vue';
import i18n from '@/i18n';
import DarkNull from '@/assets/svgs/dark_null.svg';
import { api } from '@/apis';
import { writeText } from '@/utils';

const { t } = i18n.global;

interface ApiKey {
  name: string;
  description?: string;
  createTime?: string;
}

const pageLoading = ref(true);

const apiKeys = ref<ApiKey[]>([]);
async function queryApiKeys() {
  const [, res] = await api.getApiKey();
  if (res) {
    apiKeys.value.push({
      name: res.result.api_key_exists || '',
      description: '',
      createTime: '',
    });
    pageLoading.value = false;
  }
}

const createdApiKey = ref('');
async function createApiKey() {
  const [_, res] = await api.changeApiKey({ action: 'create' });
  if (res) {
    createdApiKey.value = res.result.api_key;
  }
}

function onConfirmClick(action: 'copy' | 'create') {
  if (action === 'copy') {
    writeText(createdApiKey.value);
    ElMessage.success('复制成功');
    isCreateKeyDialogVisible.value = false;
  } else {
    createApiKey();
  }
}

const isCreateKeyDialogVisible = ref(false);
const apiKeyDescription = ref('');
function onCreateNewKey() {
  isCreateKeyDialogVisible.value = true;
}

onMounted(() => {
  queryApiKeys();
});
</script>
<template>
  <div class="api-key" v-loading="pageLoading">
    <div v-if="apiKeys.length">
      <el-button type="primary" @click="onCreateNewKey">
        {{ t('settings.new_api_key') }}
      </el-button>
      <el-table
        style="margin-top: 16px"
        :header-cell-style="
          {
            backgroundColor: 'rgb(244,246,250)',
            boxShadow: '0 -1 0 0 rgb(223,229,239)',
            height: '32px',
            fontSize: '12px',
          } as CSSProperties
        "
        :data="apiKeys"
      >
        <el-table-column align="left" prop="name">
          <template #header>
            <div class="name-col">
              <el-icon size="14"><View /></el-icon>
              {{ t('settings.secret_key') }}
            </div>
          </template>
          <template #default="scope">
            <div class="name-col-content">
              <el-icon size="14"><View /></el-icon>
              ************************************
              <el-icon size="14"><CopyDocument /></el-icon>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          prop="description"
          :label="t('settings.secret_key_desc')"
        />
        <el-table-column prop="createTime" :label="t('common.createTime')" />
        <el-table-column :label="t('common.operate')">
          <template #default>
            <el-button text>{{ t('common.edit') }}</el-button>
            <el-button text>{{ t('common.delete') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <ElEmpty
      v-else
      style="height: 100%"
      :image="DarkNull"
      description="暂无可用的API_Key"
    >
      <el-button type="primary" @click="onCreateNewKey">
        {{ t('settings.new_api_key') }}
      </el-button>
    </ElEmpty>
  </div>

  <el-dialog
    v-model="isCreateKeyDialogVisible"
    :title="t('settings.new_api_key')"
    width="544"
    class="api-key-dialog"
  >
    <div v-if="!createdApiKey">
      <el-form label-position="left" label-width="auto">
        <el-form-item :label="t('settings.secret_key_desc')" prop="URL">
          <el-input
            type="textarea"
            maxlength="200"
            show-word-limit
            :rows="6"
            placeholder="请输入密钥描述"
            v-model="apiKeyDescription"
          />
        </el-form-item>
      </el-form>
    </div>
    <div class="api-key-value" v-else>
      <el-alert
        v-if="createdApiKey"
        type="info"
        :show-icon="true"
        :closable="false"
      >
        {{ i18n.global.t('apikey.save_apikey') }}
      </el-alert>

      <div class="value">{{ createdApiKey }}</div>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button
          type="primary"
          class="button"
          @click="onConfirmClick(createdApiKey ? 'copy' : 'create')"
        >
          {{ createdApiKey ? '复制' : t('common.confirm') }}
        </el-button>
        <el-button class="button" @click="isCreateKeyDialogVisible = false">
          {{ i18n.global.t('apikey.cancel') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.api-key {
  height: 100%;
}
.dialog-footer {
  .button {
    width: 64px;
    height: 24px;
    border-radius: 4px;
  }
}

.name-col {
  display: flex;
  align-items: center;
  gap: 8px;
}

.name-col-content {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>

<style>
.api-key-dialog > .el-dialog__body {
  padding: 24px 24px 0px 24px;
  .el-textarea {
    --o-textarea-border-radius: 4px;
  }
}
.api-key-value {
  display: flex;
  flex-direction: column;
  font-size: 26px;
  align-items: center;
  .value {
    margin: 40px;
  }
}
</style>

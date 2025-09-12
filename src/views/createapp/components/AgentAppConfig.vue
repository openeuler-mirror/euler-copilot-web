<script lang="ts" setup>
import { CaretRight, CirclePlus, CaretBottom } from '@element-plus/icons-vue';
import AppInitalPreview from '@/views/dialogue/components/AppInitalPreview.vue';
import { ref, reactive, onMounted, watch, computed } from 'vue';
import { ElMessage, FormRules, UploadProps } from 'element-plus';
import { useRoute } from 'vue-router';
import DebugApp from '../components/DebugApp.vue';
import McpDrawer from './McpDrawer.vue';
import { api } from '@/apis';
import type { AddedModalList } from '@/apis/paths/type';
import PermissionControl from './PermissionControl.vue';
import type { Mcp } from './McpDrawer.vue';
import CustomLoading from '../../customLoading/index.vue';
import i18n from '@/i18n';
import defaultIcon from '@/assets/svgs/defaultIcon.webp';

const { t } = i18n.global;
const route = useRoute();

interface AgentConfig {
  icon: string;
  name: string;
  description: string;
  model: string;
  dialogRounds: number;
  prompt: string;
  mcps: string[];
  knowledge: any[];
  permission: {
    visibility: string;
    authorizedUsers: string[];
  };
}

const props = withDefaults(
  defineProps<{
    handleValidateContent: (val: any) => void;
    onDebug: (status: boolean) => void;
    saveConfig: () => void;
  }>(),
  {},
);

const activeName = ref(['base', 'multipleRounds', 'ability', 'permissions']);
function onBaseInfoHeaderClick() {
  activeName.value = activeName.value.includes('base')
    ? activeName.value.filter((item) => item !== 'base')
    : [...activeName.value, 'base'];
}

const modelOptions = ref<AddedModalList[]>([]);

const isDebugDialogVisible = ref(false);

const createAppForm = reactive<AgentConfig>({
  dialogRounds: 3,
  icon: '',
  name: '',
  description: '',
  model: '',
  prompt: '',
  mcps: [],
  knowledge: [],
  permission: {
    visibility: 'public',
    authorizedUsers: [],
  },
});

const canPublish = ref(false);

const selectedMcpService = computed<Mcp[]>(() =>
  mcpList.value.filter((item) =>
    createAppForm.mcps.includes(item.mcpserviceId),
  ),
);

const rules = reactive<FormRules<typeof createAppForm>>({
  name: [{ required: true, message: t('app.appName_input') }],
  description: [{ required: true, message: t('app.appDescription_input') }],
  model: [{ required: true, message: t('app.modelSelected_input') }],
  dialogRounds: [
    {
      required: true,
      message: t('app.multi_Dialogue_select'),
    },
  ],
  permission: [{ required: true }],
});

const isMcpDrawerVisible = ref(false);

const loading = ref(true);

async function queryAgentConfig() {
  const [, res] = await api.querySingleAppData({
    id: route.query?.appId as string,
  });
  createAppFormRef.value?.clearValidate();

  if (res) {
    const { name, description, permission, icon, mcpService, dialogRounds, llm } =
      res.result;
    createAppForm.icon = icon || '';
    createAppForm.name = name;
    createAppForm.description = description;
    createAppForm.mcps = mcpService?.map((item) => item.id) || [];
    createAppForm.dialogRounds = dialogRounds || 3;
    createAppForm.permission = permission || createAppForm.permission;
    // 如果有模型
    createAppForm.model = llm?.llmId;
  }
  loading.value = false;
}

function onMcpServiceSelected(mcps: Mcp[]) {
  if (mcps) {
    createAppForm.mcps = mcps.map((item) => item.mcpserviceId);
    isMcpDrawerVisible.value = false;
  }
  
  props.saveConfig();
}

function onDeleteMcp(mcp: any) {
  if (mcp) {
    createAppForm.mcps = createAppForm.mcps.filter(
      (item) => item !== mcp.mcpserviceId,
    );
  }
}

const beforeIconUpload: UploadProps['beforeUpload'] = async (rawFile) => {
  const isLt2M = rawFile.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    ElMessage({
      message: 'Image size cannot exceed 2MB!',
      type: 'error',
    });
    return false;
  }

  try {
    const reader = new FileReader();
    reader.onload = (e) => {
      createAppForm.icon = e.target?.result as string;
    };
    reader.readAsDataURL(rawFile);
    return false;
  } catch (error) {
    console.error('Error during file upload process:', error);
    ElMessage({
      message: 'An error occurred during file upload!',
      type: 'error',
    });
    return false;
  }
};

const userList = ref<
  {
    userName: string;
    userSub: string;
  }[]
>([]);

async function queryUserList() {
  const [, res] = await api.getPartAppConfgUser();
  if (res) {
    userList.value = res.result.userInfoList;
  }
}

async function queryModelList() {
  const [, res] = await api.getAddedModels();
  if (res) {
    modelOptions.value = res.result;
    if (modelOptions.value.length > 0) {
      createAppForm.model = modelOptions.value[0].llmId;
    }
  }
}

const mcpList = ref<Mcp[]>([]);
/**
 * 查询MCP服务
 */
async function queryMcpList() {
  const [, res] = await api.getMcpList({});
  if (res) {
    mcpList.value = res.result.services.map((item) => {
      return {
        ...item,
        isChecked: false,
      };
    });
  }
}

const createAppFormRef = ref();
watch(
  () => createAppForm,
  async () => {
    if (createAppForm.name === '') {
      return;
    }

    if (createAppFormRef.value && props.handleValidateContent) {
      try {
        const validate = await createAppFormRef.value.validate();
        props.handleValidateContent(validate);
      } catch {
        props.handleValidateContent(false);
      }
    }
  },
  { deep: true },
);

function onDebugSuccess(status: boolean) {
  canPublish.value = status;
  props.onDebug(status);
}

defineExpose({
  openDebugDialog: () => (isDebugDialogVisible.value = true),
  createAppForm,
});

onMounted(async () => {
  await queryMcpList();
  await queryUserList();
  await queryModelList();
  await queryAgentConfig();
});
</script>
<template>
  <div class="app-wrapper">
    <CustomLoading :loading="loading"></CustomLoading>
    <div class="agent-config">
      <div class="base-info" @click="onBaseInfoHeaderClick">
        <span>{{ t('semantic.baseMessage') }}</span>
        <el-icon
          class="collapse-icon"
          :class="{
            'collapse-icon-active': activeName.includes('base'),
          }"
        >
          <CaretRight />
        </el-icon>
      </div>
      <el-form
        ref="createAppFormRef"
        :model="createAppForm"
        :rules="rules"
        class="agent-config-edit"
        label-position="left"
        label-width="auto"
      >
        <el-collapse v-model="activeName">
          <el-collapse-item class="hide-header" name="base">
            <el-form-item :label="t('common.icon')" prop="icon">
              <div class="upload-area">
                <el-upload
                  class="uploader"
                  :show-file-list="false"
                  :before-upload="beforeIconUpload"
                  :accept="'image/*'"
                >
                  <div class="uploader-icon">
                    <img
                      v-if="createAppForm.icon"
                      :src="createAppForm.icon"
                      alt=""
                    />
                    <div v-else class="defaultIcon"></div>
                  </div>
                </el-upload>
                <span class="text">{{ t('plugin_center.upload_icon') }}</span>
              </div>
            </el-form-item>

            <el-form-item :label="t('app.appName')" prop="name">
              <el-input
                v-model="createAppForm.name"
                :placeholder="t('app.appName_input')"
                :validate-event="false"
              ></el-input>
            </el-form-item>

            <el-form-item :label="t('app.appDescription')" prop="description">
              <el-input
                v-model="createAppForm.description"
                type="textarea"
                :maxlength="150"
                show-word-limit
                :rows="4"
                :placeholder="t('app.appDescription_input')"
                validate-event
              ></el-input>
            </el-form-item>

            <el-form-item :label="t('app.modelSelected')" prop="model">
              <el-select
                v-model="createAppForm.model"
                style="width: 100%"
                :suffix-icon="CaretBottom"
                :placeholder="t('app.modelSelected_input')"
              >
                <el-option
                  v-for="model in modelOptions"
                  :key="model.llmId"
                  :label="model.modelName"
                  :value="model.llmId"
                >
                  <div
                    :style="{
                      display: 'flex',
                      alignItems: 'center',
                    }"
                  >
                    <img
                      style="width: 14px; height: 14px"
                      :src="model.icon"
                      alt=""
                    />
                    <span style="margin-left: 5px">{{ model.modelName }}</span>
                  </div>
                </el-option>
                <template #label>
                  <div
                    :style="{
                      display: 'flex',
                      alignItems: 'center',
                    }"
                  >
                    <img
                      style="width: 14px; height: 14px"
                      :src="
                        modelOptions.find(
                          (item) => item.llmId === createAppForm.model,
                        )?.icon || ''
                      "
                      alt=""
                    />
                    <span style="margin-left: 5px">
                      {{
                        modelOptions.find(
                          (item) => item.llmId === createAppForm.model,
                        )?.modelName
                      }}
                    </span>
                  </div>
                </template>
              </el-select>
            </el-form-item>
          </el-collapse-item>

          <el-collapse-item name="multipleRounds">
            <template #title>
              <span class="collapse-title">{{ t('app.multi_Dialogue') }}</span>
              <el-icon
                class="collapse-icon"
                :class="{
                  'collapse-icon-active': activeName.includes('multipleRounds'),
                }"
              >
                <CaretRight />
              </el-icon>
            </template>
            <el-form-item
              :label="t('app.multi_Dialogue_select')"
              prop="dialogRounds"
            >
              <div class="multi-session">
                <el-input-number
                  v-model="createAppForm.dialogRounds"
                  :step="1"
                  :value-on-clear="3"
                  :min="1"
                  :max="10"
                ></el-input-number>
                <span>(1 ~ 10)</span>
              </div>
            </el-form-item>
          </el-collapse-item>

          <el-collapse-item class="ability-and-permissions" name="ability">
            <template #title>
              <span class="collapse-title">
                {{ t('app.ability_Configuration') }}
              </span>
              <el-icon
                class="collapse-icon"
                :class="{
                  'collapse-icon-active': activeName.includes('ability'),
                }"
              >
                <CaretRight />
              </el-icon>
            </template>
            <el-form-item :label="t('app.MCPService')" prop="mcps">
              <div class="mcp-adder">
                <div class="mcp-button">
                  <el-button
                    :icon="CirclePlus"
                    text
                    @click="isMcpDrawerVisible = true"
                  >
                    {{ t('app.MCPService_add') }}
                  </el-button>
                  <span class="mcp-count">
                    {{ createAppForm.mcps.length }}/5
                  </span>
                </div>
                <div class="mcp-list">
                  <template
                    v-for="item in selectedMcpService"
                    :key="item.mcpserviceId"
                  >
                    <div class="mcp-item">
                      <div class="mcp-content">
                        <img :src="item.icon" alt="" />
                        <span>{{ item.name }}</span>
                      </div>
                      <el-tooltip :content="t('common.delete')" placement="top">
                        <img
                          src="@/assets/svgs/light_delete.svg"
                          alt=""
                          @click="onDeleteMcp(item)"
                        />
                      </el-tooltip>
                    </div>
                  </template>
                </div>
              </div>
            </el-form-item>
          </el-collapse-item>

          <el-collapse-item class="ability-and-permissions" name="permissions">
            <template #title>
              <span class="collapse-title">
                {{ t('app.permissionConfiguration') }}
              </span>
              <el-icon
                class="collapse-icon"
                :class="{
                  'collapse-icon-active': activeName.includes('permissions'),
                }"
              >
                <CaretRight />
              </el-icon>
            </template>
            <el-form-item
              :label="t('app.permission')"
              prop="permission"
              class="permissionItem"
            >
              <PermissionControl
                v-model:visibility="createAppForm.permission.visibility as any"
                :optional-list="
                  userList.map((item) => ({
                    label: item.userName,
                    key: item.userSub,
                  }))
                "
                v-model:checked-list="createAppForm.permission.authorizedUsers"
              />
            </el-form-item>
          </el-collapse-item>
        </el-collapse>
      </el-form>
    </div>

    <div class="agent-config-preview">
      <div class="preview-title">{{ t('app.ui_preview') }}</div>
      <div class="preview-content">
        <AppInitalPreview
          :createAppForm="{
            ...createAppForm,
            ...{ mcps: selectedMcpService, icon: defaultIcon },
          }"
        />
      </div>
    </div>

    <McpDrawer
      v-model:visible="isMcpDrawerVisible"
      :checked-list="createAppForm.mcps"
      @confirm="onMcpServiceSelected"
    ></McpDrawer>

    <DebugApp
      v-model:visible="isDebugDialogVisible"
      :config="{ ...createAppForm, ...{ mcps: selectedMcpService } }"
      @success="onDebugSuccess"
    />
  </div>
</template>

<style lang="scss" scoped>
.app-wrapper {
  display: flex;

  width: 100%;
  .el-input > .el-input__wrapper {
    --o-input-border-radius: 4px;
  }
  .el-input-number {
    --o-input-number-btn-border-radius: 14px;
  }

  .el-textarea {
    --o-textarea-border-radius: 4px;
  }

  .agent-config {
    display: flex;

    flex-direction: column;
    .base-info {
      display: flex;
      align-items: center;
      font-weight: 700;
      color: var(--o-text-color-primary);
      margin: 0 0 8px 8px;
      cursor: pointer;
      font-size: 16px;
    }

    .collapse-icon {
      margin-left: 8px;
      color: var(--o-text-color-primary);
      &-active {
        transform: rotate(90deg);
      }
    }

    &-edit {
      padding-right: 32px;
      width: 560px;
      overflow: scroll;
      :deep(.el-form-item__label) {
        position: relative;
        text-align: justify;
        text-align-last: justify;
        padding-left: 8px;
        &::before {
          position: absolute;
          left: 0;
          top: 25%;
        }
      }
      :deep(.el-collapse-item__header) {
        margin-bottom: 8px;
      }

      .hide-header {
        :deep(.el-collapse-item__header) {
          display: none;
        }
      }

      .ability-and-permissions {
        :deep(.el-collapse-item__header) {
          margin-bottom: 16px;
        }
      }

      .collapse-title {
        margin-left: 6px;
        color: var(--o-text-color-primary);
      }

      .upload-area {
        display: flex;
        flex-direction: column;
        .uploader {
          cursor: pointer;

          .uploader-icon {
            position: relative;
            img {
              width: 48px;
              height: 48px;
              border-radius: 50%;
            }
            .defaultIcon {
              width: 48px;
              height: 48px;
              background-image: url('@/assets/svgs/defaultIcon.webp');
              background-size: cover;
              background-repeat: no-repeat;
              background-position: center;
              &:hover {
                background-image: url('@/assets/svgs/defaultIcon.webp');
              }
            }
            &::after {
              content: '';
              display: inline-block;
              width: 16px;
              height: 16px;
              background-image: url('@/assets/svgs/upload_icon.svg');
              position: absolute;
              right: 0px;
              bottom: 0px;
            }
          }
        }
        .text {
          height: 16px;
          line-height: 12px;
          color: rgb(141, 152, 170);
        }
      }

      .prompt-form-item {
        :deep(.el-form-item__label) {
          padding-top: 0;
        }
      }

      .multi-session {
        display: flex;
        align-items: center;
        gap: 16px;
        span {
          font-size: 12px;
          color: var(--o-text-color-tertiary);
        }
      }

      .mcp-adder {
        width: 100%;
        .mcp-button {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .mcp-count {
          color: var(--o-text-color-tertiary);
        }

        .mcp-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          .mcp-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background-color: var(--el-collapse-header-bg);
            height: 40px;
            border-radius: 4px;
            padding: 0 15px;

            .mcp-content {
              display: flex;
              align-items: center;
              gap: 8px;
              img {
                width: 24px;
                height: 24px;
                border-radius: 50%;
              }
            }
            img {
              cursor: pointer;
            }
          }
        }
      }
    }
    &-preview {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;

      .preview-title {
        line-height: 24px;
        font-size: 16px;
        font-weight: 700;
        color: var(--o-text-color-primary);
      }

      .preview-content {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: calc(100% - 32px);
        border-radius: 8px;
        background-image: var(--o-bg-image);
        overflow: auto;
        background-repeat: no-repeat;
        background-position: center;
        background-size: cover;
        :deep(.copilot-footer) {
          margin-bottom: 12px;
        }
      }
    }
  }

  :deep(.el-form) {
    margin: 0;
  }
  :deep(.el-collapse) {
    margin-top: 0;
    .el-collapse-item__header {
      padding: 0;
      font-size: 16px;
      font-weight: 700;
      color: #000;
      height: 24px;
    }
    .el-collapse-item__content {
      margin: 0;
    }
  }
}
</style>

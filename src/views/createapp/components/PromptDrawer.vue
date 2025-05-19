<script lang="ts" setup>
import { Close, CirclePlus, Search } from '@element-plus/icons-vue';
import { onMounted, ref, watch } from 'vue';
import { api } from '@/apis';
import NewOrEditPrompt from './NewOrEditPrompt.vue';
import type { Prompt } from '@/apis/appCenter';
import { ElMessage } from 'element-plus';

defineProps<{
  visible: boolean;
}>();

const emits = defineEmits<{
  (e: 'update:visible', visible: boolean): void;
  (e: 'confirm', prompt: Prompt): void;
}>();

const searchKeyword = ref();
const promptList = ref<Prompt[]>([]);

const selectedPrompt = ref<Prompt>(promptList.value[0]);
const toBeEditPrompt = ref<Prompt>();

function onEditClick(prompt: Prompt) {
  toBeEditPrompt.value = prompt;
  isNewPromptVisible.value = true;
}

const isNewPromptVisible = ref(false);

/**
 * 查询提示词
 */
async function queryPrompts() {
  const [, res] = await api.getPrompts(searchKeyword.value);
  if (res) {
    promptList.value = res.result.prompts;
    selectedPrompt.value = res.result.prompts[0];
  }
}

/**
 * 删除提示词
 * @param prompt
 */
async function onDeleteClick(prompt: Prompt) {
  const [err, _] = await api.deletePrompt(prompt.promptId);
  if (!err) {
    ElMessage.success('删除成功');
    queryPrompts();
  }
}

watch(
  () => isNewPromptVisible.value,
  (newValue) => {
    if (!newValue) {
      toBeEditPrompt.value = undefined;
    }
  },
);

onMounted(() => {
  queryPrompts();
});
</script>
<template>
  <div class="prompt-drawer">
    <el-drawer
      size="700"
      :model-value="visible"
      title="提示词"
      @close="emits('update:visible', false)"
    >
      <div class="wrapper">
        <div class="search">
          <el-input
            v-model="searchKeyword"
            type="search"
            placeholder="搜索"
            :suffix-icon="Search"
            @change="queryPrompts"
          ></el-input>
          <el-button :icon="CirclePlus" @click="isNewPromptVisible = true">
            新建提示词
          </el-button>
        </div>

        <div class="prompt-wrapper">
          <div class="prompt-list">
            <template v-for="item in promptList">
              <div
                class="prompt-item"
                :class="{
                  'prompt-item__active':
                    selectedPrompt.promptId === item.promptId,
                }"
                @click="selectedPrompt = item"
              >
                <div class="name">
                  <p>{{ item.name }}</p>
                  <div class="operate-button">
                    <el-tooltip content="编辑" placement="top">
                      <img
                        src="@/assets/svgs/light_editor.svg"
                        alt=""
                        @click.stop="onEditClick(item)"
                      />
                    </el-tooltip>
                    <el-tooltip content="删除" placement="top">
                      <img
                        src="@/assets/svgs/light_delete.svg"
                        alt=""
                        @click="onDeleteClick(item)"
                      />
                    </el-tooltip>
                  </div>
                </div>
                <p class="description">{{ item.description }}</p>
              </div>
            </template>
          </div>
          <div class="prompt-preview">
            <p class="prompt-preview__title">系统配置区：</p>
            <div class="prompt-preview__content">
              {{ selectedPrompt.prompt }}
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="emits('update:visible', false)">关闭</el-button>
        <el-button type="primary" @click="emits('confirm', selectedPrompt)">
          确认
        </el-button>
      </template>
    </el-drawer>

    <NewOrEditPrompt
      v-model:visible="isNewPromptVisible"
      :prompt="toBeEditPrompt"
      :title="toBeEditPrompt ? '编辑提示词' : '新建提示词'"
    />
  </div>
</template>
<style lang="scss" scoped>
.prompt-drawer {
  :deep(.el-drawer) {
    .el-drawer__header {
      color: #000;
      font-weight: 700;
      padding: 24px 24px 0px 24px;
      margin: 0;
    }
    .el-drawer__body {
      padding: 0 24px;
    }
    .el-drawer__footer {
      padding: 0;
      padding: 8px 24px;
      box-shadow: 0 -8px 16px rgba(0, 0, 0, 0.1);
    }
  }

  .wrapper {
    height: calc(100vh - 140px);
    display: flex;
    flex-direction: column;
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #000;
      p {
        font-size: 16px;
        font-weight: 700;
      }
    }

    .search {
      margin-top: 16px;
      display: flex;
      gap: 16px;
      .el-input > .el-input__wrapper {
        --o-input-border-radius: 4px;
      }
      .el-textarea {
        --o-textarea-border-radius: 4px;
      }
    }

    .prompt-wrapper {
      height: 100%;
      display: flex;
      margin-top: 16px;
      gap: 16px;

      .prompt-list {
        padding: 2px;
        overflow: scroll;
        scrollbar-width: none;
        -ms-overflow-style: none;
        display: flex;
        flex-direction: column;
        gap: 6px;
        width: 240px;
        .prompt-item {
          padding: 16px;
          border-radius: 4px;
          background-color: var(--el-collapse-header-bg);
          cursor: pointer;

          &:hover {
            outline: 2px solid rgb(99, 149, 253);

            .name > .operate-button {
              display: flex;
              gap: 4px;
            }
          }

          .name {
            font-size: 14px;
            font-weight: 700;
            color: #000;
            display: flex;
            justify-content: space-between;
            align-items: center;
            p {
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .operate-button {
              display: none;
            }
          }

          .description {
            margin-top: 8px;
            font-size: 12px;
            color: rgb(78, 88, 101);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }
        .prompt-item__active {
          outline: 2px solid rgb(99, 149, 253);
        }
      }

      .prompt-preview {
        flex: 1;
        border-radius: 4px;
        border: 1px solid rgb(223, 229, 239);
        padding: 16px;
        &__title {
          font-size: 14px;
          color: #000;
        }
        &__content {
          flex: 1;
          margin-top: 8px;
          font-size: 12px;
          color: rgb(78, 88, 101);
          white-space: pre-wrap;
          word-break: break-all;
        }
      }
    }
  }
}
</style>

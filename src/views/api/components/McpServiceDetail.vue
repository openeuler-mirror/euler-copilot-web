<script lang="ts" setup>
import { CaretRight } from '@element-plus/icons-vue';
import { ref, watch } from 'vue';
import { api } from '@/apis';
import defaultIcon from '@/assets/svgs/app_upload.svg';

interface McpDetail {
  serviceId: string;
  icon: string;
  name: string;
  description: string;
  data: {
    transmitProto: 'Stdio' | 'Streamable' | 'SSE';
    config: string;
  };
  tools: {
    name: string;
    description: string;
    input_args: {
      name: string;
      description: string;
      type: string;
    }[];
    output_args: {
      name: string;
      description: string;
      type: string;
    }[];
  }[];
}

const props = defineProps<{
  visible: boolean;
  serviceId: string;
}>();

const emits = defineEmits<{
  (e: 'update:visible', visible: boolean): void;
}>();

const activeTab = ref<'description' | 'tools'>('description');

const mcpServiceDetail = ref<McpDetail>();

const activeNames = ref([]);

async function getMcpServiceDetail(serviceId: string) {
  const [_, res] = await api.getMcpServiceDetail(serviceId);
  if (res) {
    mcpServiceDetail.value = res.result;
  }
}

watch(
  () => props.visible,
  () => {
    if (props.visible) {
      if (!props.serviceId) return;
      getMcpServiceDetail(props.serviceId);
    }
  },
);
</script>
<template>
  <div class="mcp-drawer">
    <el-drawer
      size="700"
      :model-value="visible"
      title="服务详情"
      @close="emits('update:visible', false)"
    >
      <div class="content" v-if="mcpServiceDetail">
        <div class="overview">
          <img :src="mcpServiceDetail.icon || defaultIcon" alt="" />
          <div class="overview-text">
            <p class="name">{{ mcpServiceDetail.name }}</p>
            <p class="desc">{{ mcpServiceDetail.description }}</p>
          </div>
        </div>

        <div class="detail">
          <el-tabs v-model="activeTab" class="settings-tabs">
            <el-tab-pane label="描述" name="description" :lazy="true">
              <div class="description">
                {{ mcpServiceDetail.description }}
              </div>
            </el-tab-pane>
            <el-tab-pane label="工具" name="tools" :lazy="true">
              <div class="tool" v-for="tool in mcpServiceDetail.tools">
                <p class="tool_name">{{ tool.name }}</p>
                <span class="tool-description">
                  {{ tool.description }}
                </span>
                <el-collapse v-model="activeNames">
                  <el-collapse-item name="regeocode" :icon="CaretRight">
                    <template #title>
                      <span class="collapse-title">工具入参</span>
                    </template>
                    <div
                      class="tool-parameter"
                      v-for="(args, idx) in tool.input_args"
                      :key="idx"
                    >
                      <div class="tool-parameter__key-value">
                        <span class="key">{{ args.name }}</span>
                        <span class="type">{{ args.type }}</span>
                      </div>
                      <span class="tool-parameter__introduction">
                        {{ args.description }}
                      </span>
                    </div>
                  </el-collapse-item>
                  <el-collapse-item name="geocode" :icon="CaretRight">
                    <template #title>
                      <span class="collapse-title">工具出参</span>
                    </template>

                    <div
                      class="tool-parameter"
                      v-for="(args, idx) in tool.input_args"
                      :key="idx"
                    >
                      <div class="tool-parameter__key-value">
                        <span class="key">{{ args.name }}</span>
                        <span class="type">{{ args.type }}</span>
                      </div>
                      <span class="tool-parameter__introduction">
                        {{ args.description }}
                      </span>
                    </div>
                  </el-collapse-item>
                </el-collapse>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
      <template #footer>
        <el-button @click="emits('update:visible', false)">关闭</el-button>
      </template>
    </el-drawer>
  </div>
</template>
<style lang="scss" scoped>
.content {
  height: calc(100% - 24px);
  margin-top: 16px;
  .overview {
    display: flex;
    align-items: center;
    gap: 16px;
    &-text {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    img {
      width: 48px;
      height: 48px;
      border-radius: 50%;
    }
    .name {
      font-size: 16px;
      font-weight: 700;
      line-height: 24px;
    }
    .desc {
      max-width: 550px;
      font-size: 14px;
      line-height: 22px;
      font-weight: 400;
      color: rgb(78, 88, 101);
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
  }
  .detail {
    margin-top: 16px;
    height: calc(100% - 40px);
    .settings-tabs {
      height: 100%;

      --o-tabs-font-size: 14px;
      --o-tabs-item-padding: 5px 16px 0 5px;
      --o-tabs-line-height: 32px;
      --o-tabs-color_active: rgb(99, 149, 253);
      --o-text-color-secondary: #000;

      .description {
        height: 100%;
        overflow: scroll;
        line-height: 22px;
        font-weight: 400;
        color: rgb(78, 88, 101);
      }

      :deep(.el-tabs__content) {
        padding: 8px 0;
        height: 100%;
        .el-tab-pane {
          height: 100%;
        }
      }
      :deep(.el-tab-pane) {
        overflow: scroll;
        scrollbar-width: none;
        -ms-overflow-style: none;
      }

      .tool {
        --c-collapse-bg: rgb(244, 246, 250);
        padding: 16px;
        border-radius: 4px;
        background-color: var(--c-collapse-bg);
        &:not(:first-child) {
          margin-top: 8px;
        }

        &_name {
          font-size: 14px;
          font-weight: 500;
          line-height: 22px;
        }

        &-description {
          font-size: 12px;
          line-height: 16px;
          font-weight: 400;
          color: rgb(78, 88, 101);
        }

        :deep(.el-collapse) {
          margin-top: 8px;

          .tool-parameter {
            display: flex;
            flex-direction: column;
            &__key-value {
              display: flex;
              align-items: center;
              gap: 8px;
              font-size: 12px;
              font-weight: 400;
              line-height: 16px;
              padding: 8px 0 4px 0;
              .key {
                color: #000;
              }
              .type {
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 0 8px;
                background-color: rgb(195, 206, 223);
                border-radius: 2px;
                font-weight: 500;
              }
            }

            &__introduction {
              font-size: 12px;
              line-height: 16px;
              font-weight: 400;
              color: rgb(141, 151, 170);
            }
          }

          .collapse-title {
            display: flex;
            justify-content: start;
            flex: 1 0 90%;
            order: 1;
          }
          .el-collapse-item__header {
            background-color: var(--c-collapse-bg);
            padding: 0;
            flex: 1 0 auto;
            order: -1;
            height: 32px;
            border-bottom: 1px solid rgb(230, 230, 230);
            border-radius: 0;
          }
          .el-collapse-item__wrap {
            background-color: var(--c-collapse-bg);
          }
          .el-collapse-item__content {
            background-color: var(--c-collapse-bg);
            margin-bottom: 0px;
          }
        }
      }
    }
  }
}
.mcp-drawer {
  :deep(.el-drawer) {
    .el-drawer__header {
      color: #000;
      font-weight: 700;
      padding: 24px 24px 16px 24px;
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
}
</style>

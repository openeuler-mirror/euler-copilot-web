<script lang="ts" setup>
import { CaretRight } from '@element-plus/icons-vue';
import { computed, ref, watch } from 'vue';
import { api } from '@/apis';
import defaultIcon from '@/assets/svgs/app_upload.svg';
import lightNull from '@/assets/svgs/light_null.svg';
import DarkNull from '@/assets/svgs/dark_null.svg';
import { ElEmpty } from 'element-plus';
import i18n from 'src/i18n';
import { useChangeThemeStore } from '@/store';
import { storeToRefs } from 'pinia';
import marked from '@/utils/marked';

interface McpDetail {
  serviceId: string;
  icon: string;
  name: string;
  overview: string;
  description: string;
  data: string;
  mcpType: string;
  tools: {
    id: string;
    name: string;
    description: string;
    mcp_id: string;
    input_schema: {
      properties: {
        [key: string]: {
          description: string;
          type: string;
        };
      };
    };
    output_schema: {
      properties: {
        [key: string]: {
          description: string;
          type: string;
        };
      };
    };
  }[];
}

const props = defineProps<{
  visible: boolean;
  serviceId: string;
}>();

const emits = defineEmits<{
  (e: 'update:visible', visible: boolean): void;
}>();

const { t } = i18n.global;

const { theme } = storeToRefs(useChangeThemeStore());

const emptyImg = computed(() =>
  theme.value === 'light' ? lightNull : DarkNull,
);

const activeTab = ref<'description' | 'tools'>('description');

const mcpServiceDetail = ref<McpDetail>();

const activeNames = ref<string[]>([]);

async function getMcpServiceDetail(serviceId: string) {
  const [, res] = await api.getMcpServiceDetail(serviceId);
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
    } else {
      mcpServiceDetail.value = undefined;
      activeTab.value = 'description';
    }
  },
);
</script>
<template>
  <div class="mcp-drawer">
    <el-drawer
      size="700"
      :model-value="visible"
      destroy-on-close
      :title="t('plugin_center.server_detail')"
      @close="emits('update:visible', false)"
    >
      <div class="content" v-if="mcpServiceDetail">
        <div class="overview">
          <img :src="mcpServiceDetail.icon || defaultIcon" alt="" />
          <div class="overview-text">
            <p class="name">{{ mcpServiceDetail.name }}</p>
            <p class="brief-description">
              {{
                mcpServiceDetail.overview ||
                t('plugin_center.no_brief_description_yet')
              }}
            </p>
          </div>
        </div>

        <div class="detail">
          <el-tabs v-model="activeTab" class="settings-tabs">
            <el-tab-pane
              :label="t('plugin_center.server_description')"
              name="description"
              :lazy="true"
            >
              <div
                class="description"
                v-html="marked.parse(mcpServiceDetail.description)"
              ></div>
            </el-tab-pane>
            <el-tab-pane
              :label="t('plugin_center.server_tool')"
              name="tools"
              :lazy="true"
            >
              <div v-if="mcpServiceDetail.tools.length">
                <div
                  class="tool"
                  v-for="tool in mcpServiceDetail.tools"
                  :key="tool.id"
                >
                  <p class="tool_name">{{ tool.name }}</p>
                  <span class="tool-description">
                    {{ tool.description }}
                  </span>
                  <el-collapse v-model="activeNames">
                    <el-collapse-item :name="`${tool.name}-regeocode`">
                      <template #title>
                        <span class="collapse-title">
                          {{ t('plugin_center.tool_input_schema') }}
                        </span>
                        <el-icon
                          class="collapse-icon"
                          :class="{
                            'collapse-icon-active': activeNames.includes(
                              `${tool.name}-regeocode`,
                            ),
                          }"
                        >
                          <CaretRight />
                        </el-icon>
                      </template>
                      <div
                        class="tool-parameter"
                        v-for="(args, key, idx) in tool.input_schema.properties"
                        :key="idx"
                      >
                        <div class="tool-parameter__key-value">
                          <span class="key">{{ key }}</span>
                          <span class="type">{{ args.type }}</span>
                        </div>
                        <span class="tool-parameter__introduction">
                          {{ args.description }}
                        </span>
                      </div>
                    </el-collapse-item>
                    <el-collapse-item
                      :name="`${tool.name}-geocode`"
                      v-if="tool.output_schema"
                    >
                      <template #title>
                        <span class="collapse-title">
                          {{ t('plugin_center.tool_output_schema') }}
                        </span>
                        <el-icon
                          class="collapse-icon"
                          :class="{
                            'collapse-icon-active': activeNames.includes(
                              `${tool.name}-geocode`,
                            ),
                          }"
                        >
                          <CaretRight />
                        </el-icon>
                      </template>

                      <div
                        class="tool-parameter"
                        v-for="(args, key, idx) in tool.output_schema
                          .properties"
                        :key="idx"
                      >
                        <div class="tool-parameter__key-value">
                          <span class="key">{{ key }}</span>
                          <span class="type">{{ args.type }}</span>
                        </div>
                        <span class="tool-parameter__introduction">
                          {{ args.description }}
                        </span>
                      </div>
                    </el-collapse-item>
                  </el-collapse>
                </div>
              </div>

              <ElEmpty
                v-else
                :image="emptyImg"
                :description="$t('common.null')"
                style="height: 100%"
              />
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
      <template #footer>
        <el-button @click="emits('update:visible', false)">
          {{ t('common.close') }}
        </el-button>
      </template>
    </el-drawer>
  </div>
</template>
<style lang="scss" scoped>
.content {
  height: calc(100% - 24px);
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
      color: var(--o-text-color-primary);
    }
    .brief-description {
      max-width: 550px;
      margin-top: 8px;
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
    margin-top: 22px;
    height: calc(100% - 40px);
    .settings-tabs {
      height: 100%;

      --o-tabs-font-size: 14px;
      --o-tabs-item-padding: 5px 16px 0 5px;
      --o-tabs-line-height: 32px;
      --o-tabs-color_active: rgb(99, 149, 253);
      --o-tabs-item-max-width: none;

      .description {
        height: 100%;
        overflow: scroll;
        word-break: break-all;
      }

      :deep(.description) {
        h1:not(:first-child),
        h2:not(:first-child),
        h3:not(:first-child),
        h4:not(:first-child),
        h5:not(:first-child),
        h6:not(:first-child) {
          margin-top: 16px;
        }
        p {
          font-size: 12px;
          line-height: 16px;
          color: rgb(78, 88, 101);
        }
        p:not(:first-child) {
          margin-top: 8px;
        }
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
        --c-collapse-bg: var(--el-collapse-header-bg);
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
          margin-bottom: 8px;
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
            font-size: 12px;
            color: var(--o-text-color-primary);
          }
          .collapse-icon{
            margin-right: 8px !important;
          }
          .collapse-icon-active{
            transform: rotate(90deg);
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
</style>

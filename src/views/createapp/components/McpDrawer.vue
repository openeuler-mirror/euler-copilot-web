<script lang="ts" setup>
import { Search } from '@element-plus/icons-vue';
import { ref, onMounted, watch } from 'vue';
import { api } from '@/apis';
import { ElMessage } from 'element-plus';
import i18n from '@/i18n';

const { t } = i18n.global;

export interface Mcp {
  mcpserviceId: string;
  icon: string;
  name: string;
  author: string;
  description: string;
}

interface McpWithChecked extends Mcp {
  isChecked: boolean;
}

const props = withDefaults(
  defineProps<{
    visible: boolean;
    checkedList?: string[];
  }>(),
  {
    visible: false,
    checkedList: () => [],
  },
);

const emits = defineEmits<{
  (e: 'update:visible', visible: boolean): void;
  (e: 'confirm', mcpList: Mcp[]): void;
}>();

const mcpList = ref<McpWithChecked[]>([]);

const searchKeyword = ref();

/**
 * 查询MCP服务
 */
async function queryMcpList() {
  const [, res] = await api.getMcpList({
    keyword: searchKeyword.value,
  });
  if (res) {
    mcpList.value = res.result.services
      .filter((mcp) => mcp.isActive)
      .map((item) => {
        return {
          ...item,
          isChecked: false,
        };
      });
  }
}

function onMcpItemClick(item: McpWithChecked) {
  item.isChecked = !item.isChecked;
}

function onConfirm() {
  const checkedMcpList = mcpList.value.filter((item) => item.isChecked);
  if (checkedMcpList.length > 5) {
    ElMessage.error(t('semantic.max_select_mcp_server', { num: 5 }));
    return;
  }
  emits('confirm', checkedMcpList);
}

watch(
  () => props.checkedList,
  () => {
    mcpList.value = mcpList.value.map((item) => {
      return {
        ...item,
        isChecked: props.checkedList.includes(item.mcpserviceId),
      };
    });
  },
);

onMounted(() => {
  queryMcpList();
});
</script>
<template>
  <div class="prompt-drawer">
    <el-drawer
      size="700"
      :title="t('semantic.mcp_service')"
      :model-value="visible"
      @close="emits('update:visible', false)"
    >
      <div class="wrapper">
        <div class="search">
          <el-input
            v-model="searchKeyword"
            type="search"
            :placeholder="t('common.search')"
            :suffix-icon="Search"
            @change="queryMcpList"
          ></el-input>
        </div>

        <div class="mcp-list">
          <template v-for="item in mcpList" :key="item.id">
            <div class="mcp-item" @click="onMcpItemClick(item)">
              <el-checkbox v-model="item.isChecked" @click.stop />
              <img :src="item.icon" alt="" />
              <div>
                <p>{{ item.name }}</p>
                <p>{{ item.description }}</p>
              </div>
            </div>
          </template>
        </div>
      </div>

      <template #footer>
        <el-button @click="emits('update:visible', false)">
          {{ t('common.cancel') }}
        </el-button>
        <el-button type="primary" @click="onConfirm">
          {{ t('common.confirm') }}
        </el-button>
      </template>
    </el-drawer>
  </div>
</template>
<style lang="scss" scoped>
.prompt-drawer {
  :deep(.el-drawer) {
    top: 48px;
    height: calc(100vh - 48px);
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

  .wrapper {
    height: calc(100vh - 160px);
    display: flex;
    flex-direction: column;

    .mcp-list {
      flex: 1;
      overflow: scroll;
      scrollbar-width: none;
      -ms-overflow-style: none;
      display: flex;
      flex-direction: column;
      margin: 16px 0;
      gap: 8px;
      .mcp-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 16px;
        background-color: var(--el-collapse-header-bg);
        border-radius: 4px;
        cursor: pointer;

        p {
          max-width: 550px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        img {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          margin-left: 6px;
        }
      }
    }
  }
}
</style>

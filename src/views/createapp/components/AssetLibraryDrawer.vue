<script lang="ts" setup>
import { CaretRight, Search } from '@element-plus/icons-vue';
import { ref, onMounted } from 'vue';
import { api } from '@/apis';
import type { KnowledgeBase } from '@/apis/appCenter/knowledge';
import { ElMessage } from 'element-plus';

defineProps<{
  visible: boolean;
}>();

const emits = defineEmits<{
  (e: 'update:visible', visible: boolean): void;
  (e: 'confirm', checkedKbList: KnowledgeBase[]): void;
}>();

const searchKeyword = ref();
const tkbList = ref<
  {
    teamId: string;
    teamName: string;
    kbList: (KnowledgeBase & { isChecked: boolean })[];
  }[]
>([]);

async function queryKbList() {
  const [, res] = await api.getKnowledgeList(searchKeyword.value);
  if (res) {
    tkbList.value = res.result.team_kb_list.map((item) => ({
      ...item,
      kbList: item.kb_list.map((item) => ({
        ...item,
        isChecked: false,
      })),
    }));
    activeCollapse.value = tkbList.value.map((item) => item.teamName);
  }
}

const activeCollapse = ref<string[]>([]);

function onConfirm() {
  const checkedKbList = tkbList.value
    .flatMap((item) => item.kbList)
    .filter((item) => item.isChecked);
  if (checkedKbList.length > 5) {
    ElMessage.error('最多只能选择5个知识库');
    return;
  }
  emits('confirm', checkedKbList);
}

onMounted(() => {
  queryKbList();
});
</script>
<template>
  <div class="asset-drawer">
    <el-drawer
      size="700"
      title="知识库"
      :model-value="visible"
      @close="emits('update:visible', false)"
    >
      <div class="wrapper">
        <div class="search">
          <el-input
            v-model="searchKeyword"
            type="search"
            placeholder="搜索"
            :suffix-icon="Search"
          ></el-input>
        </div>

        <el-collapse v-model="activeCollapse">
          <div v-for="item in tkbList" :key="item.teamId">
            <el-collapse-item :name="item.teamName">
              <template #title>
                <el-icon
                  class="collapse-icon"
                  size="12"
                  :class="{
                    'collapse-icon-active': activeCollapse.includes(
                      item.teamName,
                    ),
                  }"
                >
                  <CaretRight />
                </el-icon>
                <div class="collapse-title">{{ item.teamName }}</div>
              </template>
              <div class="asset-list">
                <div
                  class="asset-item"
                  v-for="kb in item.kbList"
                  :key="kb.kbId"
                >
                  <el-checkbox class="kb-checkbox" v-model="kb.isChecked" />
                  <div class="kb-content">
                    <p class="name">{{ kb.name }}</p>
                    <p class="desc">{{ kb.description }}</p>
                    <p class="id">ID: {{ kb.kbId }}</p>
                  </div>
                </div>
              </div>
            </el-collapse-item>
          </div>
        </el-collapse>
      </div>

      <template #footer>
        <el-button @click="emits('update:visible', false)">关闭</el-button>
        <el-button type="primary" @click="onConfirm">确认</el-button>
      </template>
    </el-drawer>
  </div>
</template>
<style lang="scss" scoped>
.asset-drawer {
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

  .collapse-title {
    margin-left: 6px;
    height: 100%;
    line-height: 24px;
  }

  .collapse-icon {
    &-active {
      transform: rotate(90deg);
    }
  }

  .wrapper {
    height: calc(100vh - 160px);
    display: flex;
    flex-direction: column;

    .search {
      .el-input > .el-input__wrapper {
        --o-input-border-radius: 4px;
      }

      margin-bottom: 16px;
    }
    .asset-list {
      width: 100%;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      overflow: scroll;
      margin-top: 8px;

      .asset-item {
        display: flex;
        align-items: start;
        background-color: red;
        padding: 11px 16px;
        background-color: var(--el-collapse-header-bg);
        border-radius: 4px;
        gap: 5px;

        .kb-content {
          display: flex;
          flex-direction: column;
          gap: 5px;
          margin-top: 5px;

          .desc {
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .name {
            font-size: 14px;
            font-weight: 700;
            color: var(--o-text-color-primary);
            max-width: 250px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }
      }
    }
  }
}
</style>

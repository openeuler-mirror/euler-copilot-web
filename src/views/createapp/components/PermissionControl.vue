<script lang="ts" setup>
import { Search } from '@element-plus/icons-vue';
import { computed, ref } from 'vue';

type PermissionType = 'public' | 'private' | 'protected';

const props = defineProps<{
  visibility: PermissionType;
  checkedList: string[];
  optionalList: {
    key: string;
    label: string;
  }[];
}>();

const emits = defineEmits<{
  (e: 'update:visibility', visibility: PermissionType): void;
  (e: 'update:checkedList', checkedList: string[]): void;
}>();

const permissionTypeList = [
  {
    label: '公开（所有人可见）',
    value: 'public',
  },
  {
    label: '私密（仅自己可见）',
    value: 'private',
  },
  {
    label: '部分人可见',
    value: 'protected',
  },
];

const searchKeyword = ref('');
const checkedUserList = computed(() =>
  props.optionalList.filter((item) => props.checkedList.includes(item.key)),
);

function onCheckChange(value: string[]) {
  emits('update:checkedList', value);
}

const filteredOptionalList = computed(() => {
  if (!searchKeyword.value) {
    return props.optionalList;
  }
  return props.optionalList.filter((item) =>
    item.label.includes(searchKeyword.value),
  );
});
</script>
<template>
  <div class="permission-control">
    <el-radio-group
      class="permission-control__radio"
      :model-value="visibility"
      @change="(value: PermissionType) => emits('update:visibility', value)"
    >
      <el-radio
        v-for="(item, index) in permissionTypeList"
        :key="index"
        :value="item.value"
      >
        {{ item.label }}
      </el-radio>
    </el-radio-group>

    <div
      v-if="visibility === 'protected'"
      class="protected-permission-selector"
    >
      <div class="optional-user">
        <div class="title">
          <div class="label">可选</div>
          <div class="count">{{ optionalList.length }}</div>
        </div>
        <el-input
          v-model="searchKeyword"
          class="user-input"
          placeholder="搜索用户"
          type="search"
          :suffix-icon="Search"
        ></el-input>

        <el-checkbox-group
          class="user-checkbox"
          :model-value="checkedList"
          @change="onCheckChange"
        >
          <el-checkbox
            v-for="(item, index) in filteredOptionalList"
            :key="index"
            :value="item.key"
          >
            <span class="circle"></span>
            {{ item.label }}
          </el-checkbox>
        </el-checkbox-group>
      </div>
      <div class="selected-user">
        <div class="title">
          <div class="label">已选</div>
          <div class="count">{{ checkedList.length }}</div>
        </div>

        <el-checkbox-group
          class="user-checkbox"
          :model-value="checkedList"
          @change="onCheckChange"
        >
          <el-checkbox
            v-for="(item, index) in checkedUserList"
            :key="index"
            :value="item.key"
          >
            <span class="circle"></span>
            {{ item.label }}
          </el-checkbox>
        </el-checkbox-group>
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.permission-control {
  :deep(.el-radio-group) {
    .el-radio {
      margin-right: 22px;
    }
  }

  .protected-permission-selector {
    display: flex;
    gap: 4px;
  }

  .optional-user,
  .selected-user {
    width: calc(50% - 2px);
    background-color: var(--o-bash-bg);
    padding: 16px 0 16px 16px;
    border-radius: 4px;
    height: 292px;
    .title {
      display: flex;
      gap: 12px;
      font-size: 12px;
      font-weight: bolder;
      margin-bottom: 16px;

      .label {
        height: 16px;
        line-height: 16px;
      }
      .count {
        padding: 0 4px;
        min-width: 28px;
        background-color: var(--o-time-text);
        border-radius: 8px;
        text-align: center;
        height: 16px;
        line-height: 16px;
      }
    }

    .user-input {
      padding-right: 16px;
    }

    .user-checkbox {
      margin-top: 16px;
      max-height: 180px;
      overflow: auto;
      display: flex;
      flex-direction: column;
      gap: 16px;

      .el-checkbox {
        height: 16px;
      }
    }
  }
  .selected-user {
    .user-checkbox {
      max-height: 230px;
    }
  }
}
</style>

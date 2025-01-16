<script lang="ts" setup>
import { TOOL_LIST, HOT_SPOT_TRACKING, FRIENDS_CHAIN } from '../constants';
import type { LinkItem, ChainItem } from '../types';
import { ref } from 'vue';
/**
 * 处理工具栏点击事件
 * @param tool
 */
const dialogFormVisible = ref(false);

const handleToolClick = (tool: LinkItem) => {
  if (tool.type === 'redirect') {
    window.open(tool.url);
  }
  if (tool.key === 'opinion') {
    dialogFormVisible.value = true;
  }
};
const handleChainClick = (tool: ChainItem) => {
  if (tool.type === 'redirect') {
    window.open(tool.url);
  }
  if (tool.key === 'opinion') {
    dialogFormVisible.value = true;
  }
};
</script>
<template>
  <div class="dialog-tool">
    <h4 class="dialog-tool__title">常用工具</h4>
    <ul class="tool-list">
      <template v-for="tool in TOOL_LIST" :key="tool.key">
        <li class="tool-list__item" @click="handleToolClick(tool)">
          <img :src="tool.icon" />
          <span>{{ tool.label }}</span>
        </li>
      </template>
    </ul>
    <h4 class="dialog-tool__title">热点搭配方案</h4>
    <ul class="hot-list">
      <template v-for="hot in HOT_SPOT_TRACKING" :key="hot.key">
        <li class="hot-list__item" @click="handleToolClick(hot)">{{ hot.label }}</li>
      </template>
    </ul>
    <h4 class="dialog-tool__title">友情链接</h4>
    <ul class="chain-list">
      <template v-for="chain in FRIENDS_CHAIN" :key="chain.key">
        <li class="chain-list__item" @click="handleChainClick(chain)">
          <img class="chain-list__img" :src="chain.icon" />
          <span class="chain-list__item"> {{ chain.label }}</span>
        </li>
      </template>
    </ul>
  </div>
</template>

<style lang="scss" scoped>
:deep(.my-dialog .el-dialog__header) {
  margin-right: 0px;
  border-radius: 4px 4px 0 0;
  padding: 15px 20px 15px 20px;
  .el-dialog__title {
    font-size: 16px;
    line-height: 25px;
    font-weight: 800;
  }
  .el-dialog__headerbtn {
    top: 0px;
  }
}
:deep(.my-dialog .el-dialog__body) {
  padding: 24px 24px 32px 24px;
}

:deep(.my-dialog .el-dialog__footer) {
  padding: 0px 24px 24px 24px;
}
.el-button--text {
  margin-right: 15px;
}

.el-input {
  width: 300px;
}

.dialog-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;

  button {
    width: 64px;
    height: 24px;
    border-radius: 1;
    font-size: 12px;
  }
}

:deep(.el-rate__icon) {
  font-size: 21px;
  color: #fa8c16;
}

.from-rate {
  &_span {
    display: block;
    font-size: 14px;
  }
  &_score {
    display: flex;
    margin-bottom: 10px;
  }
}

.form-input_email {
  width: 100%;
  font-size: 12px;
  height: 32px;
  border: 1px #c3cedf;
  border-radius: 2px;
}

.dialog-footer button:first-child {
  margin-right: 8px;
}
.dialog-footer button {
  font-size: 12px;
  border-radius: 2px;
}

.feedback-form {
  margin: 0px;
  div:last-child {
    margin-bottom: 0px;
  }
  &_item {
    margin-bottom: 24px;
  }
}

.dialog-tool {
  width: 280px;
  min-width: 200px;
  background-color: var(--o-bg-color-base);
  padding: 0 24px;
  border-radius: 8px;

  @media screen and (max-width: 1368px) and (max-height: 768px) {
    width: 260px;
  }
  padding-top: 0px;
  &__title {
    margin: 24px 0 16px 0;
    font-weight: 700;
  }
  h4 {
    font-size: 20px;
    color: var(--o-text-color-primary);
    font-weight: 500;
    line-height: 30px;
  }

  .tool-list {
    display: flex;
    &__item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background-color: var(--o-bg-color-light);
      height: 90px;
      width: 124px;
      font-size: 14px;
      border-radius: 8px;
      margin-right: 16px;
      img {
        height: 40px;
      }

      span {
        line-height: 22px;
        color: var(--o-text-color-secondary);
      }

      &:hover {
        background-color: transparent;
        background-image: linear-gradient(to right, rgba(109, 117, 250, 0.2), rgba(90, 179, 255, 0.2));
        border: 1px solid #7aa5ff;
      }
    }
  }

  .hot-list {
    &__item {
      font-size: 14px;
      margin-top: 16px;
      color: var(--o-text-color-secondary);
      &:hover {
        text-decoration: underline;
        color: #3291fe;
      }
      &:active {
        color: #0077ff;
      }
    }
  }

  .chain-list {
    &__item {
      font-size: 14px;
      color: var(--o-text-color-secondary);
      &:hover {
        text-decoration: underline;
        color: #3291fe;
      }

      &:active {
        color: #0077ff;
      }

      img {
        width: 32px;
        height: 20px;
        bottom: 1.5px;
        position: relative;
        margin-right: 4px;
        vertical-align: top;
      }
    }
  }
}
</style>

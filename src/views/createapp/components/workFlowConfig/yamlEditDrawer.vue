<template>
  <div class="configYaml">
    <el-drawer
      v-model="visible"
      :show-close="false"
      :wrapperClosable="false"
      :modal="true"
      class="flowDrawer"
    >
      <template #header>
        <div class="drawerHeader">步骤配置-LLM</div>
      </template>
      <template #default>
        <div class="drawerBody">
          <MirrorText ref="textarea" v-model:updateVal="yamlCode"></MirrorText>
        </div>
      </template>
      <template #footer>
        <div class="drawerFooter">
          <el-button @click="closeDrawer">关闭</el-button>
          <el-button type="primary" @click="closeDrawer">完成</el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>
<script lang="ts" setup>
import { ref } from 'vue';
import MirrorText from '../codeMirror/mirrorTextArea.vue';
const visible = ref(true);
const yamlCode = ref();
const emits = defineEmits(['closeDrawer']);
const closeDrawer = () => {
  emits('closeDrawer');
};
</script>

<style lang="scss">
.flowDrawer {
  padding: 0px;
  background-color: var(--o-bg-color-base);
  .el-drawer__header {
    padding: 24px 24px 16px;
    margin-bottom: 0px;
    .drawerHeader {
      width: 100%;
      height: 24px;
      line-height: 24px;
      color: var(--o-text-color-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
  .el-drawer__body {
    padding: 0px 24px 16px;
    .drawerBody {
      height: 100%;
      textarea {
        width: 100%;
        height: 100%;
      }
    }
  }
  .el-drawer__footer {
    box-shadow: 0px -4px 10px 0px rgba(0, 0, 0, 0.1);
    padding: 0px 24px;
    height: 48px;
    line-height: 47px;
  }
}
</style>

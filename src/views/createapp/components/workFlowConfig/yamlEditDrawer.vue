<template>
  <div class="configYaml">
    <el-drawer
      v-model="visible"
      :show-close="false"
      :wrapperClosable="false"
      :modal="true"
      class="flowDrawer"
      :before-close="closeDrawer"
    >
      <template #header>
        <div class="drawerHeader">步骤配置-{{ yamlNodeName }}</div>
      </template>
      <template #default>
        <div class="drawerBody">
          <el-collapse v-model="activeName" class="o-hpc-collapse yamlContent">
            <el-collapse-item title="Consistency" :key="item.title" :name="item.title" v-for="item in yamlExpress">
              <template #title>
                <el-icon class="el-collapse-item__arrow" :class="{ 'is-active': activeName.includes(item.title) }">
                  <IconCaretRight />
                </el-icon>
                <span>{{ item.title }}</span>
              </template>

              <MirrorText
                ref="textarea"
                v-model:updateVal="item.yamlCode"
                :yamlCode="item.yamlCode"
                :disabled="item.disabled"
              ></MirrorText>
            </el-collapse-item>
          </el-collapse>
        </div>
      </template>
      <template #footer>
        <div class="drawerFooter">
          <el-button @click="closeDrawer">关闭</el-button>
          <el-button type="primary" @click="updateNodeYaml">完成</el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>
<script lang="ts" setup>
import { ref, watch, defineProps } from 'vue';
import MirrorText from '../codeMirror/mirrorTextArea.vue';
import { IconCaretRight } from '@computing/opendesign-icons';
import yaml from 'js-yaml';
import { ElMessage } from 'element-plus';
const visible = ref(true);
const yamlInputCode = ref();
const yamlOutputCode = ref();
const yamlNodeName = ref();
const yamlExpress = ref([
  {
    title: '输入内容',
    yamlCode: '',
    disabled: false,
  },
  {
    title: '输出内容',
    yamlCode: '',
    disabled: true,
  },
]);
const activeName = ref([yamlExpress.value[0].title, yamlExpress.value[1].title]);
const emits = defineEmits(['closeDrawer', 'saveNode']);
const props = defineProps<{
  yamlContent: any;
  nodeName: string;
  appId: any;
  flowId: any;
  nodeYamlId: any;
}>();

watch(
  () => [props.yamlContent, props.nodeName],
  () => {
    yamlInputCode.value = yaml.dump(props.yamlContent.input_parameters);
    yamlOutputCode.value = yaml.dump(props.yamlContent.output_parameters);
    yamlNodeName.value = props.nodeName;
    yamlExpress.value[0].yamlCode = yaml.dump(props.yamlContent.input_parameters);
    yamlExpress.value[1].yamlCode = yaml.dump(props.yamlContent.output_parameters);
  },
  { deep: true, immediate: true },
);
const closeDrawer = () => {
  emits('closeDrawer');
};
// 完成yaml更新
const updateNodeYaml = () => {
  let transResult;
  try {
    transResult = yaml.load(yamlExpress.value[0].yamlCode);
    // 调用接口并更新
    emits('saveNode', transResult, props.nodeYamlId);
    closeDrawer();
  } catch (error) {
    ElMessage.error('请检查格式是否正确');
  }
};
</script>

<style lang="scss">
.flowDrawer.el-drawer {
  padding: 0px;
  background-color: var(--o-bg-color-base);
  top: 48px;
  width: 700px !important;
  height: calc(100% - 48px);
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

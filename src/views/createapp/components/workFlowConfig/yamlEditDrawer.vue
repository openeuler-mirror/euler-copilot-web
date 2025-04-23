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
            <el-collapse-item
              title="Consistency"
              :key="item.title"
              :name="item.title"
              v-for="(item, index) in yamlExpress"
            >
              <template #title>
                <el-icon
                  class="el-collapse-item__arrow"
                  :class="{ 'is-active': activeName.includes(item.title) }"
                >
                  <IconCaretRight />
                </el-icon>
                <span>{{ item.title }}</span>
              </template>
              <div class="yamlMonacoEditor" v-if="item.type && index === 1">
                <MonacoEditor
                  :yamlContent="item.yamlCode"
                  placeholder="Code goes here..."
                  :handleQueryYamlValue="handleChange"
                  :readOnly="false"
                />
              </div>
              <MirrorText
                v-else-if="item.type && index !== 1"
                ref="textarea"
                class="outputYaml"
                v-model:updateVal="item.yamlCode"
                :yamlCode="item.yamlCode"
                :disabled="item.disabled"
              ></MirrorText>
              <div class="baseInfo" v-else>
                <el-form
                  ref="workFlowForm"
                  class=""
                  :model="yamlExpress[0]"
                  :rules="yamlBaseInfoRule"
                  label-position="left"
                >
                  <el-form-item prop="name" label="接口名称">
                    <el-input
                      v-model="yamlExpress[0].name"
                      placeholder="请输入"
                      maxlength="20"
                      class="o-validate-input"
                      clearable
                    ></el-input>
                  </el-form-item>
                  <el-form-item prop="description" label="接口描述">
                    <el-input
                      type="textarea"
                      show-word-limit
                      maxlength="150"
                      v-model="yamlExpress[0].description"
                      placeholder="请输入"
                      class="workFlowDesc o-validate-input"
                      clearable
                    ></el-input>
                  </el-form-item>
                </el-form>
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>
      </template>
      <template #footer>
        <div class="drawerFooter">
          <el-button @click="closeDrawer">关闭</el-button>
          <el-button
            :disabled="infoDisabled"
            type="primary"
            @click="updateNodeYaml"
          >
            完成
          </el-button>
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
import MonacoEditor from 'src/components/monaco/MonacoEditor.vue';
const visible = ref(true);
const yamlInputCode = ref();
const yamlOutputCode = ref();
const yamlNodeName = ref();
const infoDisabled = ref(true);
const yamlExpress = ref([
  {
    title: '基本信息',
    type: '',
    name: '',
    description: '',
  },
  {
    title: '输入内容',
    type: 'yamlEdit',
    yamlCode: '',
    disabled: false,
  },
  {
    title: '输出内容',
    type: 'yamlEdit',
    yamlCode: '',
    disabled: true,
  },
]);
const yamlBaseInfoRule = ref({
  name: [{ required: true, message: '请输入工作流名称', trigger: 'blur' }],
  description: [
    { required: true, message: '请输入工作流描述', trigger: 'blur' },
  ],
});
const activeName = ref([
  yamlExpress.value[0].title,
  yamlExpress.value[1].title,
  yamlExpress.value[2].title,
]);
const emits = defineEmits(['closeDrawer', 'saveNode']);
const props = defineProps<{
  yamlContent: any;
  nodeName: string;
  nodeDesc: string;
  appId: any;
  flowId: any;
  nodeYamlId: any;
}>();

watch(
  () => [props.yamlContent, props.nodeName, props.nodeDesc],
  () => {
    yamlInputCode.value = yaml.dump(props.yamlContent.input_parameters);
    yamlOutputCode.value = yaml.dump(props.yamlContent.output_parameters);
    yamlNodeName.value = props.nodeName;
    yamlExpress.value[0].name = props.nodeName;
    yamlExpress.value[0].description = props.nodeDesc;
    yamlExpress.value[1].yamlCode = yaml.dump(
      props.yamlContent.input_parameters,
    );
    yamlExpress.value[2].yamlCode = yaml.dump(
      props.yamlContent.output_parameters,
    );
  },
  { deep: true, immediate: true },
);
watch(
  () => [yamlExpress.value[0].name, yamlExpress.value[0].description],
  () => {
    if (yamlExpress.value[0].name && yamlExpress.value[0].description) {
      infoDisabled.value = false;
    } else {
      infoDisabled.value = true;
    }
  },
  { deep: true, immediate: true },
);

const handleChange = (payload) => {
  yamlExpress.value[1].yamlCode = payload;
};

const closeDrawer = () => {
  emits('closeDrawer');
};
// 完成yaml更新
const updateNodeYaml = () => {
  let transResult;
  try {
    transResult = yaml.load(yamlExpress.value[1].yamlCode);
    // 调用接口并更新--根据id包含更新后的yamlCode, name, desc
    emits(
      'saveNode',
      transResult,
      props.nodeYamlId,
      yamlExpress.value[0].name,
      yamlExpress.value[0].description,
    );
    closeDrawer();
  } catch (error) {
    ElMessage.error('请检查格式是否正确');
  }
};
</script>

<style lang="scss">
.yamlMonacoEditor{
  height:500px;
}
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
      font-weight: 700;
      font-size: 16px;
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
      .yamlContent {
        .el-collapse-item__header {
          padding: 0;
          height: 22px;
          line-height: 22px;
          margin-bottom: 8px;
          font-size: 14px;
          display: flex;
          gap: 4px;
        }
        .el-collapse-item__content {
          margin-left: 20px;
          .cm-editor {
            .cm-lineNumbers {
              .cm-gutterElement {
                min-width: 31px;
                padding-left: 0 0 0 9px;
                text-align: center;
              }
            }
            .cm-foldGutter {
              padding-left: 0;
            }
          }
          .baseInfo {
            .el-form-item {
              display: flex;
              gap: 24px;
              .el-form-item__label {
                margin-left: -8px;
                padding-right: 0px;
              }
              .el-form-item__content {
                flex: 1;
                .el-textarea__inner {
                  height: 56px;
                }
              }
            }
          }
        }
      }
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

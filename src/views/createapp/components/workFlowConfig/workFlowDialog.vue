<template>
  <el-dialog
    v-model="workFlowDiaVisible"
    @close="onCancel"
    title="新建工作流"
    class="workFlowDia"
  >
    <el-form
      ref="workFlowForm"
      class=""
      :model="workFlowData"
      :rules="workFlowRules"
      label-width="120px"
      label-position="left"
    >
      <el-form-item prop="name" label="工作流名称">
        <el-input
          v-model="workFlowData.name"
          placeholder="请输入"
          maxlength="20"
          class="w320 o-validate-input"
          clearable
        ></el-input>
      </el-form-item>
      <el-form-item prop="description" label="工作流描述">
        <el-input
          type="textarea"
          show-word-limit
          maxlength="150"
          v-model="workFlowData.description"
          placeholder="请输入"
          class="w320 workFlowDesc o-validate-input"
          clearable
        ></el-input>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button
          class="o-dlg-btn"
          type="primary"
          size="small"
          @click="handleSubmit(workFlowForm)"
        >
          确定
        </el-button>
        <el-button class="o-dlg-btn" size="small" @click="onCancel">
          取消
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import { ref } from 'vue';
import { api } from 'src/apis';
import { useRoute } from 'vue-router';
import { v4 as uuidv4 } from 'uuid';
import { ElMessage, FormInstance } from 'element-plus';
const workFlowDiaVisible = ref(true);
const route = useRoute();
const props = defineProps({
  diaType: {
    type: String,
  },
  editData: {
    type: Object,
  },
  workFlowList: {
    type: Array,
  },
});
const emits = defineEmits(['handleClose', 'createFlowId']);
const workFlowForm = ref();
const workFlowData = ref({
  name: '',
  description: '',
});
const workFlowRules = ref({
  name: [{ required: true, message: '请输入工作流名称', trigger: 'blur' }],
  description: [
    { required: true, message: '请输入工作流描述', trigger: 'blur' },
  ],
});
const onCancel = () => {
  emits('handleClose');
};
const handleSubmit = (formEl: FormInstance | undefined) => {
  // 校验必填项是否填写
  formEl?.validate((valid) => {
    if (valid) {
      // 判断是否有重复的工作流名称
      let isMultNameFlag = false;
      props.workFlowList?.forEach((flowItem) => {
        if (flowItem?.name === workFlowData.value.name) {
          isMultNameFlag = true;
        }
      });
      // 如果与已有名称重复，则提示
      if (isMultNameFlag) {
        ElMessage.warning('当前应用下已有该工作流名称，请修改名称');
        return;
      }

      // 创建工作流
      const appId = route.query?.appId;
      // 创建使用生成的flowId
      const flowId = uuidv4();
      // 调用接口新建工作流
      api
        .createOrUpdateFlowTopology(
          {
            appId: appId,
            flowId,
          },
          {
            flow: {
              name: workFlowData.value.name,
              description: workFlowData.value.description,
              enable: true,
              editable: true,
              // 创建工作流时，默认包含开始结束固定两节点，这两个节点非后端返回，其apiId与serviceId不为空即可
              nodes: [
                {
                  apiId: 'startId',
                  nodeId: 'Empty',
                  serviceId: 'start',
                  name: '开始',
                  callId: 'start',
                  description: 'startNode',
                  editable: false,
                  enable: true,
                  stepId: 'start',
                  position: {
                    x: 100,
                    y: 160,
                  },
                },
                {
                  apiId: 'endId',
                  nodeId: 'Empty',
                  serviceId: 'end',
                  name: '结束',
                  callId: 'end',
                  description: 'endNode',
                  editable: false,
                  enable: true,
                  stepId: 'end',
                  position: {
                    x: 600,
                    y: 160,
                  },
                },
              ],
              // 初始创建的工作流边为空
              edges: [],
              focusPoint: {
              x: 800,
              y: 800,
            },
            },
          },
        )
        .then((res) => {
          if (res[1]?.result?.flow) {
            ElMessage.success('创建成功');
            // 将创建成功后的flow对象传给父组件
            emits('createFlowId', { ...res[1].result.flow });
            onCancel();
          }
        });
    }
  });
};
</script>
<style lang="scss">
.workFlowDia.el-dialog {
  padding: 0px;
  width: 560px;
  .el-form {
    margin-top: 0px;
    .el-form-item {
      &:last-child {
        margin-bottom: 0px;
      }
    }
  }
}
</style>

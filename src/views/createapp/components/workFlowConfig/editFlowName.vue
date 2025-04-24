<template>
  <el-dialog
    v-model="workFlowDiaVisible"
    @close="onCancel"
    title="编辑工作流"
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
import { ref, watch} from 'vue';
import { api } from 'src/apis';
import { useRoute } from 'vue-router';
import { ElMessage, FormInstance } from 'element-plus';
const workFlowDiaVisible = ref(true);
const route = useRoute();
const props = defineProps({
  diaType: {
    type: String,
  },
  editFlowNameId: {
    type: String,
  },
  flowObj: {
    type: Object,
  },
});
const emits = defineEmits(['handleClose']);
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
const flow = ref(props.flowObj);
const onCancel = () => {
  emits('handleClose');
};
watch(() => props.flowObj,
  (val) => {
    flow.value = props.flowObj;
  },
  { immediate: true, deep: true }
);
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
      flow.value.name = workFlowData.value.name;
      flow.value.description = workFlowData.value.description;
      api.createOrUpdateApp(flow.value).then((res) => {
        console.log(res);
        if (res[1].code === 200) {
          emits('handleClose');
        }
      })
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

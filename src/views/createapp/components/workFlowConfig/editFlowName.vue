<template>
  <el-dialog
    v-model="workFlowDiaVisible"
    @close="onCancel"
    :title="$t('flow.edit_flow')"
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
      <el-form-item prop="name" :label="$t('flow.flow_name')">
        <el-input
          v-model="workFlowData.name"
          :placeholder="$t('semantic.pleaseEnter')"
          maxlength="20"
          class="w320 o-validate-input"
          clearable
        ></el-input>
      </el-form-item>
      <el-form-item prop="description" :label="$t('flow.flow_description')">
        <el-input
          type="textarea"
          show-word-limit
          maxlength="150"
          v-model="workFlowData.description"
          :placeholder="$t('semantic.pleaseEnter')"
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
          :disabled="isDisabled"
          @click="handleSubmit(workFlowForm)"
        >
          {{ $t('semantic.submit') }}
        </el-button>
        <el-button class="o-dlg-btn" size="small" @click="onCancel">
          {{ $t('semantic.cancel') }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import { ref, watch} from 'vue';
import { api } from 'src/apis';
import { ElMessage, FormInstance } from 'element-plus';
import i18n from 'src/i18n';
const workFlowDiaVisible = ref(true);
const isDisabled = ref(false);
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
  appId: {
    type: String,
  }
});
const emits = defineEmits<{
  (e: 'handleClose', flowId?: string): void;
}>();
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
  isDisabled.value = false;
  emits('handleClose',flow.value.flowId);
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
      isDisabled.value = true;
      // 判断是否有重复的工作流名称
      let isMultNameFlag = false;
      props.workFlowList?.forEach((flowItem) => {
        if (flowItem?.name === workFlowData.value.name) {
          isMultNameFlag = true;
        }
      });
      // 如果与已有名称重复，则提示
      if (isMultNameFlag) {
        ElMessage.warning(i18n.global.t('app.pleasemodifyTheName'));
        return;
      }
      flow.value.name = workFlowData.value.name;
      flow.value.description = workFlowData.value.description;
      api.createOrUpdateFlowTopology({
        appId : props.appId,
        flowId: flow.value.flowId,
      },{
        flow: flow.value
      }).then((res) => {
        if (res[1].code === 200) {
          emits('handleClose',flow.value.flowId);
          isDisabled.value = false;
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
  top: calc(50% - 300px);
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

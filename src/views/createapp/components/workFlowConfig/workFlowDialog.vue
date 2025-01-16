<template>
  <el-dialog v-model="workFlowDiaVisible" @close="onCancel" title="新建工作流" class="workFlowDia">
    <el-form
      ref="workFlowForm"
      class=""
      :model="workFlowData"
      :rules="workFlowRules"
      label-width="120px"
      label-position="left"
    >
      <el-form-item prop="name" label="工作流名称">
        <el-input v-model="workFlowData.name" placeholder="请输入" class="w320 o-validate-input" clearable></el-input>
      </el-form-item>
      <el-form-item prop="desc" label="工作流描述">
        <el-input v-model="workFlowData.desc" placeholder="请输入" class="w320 o-validate-input" clearable></el-input>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button class="o-dlg-btn" type="primary" size="small" @click="handleSubmit"> 确定 </el-button>
        <el-button class="o-dlg-btn" size="small" @click="onCancel"> 取消 </el-button>
      </span>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import { ref } from 'vue';
const workFlowDiaVisible = ref(true);
const props = defineProps({
  diaType: {
    type: String,
  },
  editData: {
    type: Object,
  },
});
const emits = defineEmits(['handleClose']);
const workFlowForm = ref();
const workFlowData = ref({
  name: '',
  desc: '',
});
const workFlowRules = ref({
  name: [{ required: true, message: '请输入工作流名称', trigger: 'blur' }],
  desc: [{ required: true, message: '请输入工作流描述', trigger: 'blur' }],
});
const onCancel = () => {
  emits('handleClose');
};
const handleSubmit = () => {};
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

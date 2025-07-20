<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? $t('flow.edit_param') : $t('flow.add_param')"
    width="500px"
    :modal="true"
    modal-class="transparent-modal"
    @close="handleClose"
  >
    <div class="paramEditForm">
      <div class="formSection">
        <div class="formTitle">{{ $t('flow.param_name') }}</div>
        <el-input
          v-model="formData.key"
          :placeholder="$t('flow.param_name')"
          class="formInput"
          :class="{ 'is-error': errors.key }"
        />
        <div v-if="errors.key" class="errorText">{{ errors.key }}</div>
      </div>
      
      <div class="formSection">
        <div class="formTitle">{{ $t('flow.param_label') }}</div>
        <el-input
          v-model="formData.label"
          :placeholder="$t('flow.param_label')"
          class="formInput"
        />
      </div>
      
      <div class="formSection">
        <div class="formTitle">{{ $t('flow.param_type') }}</div>
        <el-select 
          v-model="formData.type" 
          :placeholder="$t('flow.select_type')"
          class="formInput"
        >
          <el-option label="String" value="string" />
          <el-option label="Number" value="number" />
          <el-option label="Boolean" value="boolean" />
          <el-option label="Array[File]" value="array_file" />
          <el-option label="Object" value="object" />
        </el-select>
      </div>
      
      <div class="formSection">
        <div class="formTitle">{{ $t('flow.param_settings') }}</div>
        <div class="settingsGroup">
          <el-checkbox v-model="formData.required">
            {{ $t('flow.required') }}
          </el-checkbox>
        </div>
      </div>
      
      <div v-if="formData.type && formData.type !== 'array_file'" class="formSection">
        <div class="formTitle">{{ $t('flow.default_value') }}</div>
        <el-input
          v-if="formData.type === 'string'"
          v-model="formData.defaultValue"
          :placeholder="$t('flow.default_value')"
          class="formInput"
        />
        <el-input-number
          v-else-if="formData.type === 'number'"
          v-model="formData.defaultValue"
          :placeholder="$t('flow.default_value')"
          class="formInput numberInput"
        />
        <el-switch
          v-else-if="formData.type === 'boolean'"
          v-model="formData.defaultValue"
        />
      </div>
    </div>
    
    <template #footer>
      <div class="dialogFooter">
        <el-button @click="handleClose">{{ $t('main.close') }}</el-button>
        <el-button 
          v-if="isEdit"
          type="danger" 
          @click="handleDelete"
          class="deleteBtn"
        >
          {{ $t('semantic.interface_delete') }}
        </el-button>
        <el-button
          type="primary"
          @click="handleSave"
          :disabled="!isFormValid"
        >
          {{ $t('semantic.submit') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import i18n from 'src/i18n';

const { t } = useI18n();
const visible = ref(true);

interface ParamData {
  key: string;
  label: string;
  type: string;
  required: boolean;
  defaultValue: any;
}

const formData = ref<ParamData>({
  key: '',
  label: '',
  type: 'string',
  required: false,
  defaultValue: ''
});

const errors = ref({
  key: ''
});

const emits = defineEmits(['close', 'save', 'delete']);
const props = defineProps<{
  param?: ParamData;
  index?: number;
  existingKeys: string[];
  isEdit: boolean;
}>();

// 表单验证
const isFormValid = computed(() => {
  return formData.value.key && 
         formData.value.key.trim() !== '' && 
         formData.value.type &&
         !errors.value.key;
});

// 初始化数据
watch(
  () => props.param,
  () => {
    if (props.param) {
      formData.value = { ...props.param };
    } else {
      // 新建参数的默认值
      formData.value = {
        key: '',
        label: '',
        type: 'string',
        required: false,
        defaultValue: getDefaultValueByType('string')
      };
    }
  },
  { immediate: true }
);

// 监听类型变化，更新默认值
watch(
  () => formData.value.type,
  (newType) => {
    formData.value.defaultValue = getDefaultValueByType(newType);
  }
);

// 监听参数名变化，验证唯一性
watch(
  () => formData.value.key,
  (newKey) => {
    validateParamKey(newKey);
  }
);

// 根据类型获取默认值
const getDefaultValueByType = (type: string) => {
  switch (type) {
    case 'number': return 0;
    case 'boolean': return false;
    case 'array_file': return [];
    default: return '';
  }
};

// 验证参数key的唯一性
const validateParamKey = (key: string) => {
  errors.value.key = '';
  
  if (!key || key.trim() === '') {
    errors.value.key = i18n.global.t('flow.param_name_required');
    return;
  }
  
  // 检查重复（排除当前编辑的参数）
  const duplicateIndex = props.existingKeys.findIndex((existingKey, index) => 
    index !== props.index && existingKey === key.trim()
  );
  
  if (duplicateIndex !== -1) {
    errors.value.key = i18n.global.t('flow.duplicate_param_key');
    return;
  }
  
  // 检查是否为有效的变量名
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
    errors.value.key = i18n.global.t('flow.invalid_param_name');
    return;
  }
};

// 关闭弹窗
const handleClose = () => {
  emits('close');
};

// 保存参数
const handleSave = () => {
  if (!isFormValid.value) {
    return;
  }
  
  emits('save', { ...formData.value }, props.index);
  handleClose();
};

// 删除参数
const handleDelete = () => {
  emits('delete', props.index);
  handleClose();
};
</script>

<style lang="scss" scoped>
.paramEditForm {
  .formSection {
    margin-bottom: 20px;
    
    .formTitle {
      font-size: 14px;
      font-weight: 500;
      color: var(--o-text-color-primary);
      margin-bottom: 8px;
    }
    
    .formInput {
      width: 100%;
      
      &.is-error {
        :deep(.el-input__inner) {
          border-color: var(--el-color-danger);
        }
      }
      
      &.numberInput {
        :deep(.el-input-number__decrease),
        :deep(.el-input-number__increase) {
          width: 32px;
        }
      }
    }
    
    .errorText {
      color: var(--el-color-danger);
      font-size: 12px;
      margin-top: 4px;
    }
    
    .settingsGroup {
      display: flex;
      align-items: center;
      gap: 16px;
      
      .el-checkbox {
        :deep(.el-checkbox__label) {
          color: var(--o-text-color-primary);
          font-weight: 400;
        }
      }
    }
  }
}

.dialogFooter {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  
  .deleteBtn {
    margin-right: auto;
  }
}

// 透明遮罩样式
:deep(.transparent-modal) {
  background-color: transparent !important;
}
</style> 
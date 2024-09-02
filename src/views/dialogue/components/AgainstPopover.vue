<script lang="ts" setup>
import { computed, ref } from 'vue';
import { warningMsg } from 'src/components/Message';
import { useChangeThemeStore } from 'src/store';
const themeStore = useChangeThemeStore();

const list = ref<
  {
    label: string;
    isChecked: boolean;
  }[]
>([
  {
    label: '存在不安全或者违法信息',
    isChecked: false,
  },
  {
    label: '回复内容没什么帮助',
    isChecked: false,
  },
  {
    label: '存在错误信息',
    isChecked: false,
  },
]);
const checkedValue = computed(() =>
  list.value.reduce((accVal, currVal) => {
    return currVal.isChecked ? `${accVal}${currVal.label};` : accVal;
  }, '')
);
// 参考链接
const referLink = ref<string>('');
// 描述信息
const descText = ref<string>('');
const isErrorInputVisiable = computed(() => list.value[2].isChecked);

const emits = defineEmits<{
  (e: 'close'): void;
  (e: 'submit', reason: string, reasonLink?: string, reason_description?: string): void;
}>();

/** 提交 */
const handleSubmit = () => {
  if (!isErrorInputVisiable.value) {
    emits('submit', checkedValue.value);
    return;
  }
  if (!descText.value) {
    warningMsg('请输入描述');
    return;
  }
  emits('submit', checkedValue.value, referLink.value, descText.value);
};
</script>

<template>
  <div class="against-popover">
    <p class="against-popover-title">您的反馈将帮助我们持续进步</p>
    <ul class="against-list">
      <li class="against-item" v-for="(item, index) in list" :key="index">
        <el-checkbox id="against-checkbox" v-model="item.isChecked">{{ item.label }}</el-checkbox>
      </li>
    </ul>
    <div class="error-input" v-if="isErrorInputVisiable">
      <input
        class="error-input__link"
        type="text"
        v-model="referLink"
        placeholder="请输入参考答案链接"
        maxlength="100"
      />
      <textarea
        class="error-input__desc"
        v-model="descText"
        placeholder="请输入描述"
        maxlength="500"
      />
    </div>
    <div class="against-button">
      <el-button :class="[themeStore.theme === 'dark' ? 'cancel_button_light' : 'cancel_button_dark',]" @click="emits('close')">取消</el-button>
      <el-button class='comment_button' color="#0077ff" :disabled="!checkedValue" @click="handleSubmit">提交</el-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>

.cancel_button_light:not(.is-disabled){
  color: black !important;
  border-color: #4E5865 !important;
}

.cancel_button_light:not(.is-disabled):focus{
  // background-color: white !important;
  color: black !important;
  border-color: #4E5865 !important;
}

.cancel_button_light:not(.is-disabled):active{
  // background-color: white !important;
  color: #6395FD !important;
  border-color: #6395FD !important;
}

.cancel_button_light:not(.is-disabled):hover{
  // background-color: white !important;
  color: #7AA5FF !important;
  border-color: #7AA5FF !important;
}
//
.cancel_button_dark:not(.is-disabled){
  color: #4E5865 !important;
  border-color: black !important;
}

.cancel_button_dark:not(.is-disabled):focus{
  // background-color: white !important;
  color: #4E5865 !important;
  border-color: black !important;
}

.cancel_button_dark:not(.is-disabled):active{
  // background-color: white !important;
  color: #6395FD !important;
  border-color: #6395FD !important;
}

.ccancel_button_dark:not(.is-disabled):hover{
  // background-color: white !important;
  color: #7AA5FF !important;
  border-color: #7AA5FF !important;
}




.is-disabled{
    color:white;
    background-color: #B8D9FF;
    border-color:#B8D9FF;
    &:hover{
        color:white;
    background-color: #B8D9FF;
    border-color:#B8D9FF;
    }
}
:deep(.against-item .el-checkbox .el-checkbox__label) {
  color: #4e5865;
  font-size: 12px;
  line-height: 16px;
}

:deep(.el-button .is-disabled) {
  margin-left: 8px;
}

:deep(.against-popover .radio_item, .against-popover .el-radio-button__inner){
  font-weight: 100 !important;
}

:deep(.el-radio-button__inner){
  font-weight: 100;
}

.against-popover {
  padding: 12px;
  &-title {
    font-size: 16px;
    font-weight: 700;
    padding-bottom: 15px;
    color: #000;
  }
  .against-item {
    display: flex;
    align-items: center;
    input[type='checkbox']:checked {
      border-color: #008cba;
    }
    input {
      margin-right: 10px;
    }
    .el-checkbox {
      height: 16px;
      font-size: 12px;
      margin-bottom: 8px;
    }
  }
  .error-input {
    &__link,
    &__desc {
      color: #000;
      color: var(--o-text-color-primary);
      border: none;
      background-color: #f4f6fa;
      display:block;
      border-radius: 4px;
      padding: 5px 0 5px 16px;
      font-size: 12px;
      width: 100%;
      &:focus {
        outline: none;
      }
      &::placeholder {
        color: #8d98aa;
      }
      margin-bottom: 8px;
    }
  input::placeholder {
    color: #8d98aa;
    font-size: 12px;
    font-weight: 100;
  }
  textarea::placeholder {
    color: #8d98aa;
    font-size: 12px;
    font-weight: 100;
  }
  &__link {
    height: 32px;
    margin: 0px 0px 5px 0px;
  }
  &__desc {
    height: 88px;
  }
}
}
.against-button {
  width: 100%;
  height: 100%;
  display: flex;
  margin: 8px 0px 0px 0px;
  justify-content: center;
  button {
    border-radius: 2px;
    width: 64px;
    height: 24px;
    font-size: 12px;
    align-items: center;
    text-align: center;
  }
  button:first-child {
    border: 1px solid #c3cedf;
    &:hover {
      color: #3291fe;
    }
  }
  button:last-child {
    margin-left: 8px;
  }
  button {
    border-radius: 2px;
    width: 64px;
    height: 24px;
    font-size: 12px;
    align-items: center;
    text-align: center;
  }
  button:first-child {
    border: 1px solid #c3cedf;
    &:hover{
      background-color: white;
    }
  }

  .cancel_button:hover {
    color: #3291fe;
    border-color: #3291fe;
  }
}
</style>

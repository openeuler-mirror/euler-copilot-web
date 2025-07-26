<script lang="ts" setup>
import { computed, ref } from 'vue';
import { warningMsg } from 'src/components/Message';
import { useChangeThemeStore } from 'src/store';
import i18n from 'src/i18n';
const themeStore = useChangeThemeStore();

const list = ref<
  {
    label: string;
    name: string;
    isChecked: boolean;
  }[]
>([
  {
    label: i18n.global.t(
      'feedback.the_information_is_inappropriate_or_illegal',
    ),
    name: 'the_information_is_inappropriate_or_illegal',
    isChecked: false,
  },
  {
    label: i18n.global.t('feedback.the_answer_is_not_helpful'),
    name: 'the_answer_is_not_helpful',
    isChecked: false,
  },
  {
    label: i18n.global.t('feedback.i_found_an_error'),
    name: 'i_found_an_error',
    isChecked: false,
  },
]);
const checkedValue = computed(() =>
  list.value.reduce((accVal, currVal) => {
    return currVal.isChecked ? `${accVal}${currVal.label};` : accVal;
  }, ''),
);
// 参考链接
const referLink = ref<string>('');
// 描述信息
const descText = ref<string>('');
const isErrorInputVisiable = computed(() => list.value[2].isChecked);

const emits = defineEmits<{
  (e: 'close'): void;
  (
    e: 'submit',
    reason: string,
    reasionLink?: string,
    reason_description?: string,
  ): void;
}>();

/** 提交 */
const handleSubmit = () => {
  if (!isErrorInputVisiable.value) {
    emits('submit', checkedValue.value);
    return;
  }
  if (!descText.value) {
    warningMsg(i18n.global.t('feedback.describe_the_error'));
    return;
  }
  emits('submit', checkedValue.value, referLink.value, descText.value);
};
</script>

<template>
  <div class="against-popover">
    <p class="against-popover-title">
      {{ $t('feedback.your_feedback_helps_us_improve') }}
    </p>
    <ul class="against-list">
      <li class="against-item" v-for="(item, index) in list" :key="index">
        <el-checkbox id="against-checkbox" v-model="item.isChecked">
          {{ $t('feedback.' + item.name) }}
        </el-checkbox>
      </li>
    </ul>
    <div class="error-input" v-if="isErrorInputVisiable">
      <input
        class="error-input__link"
        type="text"
        v-model="referLink"
        :placeholder="$t('feedback.enter_the_link_to_the_correct_answer')"
        maxlength="100"
      />
      <textarea
        class="error-input__desc"
        v-model="descText"
        :placeholder="$t('feedback.describe_the_error')"
        maxlength="500"
      />
    </div>
    <div class="against-button">
      <el-button @click="emits('close')">
        {{ $t('history.cancel') }}
      </el-button>
      <el-button primary :disabled="!checkedValue" @click="handleSubmit">
        {{ $t('feedback.submit') }}
      </el-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.cancel_button_light:not(.is-disabled) {
  color: black !important;
  border-color: #4e5865 !important;
}

.cancel_button_light:not(.is-disabled):focus {
  color: black !important;
  border-color: #4e5865 !important;
}

.cancel_button_light:not(.is-disabled):active {
  color: #6395fd !important;
  border-color: #6395fd !important;
}

.cancel_button_light:not(.is-disabled):hover {
  color: #7aa5ff !important;
  border-color: #7aa5ff !important;
}

.cancel_button_dark:not(.is-disabled) {
  color: #4e5865 !important;
  border-color: black !important;
}

.cancel_button_dark:not(.is-disabled):focus {
  color: #4e5865 !important;
  border-color: black !important;
}

.cancel_button_dark:not(.is-disabled):active {
  color: #6395fd !important;
  border-color: #6395fd !important;
}

.ccancel_button_dark:not(.is-disabled):hover {
  color: #7aa5ff !important;
  border-color: #7aa5ff !important;
}

.is-disabled {
  color: white;
  background-color: #b8d9ff;
  border-color: #b8d9ff;
  &:hover {
    color: white;
    background-color: #b8d9ff;
    border-color: #b8d9ff;
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

:deep(.against-popover .radio_item, .against-popover .el-radio-button__inner) {
  font-weight: 100 !important;
}

:deep(.el-radio-button__inner) {
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
      display: block;
      border-radius: 4px;
      padding: 5px 0 5px 16px;
      font-size: 12px;
      width: 280px;
      margin-left: -8px;
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
    &:hover {
      background-color: white;
    }
  }

  .cancel_button:hover {
    color: #3291fe;
    border-color: #3291fe;
  }
}
</style>

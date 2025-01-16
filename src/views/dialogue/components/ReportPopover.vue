<script lang="ts" setup>
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useLangStore } from 'src/store';
const { language } = storeToRefs(useLangStore());

const reportLabel = [
  'pornographic_content',
  'account_violation',
  'politically_sensitive_content',
  'violence_or_terrorism',
  'defamation_or_rumor_spreading',
  'insult_to_heroes_or_martyrs',
  'spam',
  'ethnic_or_religious_incitement',
  'disturbing_content',
  'abuse_or_harassment',
  'gambling_or_fraud',
  'consumer_manipulation',
  'harm_to_minors',
  'illegal_or_prohibited_items',
  'other_violations',
];
const reportList = <
  {
    label: string;
    isChecked: boolean;
  }[]
>reportLabel.map(item => {
  return new Object({
    isChecked: false,
    label: item,
  });
});
const list = ref<
  {
    label: string;
    isChecked: boolean;
  }[]
>(reportList);
// 举报类型选择
const radio = ref<string>('');
// 举报详细信息
const descText = ref<string>('');
const isErrorInputVisiable = computed(() => list.value[2].isChecked);

const emits = defineEmits<{
  (e: 'report', reason: string): void;
  (e: 'close'): void;
}>();

/** 举报 */
const handleComplaint = () => {
  const str = descText.value.length ? radio.value + ';' + descText.value : radio.value;
  if (!isErrorInputVisiable.value) {
    emits('report', str);
    return;
  }
  emits('report', str);
};
</script>

<template>
  <div class="against-popover">
    <p class="against-popover-title">{{ $t('feedback.reason_for_reporting') }}</p>
    <ul class="against-list">
      <el-radio-group v-model="radio" class="ml-4">
        <div :class="[language === 'EN' ? 'radio-en' : 'radio']" v-for="(item, index) in list" :key="index">
          <el-radio-button class="radio_item" :label="item.label">{{ $t('Report.' + item.label) }}</el-radio-button>
        </div>
      </el-radio-group>
    </ul>
    <div class="error-input">
      <textarea
        class="error-input__desc"
        v-model="descText"
        :placeholder="$t('feedback.enter_a_description_for_your_report')"
      />
    </div>
    <div class="against-button">
      <el-button @click="emits('close')">{{ $t('history.cancel') }}</el-button>
      <el-button type="primary" :disabled="!radio" @click="handleComplaint">{{ $t('history.ok') }}</el-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
:deep(.el-radio-button__inner) {
  display: block;
  align-content: center;
  width: 87px;
  background-color: #f4f6fa;
  font-size: 12px;
  margin-bottom: 8px;
  padding: 8px;
  border: 1px;
  color: #000;
}

:deep(.el-radio-button:first-child .el-radio-button__inner) {
  border-left: 0px;
  border-radius: 2px;
  font-weight: 100;
}
:deep(.el-radio-button__original-radio:hover) {
  & + .el-radio-button__inner {
    // background-image: linear-gradient(to 127.72, #6D75FA, #5AB3FF);
    background-color: #b8d9ff;
    outline: 1px solid #0077ff;
    border-radius: 4px;
    color: #7aa5ff;
  }
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
.radio {
  align-items: center;
  text-align: center;
  margin-right: 8px;
  width: 87px;
  height: 32px;
  border: 0px;
  border-radius: 2px;
  &_item {
    margin: 0px;
  }
  &:nth-child(3n + 3) {
    margin-left: 0px;
  }
}

.radio-en {
  align-items: center;
  text-align: center;
  margin-right: 8px;
  margin-bottom: 8px;
  width: 118px;
  height: 48px;
  border: 0px;
  border-radius: 2px;
  &_item {
    margin: 0px;
  }
  &:nth-child(3n + 3) {
    margin-left: 0px;
  }
}
.against-popover {
  padding: 12px;
  &-title {
    font-size: 16px;
    padding-bottom: 16px;
    font-weight: 500;
    line-height: 24px;
    color: #000;
  }
  .against-item {
    display: flex;
    align-items: center;
    input[type='checkbox']:checked {
      border-color: #008cba;
    }

    .el-checkbox {
      height: 16px;
      font-size: 12px;
      margin-bottom: 8px;
    }

    .against-label {
      margin-bottom: 8px;
    }
  }

  .error-input {
    margin-right: 8px;
    &__link,
    &__desc {
      color: var(--o-text-color-tertiary);
      border: none;
      background-color: #f4f6fa;
      border-radius: 4px;
      padding: 5px 0px 5px 16px;
      font-size: 12px;
      width: 100%;
      font-weight: 100;
      &:focus {
        outline: none;
      }

      &::placeholder {
        color: #8d98aa;
      }
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

  .against-button {
    width: 100%;
    height: 100%;
    display: flex;
    margin: 11px 0px 0px 0px;
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
      &:hover {
        color: #3291fe;
        border-color: #3291fe;
        background-color: white;
      }
    }
    button:last-child {
      margin-left: 8px;
    }
  }
}
</style>

<script lang="ts" setup>
import { ref } from 'vue';
import PrivacyText from './PrivacyText.vue';
import EulerDialog from 'src/components/EulerDialog.vue';
import marked from 'src/utils/marked';

const policyDialogVisiable = ref(false);
const agreeDialogVisiable = ref(false);
// 协议内容
const agreement = ref<string>('');
const policy = ref<string>('');
/**
 * 读取协议
 */
const readAgreement = async () => {
  const language = localStorage.getItem('localeLang');
  const response =
    language === 'en'
      ? await import('src/conf/agreement-en.md?raw')
      : await import('src/conf/agreement.md?raw');
  agreement.value = marked.parse(response.default) as string;
  agreeDialogVisiable.value = true;
};

const readPolicy = async () => {
  const language = localStorage.getItem('localeLang');
  const response =
    language === 'en'
      ? await import('src/conf/policy-en.md?raw')
      : await import('src/conf/policy.md?raw');
  policy.value = marked.parse(response.default) as string;
  policyDialogVisiable.value = true;
};
</script>

<template>
  <div class="common-footer">
    <span class="common-footer-tips">{{ $t('main.opinions') }}</span>
    <span @click="readAgreement">{{ $t('main.service_agreement') }}</span>
    <EulerDialog
      :visible="agreeDialogVisiable"
      :content="agreement"
      :need-check="false"
      :agreement-name="$t('main.service_agreement')"
      @submit="agreeDialogVisiable = false"
    ></EulerDialog>
    <span class="common-footer-policy" @click="readPolicy">
      {{ $t('main.privacy_policy') }}
    </span>
    <EulerDialog
      :visible="policyDialogVisiable"
      :content="policy"
      :need-check="false"
      :agreement-name="$t('main.privacy_policy')"
      @submit="policyDialogVisiable = false"
    ></EulerDialog>
    <el-tooltip class="box-item" effect="light" placement="top">
      <template #default>
        <span class="common-footer-content">{{ $t('main.contact_us') }}</span>
      </template>
      <template #content>
        {{ $t('main.email1') }}
        <p class="common-footer-email">contact@openeuler.io</p>
      </template>
    </el-tooltip>
    <span>{{ $t('main.version') }}</span>
  </div>
</template>

<style lang="scss" scoped>
.common-footer-email {
  display: inline-block;
  color: #3291fe;
}
.common-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  span {
    font-size: 12px;
    color: var(--o-text-color-tertiary);
    cursor: pointer;
    padding-left: 8px;
  }
  .common-footer-tips {
    border-right: 1px solid var(--o-border-color-lighter);
    padding: 0 8px 0 0;
  }
  &-policy {
    &:hover {
      color: #7aa5ff;
    }
  }

  &-email {
    color: #7aa5ff;
  }
}
.common-footer-content {
  &:hover {
    color: #7aa5ff;
  }
}
.dialog-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  button {
    width: 64px;
    height: 24px;
    border-radius: 1;
    font-size: 12px;
  }
}
.dialog-body {
  max-height: 300px;
  background-color: var(--o-bg-color-light);

  .text-header {
    color: var(--o-text-color-primary);
    font-weight: 700 !important;
  }

  ::-webkit-scrollbar-track {
    background-image: linear-gradient(
      180deg,
      #e7f0fd 1%,
      #daeafc 40%
    ) !important;
    display: none;
  }

  ::-webkit-scrollbar {
    width: 3px;
    height: 3px;
    display: none;
  }

  ::-webkit-scrollbar-thumb {
    background-color: #d3dce9 !important;
    border-radius: 3px;
  }

  .el-scrollbar__thumb {
    width: 1px;
  }
}
:deep(.dialog .el-dialog__header) {
  margin-right: 0px;
  border-radius: 4px 4px 0 0;
  padding: 15px 20px 15px 20px;
  border-bottom: 1px solid transparent;
  .el-dialog__title {
    font-size: 16px;
    line-height: 25px;
    font-weight: 1000;
  }

  .el-dialog__headerbtn {
    top: 0px;
  }
}
:deep(.dialog .el-dialog__body) {
  padding: 24px 24px 32px 24px;
}
:deep(.el-dialog__body) {
  overflow: hidden;
}

:deep(.el-dialog__body a) {
  color: #6395fd;
  &:hover {
    color: #7aa5ff;
  }
}
</style>

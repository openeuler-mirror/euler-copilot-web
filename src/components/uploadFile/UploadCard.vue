<script lang="ts" setup>
import { defineEmits, computed, withDefaults } from 'vue';
import { useChangeThemeStore } from 'src/store';

import type { UploadFileCard } from './type.ts';
import { UploadStatus, UploadType } from './type';
import { api } from 'src/apis';
import i18n from 'src/i18n';
import { successMsg, errorMsg } from 'src/components/Message';
import docSvg from '@/assets/svgs/doc.svg';
import docxSvg from '@/assets/svgs/docx.svg';
import mdSvg from '@/assets/svgs/md.svg';
import pdfSvg from '@/assets/svgs/pdf.svg';
import txtSvg from '@/assets/svgs/txt.svg';
import xlsxSvg from '@/assets/svgs/xlsx.svg';
import loadingSvg from '@/assets/svgs/loading.svg';
import errorSvg from '@/assets/svgs/error.svg';

// 分为迷你和常规两种样式
type Mode = 'mini' | 'common';

// 声明props
const props = withDefaults(
  defineProps<{
    // 文件数据
    fileParams: UploadFileCard;
    // 删除按钮是否显示
    deletable?: boolean;
    // 显示模式
    mode?: Mode;
  }>(),
  {
    deletable: true,
    mode: 'common',
  },
);

// 声明emits
const emit = defineEmits(['delete']);

// 主题状态
const themeStore = useChangeThemeStore();

// 删除是否禁用
const isDeleteDisable = computed(() => {
  return props.fileParams.status === UploadStatus.UPLOADING;
});

// 状态到
const statusMap = {
  [UploadStatus.USED]: {
    content: '',
    color: 'tertiary',
    hasIcon: false,
    isRotating: false,
    iconSrc: undefined,
  },
  [UploadStatus.UNUSED]: {
    content: '',
    color: 'tertiary',
    hasIcon: false,
    isRotating: false,
    iconSrc: undefined,
  },
  [UploadStatus.UPLOADING]: {
    content: 'upload.uploading',
    color: 'tertiary',
    hasIcon: true,
    isRotating: true,
    iconSrc: loadingSvg,
  },
  [UploadStatus.UPLOADFAIL]: {
    content: 'upload.upload_fail',
    color: 'danger',
    hasIcon: true,
    isRotating: false,
    iconSrc: errorSvg,
  },
  [UploadStatus.RESOLVEFAIL]: {
    content: 'upload.resolve_fail',
    color: 'danger',
    hasIcon: true,
    isRotating: false,
    iconSrc: errorSvg,
  },
  [UploadStatus.RESOLVING]: {
    content: 'upload.resolving',
    color: 'tertiary',
    hasIcon: true,
    isRotating: true,
    iconSrc: loadingSvg,
  },
};

const svgMap = {
  [UploadType.DOC]: docSvg,
  [UploadType.DOCX]: docxSvg,
  [UploadType.MDB]: mdSvg,
  [UploadType.MDF]: mdSvg,
  [UploadType.PDF]: pdfSvg,
  [UploadType.TXT]: txtSvg,
  [UploadType.XLSX]: xlsxSvg,
};

const svgUrl = computed(() => svgMap[props.fileParams.type]);

const currentStatusItem = computed(() => statusMap[props.fileParams.status]);

const handleDelete = async () => {
  const ducumentId = props.fileParams?.id;
  const status = props.fileParams?.status;
  if (status === UploadStatus.UPLOADING) {
    return;
  }
  if (
    status !== UploadStatus.UPLOADFAIL &&
    status !== UploadStatus.RESOLVEFAIL
  ) {
    // 调用删除接口
    const [_, response] = await api.deleteUploadedFile(ducumentId);
    if (!_ && response) {
      const code = response.code;
      if (code === 200) {
        successMsg(i18n.global.t('history.delete_successfully'));
        emit('delete', props.fileParams);
      } else {
        errorMsg(i18n.global.t('history.delete_failed'));
        return;
      }
    } else {
      errorMsg(i18n.global.t('history.delete_failed'));
      return;
    }
  }
  emit('delete', props.fileParams);
};
</script>
<template>
  <div>
    <div v-if="props.mode === 'common'" class="filecard-wrapper-common">
      <img :src="svgUrl" alt="" />
      <div class="file-info">
        <div class="name">{{ props.fileParams.name }}</div>
        <div class="size">
          <span
            v-if="
              props.fileParams.status === UploadStatus.UNUSED ||
              props.fileParams.status === UploadStatus.USED
            "
          >
            {{ props.fileParams.size }}
          </span>
          <div v-else class="status">
            <img
              :src="currentStatusItem.iconSrc"
              :class="currentStatusItem.isRotating ? 'icon-rotate' : ''"
              alt=""
            />
            <span :class="currentStatusItem.color">
              {{ $t(currentStatusItem.content) }}
            </span>
          </div>
        </div>
      </div>
      <div v-if="props.deletable && !isDeleteDisable" class="file-delete">
        <img
          v-if="themeStore.theme === 'dark'"
          src="@/assets/svgs/dark_delete.svg"
          @click="handleDelete"
        />
        <img v-else src="@/assets/svgs/delete.svg" @click="handleDelete" />
      </div>
      <div
        v-if="props.deletable && isDeleteDisable"
        class="file-delete-disable"
      >
        <img
          v-if="themeStore.theme === 'dark'"
          src="@/assets/svgs/dark_delete.svg"
        />
        <img v-else src="@/assets/svgs/delete.svg" />
      </div>
    </div>

    <div v-if="props.mode === 'mini'" class="filecard-wrapper-mini">
      <img :src="svgUrl" alt="" />
      <span>{{ props.fileParams.name }}</span>
    </div>
  </div>
</template>

<style lang="scss">
.filecard-wrapper-common {
  width: 232px;
  height: 56px;
  padding: 10px 8px 10px 10px;
  border-radius: 8px;
  border: 1px solid var(--o-border-color-light);
  background-color: var(--o-bg-color-light2);
  box-sizing: border-box;
  display: flex;
  align-items: center;

  .file-info {
    width: 160px;
    margin-left: 10px;
    font-size: 12px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    .name {
      color: var(--o-text-color-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 16px;
      margin-bottom: 4px;
    }

    .size {
      color: var(--o-text-color-tertiary);
      line-height: 16px;

      .danger {
        color: var(--o-color-danger);
      }

      .tertiary {
        color: var(--o-text-color-tertiary);
      }

      .status {
        display: flex;
        align-items: end;

        span {
          line-height: 16px;
        }
      }

      .icon-rotate {
        animation: rotate 1.2s linear infinite;
      }

      img {
        width: 14px;
        height: 14px;
        display: inline-block;
        margin-right: 5px;
      }
    }
  }

  .file-delete {
    cursor: pointer;

    img:hover {
      filter: invert(50%) sepia(66%) saturate(446%) hue-rotate(182deg)
        brightness(100%) contrast(103%);
    }
  }

  .file-delete,
  .file-delete-disable {
    flex: 1;
    width: 16px;
    height: 16px;
    text-align: right;

    img {
      width: 16px;
      height: 16px;
    }
  }
}

.filecard-wrapper-mini {
  display: flex;
  align-items: center;

  img {
    width: 18px;
    height: 18px;
    margin-right: 6px;
  }

  span {
    line-height: 18px;
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--o-text-color-tertiary);
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>

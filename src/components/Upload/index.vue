<script lang="ts" setup>
// import { ElMessage } from 'element-plus';
import { ref } from 'vue';

import { IconUpload, IconError, IconVisible, IconDelete } from '@computing/opendesign-icons';
import type { UploadFile, ElUploadProgressEvent, ElFile, ElUploadRequestOptions } from 'element-plus/es/components/upload/src/upload.type';
import { requestUploadAPI } from './shared';

// 自定义上传函数
function doUpload(options: ElUploadRequestOptions) {
  const e = new ProgressEvent('upload');
  requestUploadAPI({
    file: options.file,
    onUploadProgress(e: ProgressEvent) {
      (e as ElUploadProgressEvent).percent = Math.floor((100 * e.loaded) / e.total);
      options.onProgress(e);
    },
  }).then((res: any) => {
    options.onSuccess(res);
  });
}

const imageUrl = ref('');
const progressVal = ref(0);
const uploadDone = ref(false);

// 做上传前检查
const beforeUpload = (file: ElFile) => {
  const isJPG = ['image/jpeg'].includes(file.type);
  const isLt2M = file.size / 1024 / 1024 < 2;

  if (!isJPG) {
    ElMessage({
      message: 'Picture must be JPG format!',
      icon: IconError,
      customClass: 'o-message--error',
    });
  }
  if (!isLt2M) {
    ElMessage({
      message: 'Picture size can not exceed 2MB!',
      icon: IconError,
      customClass: 'o-message--error',
    });
  }
  if (isJPG && isLt2M) {
    imageUrl.value = URL.createObjectURL(file);
    uploadDone.value = false;
    return true;
  }
  return false;
};
// 上传进度
const handleProgress = (event: ElUploadProgressEvent) => {
  progressVal.value = event.percent;
};
// 上传完成
const handleSuccess = (res: ElUploadProgressEvent, file: UploadFile) => {
  uploadDone.value = true;
  progressVal.value = 0;
};
const doDelete = (e: Event) => {
  e.stopPropagation();
  console.log('click Delete');
  imageUrl.value = '';
  uploadDone.value = false;
};
const doPreview = (e: Event) => {
  e.stopPropagation();
  console.log('click Preview');
};
</script>
<template>
  <el-upload
    action=""
    drag
    multiple
    :show-file-list="false"
    :on-success="handleSuccess"
    :before-upload="beforeUpload"
    :http-request="doUpload"
    :on-progress="handleProgress"
    class=""
  >
    <div class="upload-box">
      <div v-if="imageUrl" class="upload-preview">
        <img :src="imageUrl" class="upload-preview-img" />
        <div class="upload-btns" @click.stop>
          <el-icon class="btn" @click="doPreview">
            <IconVisible />
          </el-icon>
          <el-icon class="btn" @click="doDelete">
            <IconDelete />
          </el-icon>
        </div>
      </div>
      <div v-else class="upload-add">
        <el-icon class="upload-btn-icon">
          <IconUpload />
        </el-icon>
        <div class="upload-tip">
          将文件拖拽到此处 或
          <div style="margin-top: 16px">
            <el-button type="primary" size="small">选择文件</el-button>
          </div>
        </div>
        <div class="upload-tip">格式: jpg、png, 大小 &lt; 2M</div>
      </div>
      <div v-if="progressVal && !uploadDone" class="upload-loading">
        <el-progress class="uplaod-progress" :percentage="progressVal" :stroke-width="8" />
      </div>
    </div>
  </el-upload>
</template>

<style scoped>
.upload-box {
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 400px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-btn-icon {
  font-size: 64px;
  color: var(--o-text-color-tertiary);
}

.upload-tip {
  width: 100%;
  font-size: var(--o-font-size-info);
  color: var(--o-text-color-tertiary);
}

.upload-tip + .upload-tip {
  margin-top: 24px;
}

.upload-preview {
  width: 100%;
  height: 100%;
}

.upload-preview-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.upload-btns {
  display: flex;
  position: absolute;
  left: 0;
  bottom: 0;
  right: 0;
  top: 0;
  align-items: center;
  justify-content: center;
  background-color: var(--o-bg-color-mask);
  opacity: 0;
  transition: opacity 0.3s;
}

.upload-preview:hover .upload-btns {
  opacity: 1;
}

.upload-btns .btn {
  font-size: var(--o-font-size-subtitle);
  margin: 8px;
  color: var(--o-text-color-fourth);
}

.upload-btns .btn:hover {
  color: var(--o-color-primary);
}

.upload-loading {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
  background-color: var(--o-bg-color-mask);
}

.uplaod-progress {
  position: absolute;
  left: 8px;
  right: 8px;
  bottom: 8px;
}
</style>
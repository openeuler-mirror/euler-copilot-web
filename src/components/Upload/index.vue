<script lang="ts" setup>
import { ElMessage } from 'element-plus';
import { ref } from 'vue';
import * as jsYaml from 'js-yaml'; 
import { IconUpload, IconVisible, IconDelete } from '@computing/opendesign-icons';
import type { UploadFile, ElUploadProgressEvent, ElFile, ElUploadRequestOptions } from 'element-plus/es/components/upload/src/upload.type';

const handleUploadMyFile = (options: any) => {
  console.log(options);
};

// 自定义上传函数
const doUpload = (options: any) => {
  handleUploadMyFile(options);
};

const imageUrl = ref('');
const progressVal = ref(0);
const uploadDone = ref(false);
// 上传前检查
const beforeUpload = async (file: ElFile) => { 
  const isYaml = file.type === 'application/x-yaml' || file.type === 'text/yaml'; // 也可能遇到 text/yaml 类型
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isYaml) {
    ElMessage({
      message: 'File must be YAML format!',
      type: 'error', 
    });
    return false;
  }
  if (!isLt2M) {
    ElMessage({
      message: 'YAML size cannot exceed 2MB!',
      type: 'error',
    });
    return false;
  }

  try {
    const reader = new FileReader();
    reader.onload = async (event) => {
      const yamlContent = event.target?.result as string;
      //yaml 展示
      console.log('YAML Content:', yamlContent);
      try {
        const jsonContent = jsYaml.load(yamlContent); // 将 YAML 字符串解析为 JSON 对象
        console.log('JSON Content:', jsonContent);
      } catch (yamlParseError) {
        console.error('Error parsing YAML to JSON:', yamlParseError);
      }
      // 假设 uploadDone 是一个外部定义的响应式变量
      // uploadDone.value = true; // 可能你想在这里设置上传完成状态
      // 注意：由于 FileReader 是异步的，直接返回 true 或 false 在这里没有意义
      // 因为函数已经返回过了（在 await reader.readAsText(file) 之前）
      // 你可能需要在外部处理上传逻辑，或者将这个函数改为 async/await 风格并在外部调用处处理
    };

    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      ElMessage({
        message: 'Error reading file!',
        type: 'error',
      });
    };

    // 开始读取文件内容
    await new Promise((resolve, reject) => {
      reader.readAsText(file);
      reader.onloadend = () => resolve(); // 当读取完成时解决 Promise
      reader.onerror = (error) => reject(error); // 如果出错则拒绝 Promise
    });

    // 注意：由于 FileReader 是异步的，并且我们使用了 await，这里不会立即返回
    // 但是由于我们的函数签名没有使用 async/await 风格，这可能会导致一些混淆
    // 最好的做法是将这个函数改为返回 Promise 或者使用回调来处理异步逻辑

    // 由于我们的逻辑已经处理了所有情况，并且没有明确的返回值需求（除了异步处理），
    // 我们可以简单地不返回任何值（或者返回 undefined/null 来表示处理完成，但这通常不是最佳实践）
    // 在实际应用中，你可能需要调整这部分逻辑以适应你的应用架构

    // 临时返回 true 表示文件通过了校验（但注意，真正的上传逻辑应该在外部处理）
    return true; // 这行实际上在当前的 async 函数中是没有意义的，因为函数已经因为 await 而“暂停”了
  } catch (error) {
    console.error('Error during file upload process:', error);
    ElMessage({
      message: 'An error occurred during file upload!',
      type: 'error',
    });
    return false; // 同样，这行在当前的 async 函数中可能没有实际意义
  }

  // 注意：由于上面的 async/await 和 FileReader 的使用方式，
  // 下面的返回语句实际上永远不会被执行到（除非去掉 await 和相关的异步逻辑）
  // return false; // 这行是多余的，应该被移除
};
const beforeUploadPromise = (fileWrapper: { file: File }): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    // ...（上面的异步逻辑，但在最后调用 resolve(true) 或 reject(false)）
  });
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
        <div class="upload-tip">格式: YAML, 大小 &lt; 2M</div>
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
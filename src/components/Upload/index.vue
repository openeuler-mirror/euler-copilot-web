<script lang="ts" setup>
import { ElMessage } from 'element-plus';
import { ref, watch } from 'vue';
import * as jsYaml from 'js-yaml';
import { IconUpload, IconVisible, IconDelete } from '@computing/opendesign-icons';
import type { UploadFile, ElUploadProgressEvent, ElFile } from 'element-plus/es/components/upload/src/upload.type';
import { Codemirror } from 'vue-codemirror';
import { onMounted } from 'vue';
import { api } from 'src/apis';
import { IconChevronDown } from '@computing/opendesign-icons';

const handleCreateapi = (data: any) => {
  api
    .createOrUpdateApi({
      serviceId: '',
      data,
    })
    .then(res => {
      getServiceJson.value = res[1].result.apis;
      uploadtype.value = 'get';
    });
};

const props = defineProps({
  type: {
    type: String,
    default: '',
  },
  disable: {
    type: Boolean,
    default: false,
  },
  closeDrawer: {
    type: Function,
    default: () => {},
  },
  serviceId: {
    type: String,
    default: '',
  },
  getServiceJson: {
    type: String,
    default: '',
  },
  getServiceYaml: {
    type: String,
    default: '',
  },
});
const emits = defineEmits<{
  (e: 'closeDrawer'): void;
}>();

const handleClose = () => {
  //清空数据
  getServiceYaml.value = '';
  yamlToJsonContent.value = '';
  getServiceJson.value = '';
  emits('closeDrawer');
};

const uploadtype = ref(props.type);

const getServiceYaml = ref('');
const yamlToJsonContent = ref('');
const getServiceJson = ref('');
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
    reader.onload = async event => {
      getServiceYaml.value = event.target?.result as string;
      //yaml 展示
      try {
        yamlToJsonContent.value = jsYaml.load(getServiceYaml.value);
        uploadtype.value = 'edit';
      } catch (yamlParseError) {
        console.error('Error parsing YAML to JSON:', yamlParseError);
      }
    };

    reader.onerror = error => {
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
      reader.onerror = error => reject(error); // 如果出错则拒绝 Promise
    });
    return true;
  } catch (error) {
    console.error('Error during file upload process:', error);
    ElMessage({
      message: 'An error occurred during file upload!',
      type: 'error',
    });
    return false; // 同样，这行在当前的 async 函数中可能没有实际意义
  }
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
  uploadDone.value = false;
};
const doPreview = (e: Event) => {
  e.stopPropagation();
};

watch(
  () => props,
  () => {
    getServiceJson.value = props.getServiceJson;
    getServiceYaml.value = props.getServiceYaml;
    if (props.type === 'edit' && props) {
      console.log('edit');
      // getServiceYamlFun(props.serviceId);
    }
  },
  { immediate: true, deep: true },
);
</script>
<template>
  <el-upload
    v-if="uploadtype === 'upload'"
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
  <div class="code-container" v-if="uploadtype === 'edit'">
    <Codemirror
      v-model="getServiceYaml"
      placeholder="Code goes here..."
      :autofocus="true"
      :indent-with-tab="true"
      :tab-size="2"
      :extensions="extensions"
      :disabled="disabled"
      @ready="handleReady"
    />
  </div>
  <div class="json-container" v-if="uploadtype === 'get'">
    <el-collapse v-model="getServiceJson" class="o-hpc-collapse" :prefix-icon="IconChevronDown">
      <!-- 这里直接展示输入和输出 -->
      <el-collapse-item v-for="(item, index) in getServiceJson" :key="index" :name="item.name">
        <template #title>
          <span>{{ item.name }}</span>
          <!-- 这里接口返回的需要限制最大位数 -->
          <el-icon class="el-collapse-item__arrow">
            <IconChevronDown></IconChevronDown>
          </el-icon>
        </template>
        <div class="o-collapse-content">
          <div class="itemTitle">
            <div class="subName">{{ item.path }}</div>
            <div class="subName">{{ item.description }}</div>
          </div>
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
  <div class="drawerFooter" v-if="uploadtype === 'upload'">
    <el-button @click="handleClose">取消</el-button>
    <el-button type="primary" @click="handleClose">确定</el-button>
  </div>
  <div class="drawerFooter" v-if="uploadtype === 'edit'">
    <el-button @click="handleClose">取消</el-button>
    <el-button @click="handleClose">编辑</el-button>
    <el-button type="primary" @click="handleCreateapi(yamlToJsonContent)">解析</el-button>
  </div>
  <div class="drawerFooter" v-if="uploadtype === 'get'">
    <el-button @click="handleClose">取消</el-button>
    <el-button type="primary" @click="handleClose">确定</el-button>
  </div>
</template>

<style scoped>
.json-container {
  max-height: 80%;
  overflow-y: hidden;
}
.v-codemirror {
  height: 100%;
  width: 100%;
  .cm-editor {
    height: 100%;
    border: 1px solid var(--o-time-text);
    .cm-gutters {
      background-color: var(--o-bash-bg);
    }
  }
  .cm-focused {
    outline: none;
  }
}

.drawerFooter {
  position: absolute;
  bottom: 12px;
  right: 12px;
}
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

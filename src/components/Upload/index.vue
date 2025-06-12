<script lang="ts" setup>
import { ElMessage } from 'element-plus';
import { ref, watch, onMounted } from 'vue';
import * as jsYaml from 'js-yaml';
import {
  IconUpload,
  IconVisible,
  IconDelete,
  IconCaretRight,
  IconChevronDown,
} from '@computing/opendesign-icons';
import type { ElFile } from 'element-plus/es/components/upload/src/upload.type';
import { api } from 'src/apis';
import { errorMsg, successMsg } from 'src/components/Message';
import { yaml } from '@codemirror/lang-yaml';
import { oneDark } from '@codemirror/theme-one-dark';
import { useChangeThemeStore } from '@/store';
import CustomLoading from 'src/views/customLoading/index.vue';
import MonacoEditor from 'src/components/monaco/MonacoEditor.vue';

const loading = ref(false);
const themeStore = useChangeThemeStore();
const extensions = ref([yaml()]);
const handleCreateapi = async () => {
  loading.value = true;
  const [_, res] = await api.createOrUpdateApi({
    serviceId: props.serviceId || '',
    data: yamlToJsonContent.value,
  });
  if (!_ && res) {
    if (res.code === 200) {
      getServiceJson.value = res?.result?.apis;
      getServiceName.value = res?.result?.name;
      activeServiceNameList.value = getServiceJson.value.map(
        (item) => item.name,
      );
      uploadtype.value = 'get';
      successMsg('创建成功');
    } else {
      errorMsg('创建失败');
    }
    loading.value = false;
  } else {
    loading.value = false;
  }
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
  ServiceYaml: {
    type: String,
    default: '',
  },
  getServiceName: {
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
  getServiceName.value = '';
  emits('closeDrawer');
};

const handleEdit = () => {
  //edit数据
  successMsg('可编辑');
  editable.value = true;
};

const uploadtype = ref(props.type);
const getServiceYaml = ref('');
const yamlToJsonContent = ref('');
const getServiceJson = ref('');
const getServiceName = ref('');
const activeServiceNameList = ref([]);
const imageUrl = ref('');
const progressVal = ref(0);
const uploadDone = ref(false);
const editable = ref(false);
// 上传前检查
const beforeUpload = async (file: ElFile) => {
  const isYaml =
    file.type === 'application/x-yaml' ||
    file.type === 'text/yaml' ||
    file.name.indexOf('.yaml') > -1 ||
    file.name.indexOf('.yml') > -1; // 也可能遇到 text/yaml 类型
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
      getServiceYaml.value = event.target?.result as string;
      //yaml 展示
      try {
        yamlToJsonContent.value = jsYaml.load(getServiceYaml.value);
        uploadtype.value = 'edit';
      } catch (yamlParseError) {
        console.error('Error parsing YAML to JSON:', yamlParseError);
      }
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

// 上传完成
const handleSuccess = () => {
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

const getServiceYamlFun = async (id: string) => {
  await api.querySingleApiData({ serviceId: id, edit: true }).then((res) => {
    if (res) {
      getServiceYaml.value = jsYaml.dump(res[1].result.data);
      getServiceName.value = res[1].result.data.info.title;
    }
  });
};
const handleChange = (payload) => {
  yamlToJsonContent.value = jsYaml.load(payload);
};
watch(
  () => props,
  () => {
    getServiceJson.value = props.getServiceJson;
    getServiceYaml.value = props.ServiceYaml;
    getServiceName.value = props.getServiceName;
    if (getServiceJson.value?.length) {
      activeServiceNameList.value = getServiceJson.value.map(
        (item) => item.name,
      );
    }
    if (props.type === 'edit' && props) {
      getServiceYamlFun(props.serviceId);
    }
  },
  { immediate: true, deep: true },
);

watch(getServiceYaml, () => {
  yamlToJsonContent.value = jsYaml.load(getServiceYaml.value);
});
watch(
  () => themeStore.theme,
  () => {
    if (themeStore.theme === 'dark') {
      extensions.value = [yaml(), oneDark];
    } else {
      extensions.value = [yaml()];
    }
  },
);

const updateFunc = () => {
  const foldDoms = document.querySelectorAll('span[title="Fold line"]');
  foldDoms.forEach((dom) => {
    dom.innerText = '';
  });

  const unFoldDoms = document.querySelectorAll('span[title="Unfold line"]');
  unFoldDoms.forEach((dom) => {
    dom.innerText = '';
  });
};
onMounted(() => {
  if (themeStore.theme === 'dark') {
    extensions.value = [yaml(), oneDark];
  } else {
    extensions.value = [yaml()];
  }
});
</script>
<template>
  <CustomLoading :loading="loading"></CustomLoading>
  <el-upload
    v-if="uploadtype === 'upload'"
    action=""
    drag
    multiple
    :show-file-list="false"
    :on-success="handleSuccess"
    :before-upload="beforeUpload"
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
          {{ $t('semantic.tip1') }}
          <div style="margin-top: 16px">
            <el-button type="primary" size="small">
              {{ $t('semantic.choose_file') }}
            </el-button>
          </div>
        </div>
        <div class="upload-tip">
          {{ $t('semantic.tip2') }}
        </div>
      </div>
      <div v-if="progressVal && !uploadDone" class="upload-loading">
        <el-progress
          class="uplaod-progress"
          :percentage="progressVal"
          :stroke-width="8"
        />
      </div>
    </div>
  </el-upload>
  <div class="code-container" v-if="uploadtype === 'edit'">
    <span class="serviceName" v-if="getServiceName">{{ getServiceName }}</span>
    <!-- <Codemirror
      v-model="getServiceYaml"
      placeholder="Code goes here..."
      :autofocus="true"
      :indent-with-tab="true"
      :tab-size="2"
      :extensions="extensions"
      :disabled="!editable"
      @ready="handleReady"
      @update="updateFunc"
      @change="handleChange"
    /> -->
    <MonacoEditor
      v-if="uploadtype === 'edit' && getServiceYaml"
      :yamlContent="getServiceYaml"
      placeholder="Code goes here..."
      :readOnly="!editable"
      :handleQueryYamlValue="handleChange"
    />
  </div>
  <div class="json-container" v-if="uploadtype === 'get'">
    <span class="serviceName" v-if="getServiceName">{{ getServiceName }}</span>
    <el-collapse
      v-model="activeServiceNameList"
      class="o-hpc-collapse"
      :prefix-icon="IconChevronDown"
    >
      <!-- 这里直接展示输入和输出 -->
      <el-collapse-item
        v-for="(item, index) in getServiceJson"
        :key="index"
        :name="item.name"
      >
        <template #title>
          <el-icon
            class="el-collapse-item__arrow"
            :class="{ 'is-active': activeServiceNameList.includes(item.name) }"
          >
            <IconCaretRight></IconCaretRight>
          </el-icon>
          <span class="el-collapse-item__title">{{ item.name }}</span>
          <!-- 这里接口返回的需要限制最大位数 -->
        </template>
        <div class="o-collapse-content">
          <div class="itemTitle">
            <div class="subName">
              <div>{{ $t('semantic.interface_path') }}</div>
              <div>{{ item.path }}</div>
            </div>
            <div class="subName">
              <div>{{ $t('semantic.interface_description') }}</div>
              <div>{{ item.description }}</div>
            </div>
          </div>
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
  <div class="drawerFooter" v-if="uploadtype === 'upload'">
    <el-button @click="handleClose">{{ $t('semantic.cancel') }}</el-button>
    <el-button type="primary" @click="handleClose">
      {{ $t('semantic.submit') }}
    </el-button>
  </div>
  <div class="drawerFooter" v-if="uploadtype === 'edit'">
    <el-button @click="handleClose">{{ $t('semantic.cancel') }}</el-button>
    <el-button @click="handleEdit">{{ $t('semantic.edit') }}</el-button>
    <el-button type="primary" @click="handleCreateapi()">
      {{ $t('semantic.analyze') }}
    </el-button>
  </div>
  <div class="drawerFooter" v-if="uploadtype === 'get'">
    <el-button @click="handleClose">{{ $t('semantic.cancel') }}</el-button>
    <el-button type="primary" @click="handleClose">
      {{ $t('semantic.submit') }}
    </el-button>
  </div>
</template>

<style lang="scss" scoped>
.el-collapse-item__title {
  display: block;
  position: relative;
  left: 4px;
}
.code-container {
  height: calc(100% - 48px);
}
.serviceName {
  display: block;
  font-size: 14px;
  color: var(--o-text-color-primary);
  line-height: 22px;
  margin-bottom: 8px;
}
.json-container {
  max-height: calc(100% - 8px);
  overflow-y: scroll;
}
.v-codemirror {
  height: 100%;
  width: 100%;
  ::v-deep(.cm-editor) {
    height: 100%;
    border: 1px solid var(--o-time-text);
    .cm-gutters {
      background-color: var(--o-bash-bg);
      span[title='Fold line'] {
        width: 0;
        height: 0;
        display: block;
        border: 4px solid transparent;
        border-top: 4px solid #8d98aa;
        margin-top: 8px;
        padding: 0;
      }
      span[title='Unfold line'] {
        width: 0;
        height: 0;
        display: block;
        border: 4px solid transparent;
        border-left: 4px solid #8d98aa;
        margin-top: 6px;
        margin-left: 4px;
        padding: 0;
      }
    }
  }
  .cm-focused {
    outline: none;
  }
}
::v-deep(.el-upload.is-drag) {
  display: block !important;
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
  width: 100%;
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

.json-container {
  :deep(.el-collapse-item__header) {
    background-color: var(--el-collapse-header-bg) !important;
    height: 32px;
    padding: 8px 12px !important;
    border-bottom: 1px solid var(--el-collapse-border) !important;
    border-bottom-color: var(--el-collapse-border) !important;
  }
  :deep(.el-collapse-item__content) {
    background-color: var(--el-collapse-content-bg) !important;
    margin: 0px;
    border-bottom: 1px solid var(--el-collapse-border) !important;
    border-bottom-color: var(--el-collapse-border) !important;
  }
  :deep(.el-collapse-item__wrap) {
    border-bottom: 1px solid var(--el-collapse-border) !important;
    border-bottom-color: var(--el-collapse-border) !important;
  }
}

.o-collapse-content {
  padding: 8px 32px 0px;
  padding-left: 32px;
  .subName {
    margin-bottom: 8px;
    width: 100%;
    line-height: 16px;
    display: flex;
    align-items: flex-start;
    div:first-child {
      height: auto;
      text-align: center;
      min-width: 50px;
      color: var(--o-font-size-subtitle);
    }
    div:last-child {
      padding: 0px 12px;
      word-break: break-all;
    }
  }
}
</style>

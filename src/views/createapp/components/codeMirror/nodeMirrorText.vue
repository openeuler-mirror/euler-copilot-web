<template>
  <!-- 这里为下拉面板结果详情 -->
  <el-collapse
    v-model="nodeResult"
    class="o-hpc-collapse resultDropDown"
    :prefix-icon="IconChevronDown"
  >
    <!-- 这里直接展示输入和输出 -->
    <el-collapse-item
      v-for="(item, index) in resultInfo.infoList"
      :key="index"
      :name="item.id"
    >
      <template #title>
        <span class="icon" :class="`${resultInfo.status}Icon`"></span>
        <span>{{ t(`flow.${resultInfo.title}`) }}</span>
        <!-- 这里接口返回的需要限制最大位数 -->
        <span
          class="time"
          :class="`${resultInfo.status}Bg`"
          v-if="resultInfo.time"
        >
          {{ resultInfo.time }}
        </span>
        <span class="flexRight">{{ t('flow.result') }}</span>
        <el-icon class="el-collapse-item__arrow">
          <IconChevronDown></IconChevronDown>
        </el-icon>
      </template>
      <div
        v-for="(subItem, idx) in item.desc"
        :key="idx"
        class="o-collapse-content"
      >
        <div class="itemTitle">
          <div class="subName">{{ t(`flow.${subItem.name}`) }}</div>
          <div
            class="copyIcon"
            :class="themeStore.theme === 'light' ? 'lightCopy' : 'darkCopy'"
            @click="handleCopy(subItem.code)"
          ></div>
        </div>
        <div class="monaco-container" :class="{ outputMirror: idx === 1 }">
          <JSONMonacoEditor
            :ref="(el) => setEditorRef(el, `${item.id}-${idx}`)"
            v-model="editorContents[`${item.id}-${idx}`]"
            :style="CODE_STYLE"
            :autofocus="false"
            :theme="currentTheme"
            :disabled="true"
            @ready="(payload) => handleReady(payload, `${item.id}-${idx}`, subItem.code)"
            @change="(value) => handleChange(value, subItem, idx)"
          />
        </div>
      </div>
    </el-collapse-item>
  </el-collapse>
</template>

<script lang="ts" setup>
import { ref, watch, computed, nextTick } from 'vue';
import { IconChevronDown } from '@computing/opendesign-icons';
import JSONMonacoEditor from '@/components/JSONMonacoEditor.vue';
import { useChangeThemeStore } from '@/store';
import yaml from 'js-yaml';

import { errorMsg, successMsg } from 'src/components/Message';
import { StatusInfoTitle } from '../types';
import { useI18n } from 'vue-i18n';

const CODE_STYLE = {
  width: '100%',
  height: '160px',
  maxHeight: '160px',
  overflowY: 'auto',
  fontSize: '14px',
  lineHeight: '16px',
};

const props = defineProps({
  status: {
    default: 'default',
  },
  costTime: {
    default: '',
  },
  inputAndOutput: Object,
});

const themeStore = useChangeThemeStore();
const { t } = useI18n();
const nodeResult = ref();

// Monaco Editor 引用管理
const monacoEditorRefs = ref(new Map());
const editorContents = ref({});

const currentTheme = computed(() => {
  return themeStore.theme === 'dark' ? 'dark' : 'light';
});

// 智能处理不同类型的数据
const formatCodeData = (data: any) => {
  if (data === null || data === undefined) {
    return '';
  }
  
  if (typeof data === 'string') {
    // 如果是字符串，检查是否是有效的JSON
    try {
      const parsed = JSON.parse(data);
      return JSON.stringify(parsed, null, 2);
    } catch {
      // 如果不是JSON，尝试用YAML格式化
      try {
        return yaml.dump(data, { indent: 2, lineWidth: -1 });
      } catch {
        return data;
      }
    }
  }
  
  if (typeof data === 'object') {
    try {
      // 尝试JSON格式化
      return JSON.stringify(data, null, 2);
    } catch {
      // 如果JSON格式化失败，尝试YAML
      try {
        return yaml.dump(data, { indent: 2, lineWidth: -1 });
      } catch {
        return String(data);
      }
    }
  }
  
  // 其他类型转为字符串
  return String(data);
};

// 初始化编辑器内容（为默认数据设置初始值）
const initializeEditorContents = () => {
  resultInfo.value.infoList.forEach((item) => {
    item.desc.forEach((subItem, idx) => {
      const key = `${item.id}-${idx}`;
      editorContents.value[key] = formatCodeData(subItem.code);
    });
  });
};

// 设置编辑器引用
const setEditorRef = (el: any, key: string) => {
  if (el) {
    monacoEditorRefs.value.set(key, el);
  }
};

// 编辑器准备就绪回调
const handleReady = (payload: any, editorKey: string, code?: any) => {
  if (payload && payload.editor) {
    console.log(`📝 Monaco editor ready for ${editorKey}`);
    
    // 设置初始内容
    if (code !== undefined) {
      const formattedCode = formatCodeData(code);
      editorContents.value[editorKey] = formattedCode;
    }
    
    // 延迟设置值以确保编辑器完全初始化
    setTimeout(() => {
      if (payload.editor && typeof payload.editor.setValue === 'function') {
        const editor = monacoEditorRefs.value.get(editorKey);
        if (editor) {
          payload.editor.layout && payload.editor.layout();
        }
      }
    }, 100);
  }
};

// 处理编辑器内容变化（只读模式下基本不会触发）
const handleChange = (value: string, subItem: any, idx: number) => {
  // 由于是只读模式，这里基本不会执行
  console.log(`Content changed for ${subItem.name}:`, value);
};

// 强制刷新编辑器
const forceRefreshEditor = (editorKey: string) => {
  const editor = monacoEditorRefs.value.get(editorKey);
  if (editor && editor.$refs && editor.$refs.editor) {
    console.log(`🔄 Force refreshing Monaco Editor: ${editorKey}`);
    const monacoInstance = editor.$refs.editor;
    // 触发布局更新
    monacoInstance.layout && monacoInstance.layout();
  }
};

// 强制刷新所有编辑器
const forceRefreshAllEditors = () => {
  monacoEditorRefs.value.forEach((editor, key) => {
    forceRefreshEditor(key);
  });
};

const resultInfo = ref({
  time: '3.1s',
  status: '', // 成功/失败/运行中三种状态
  title: '运行成功',
  infoList: [
    {
      id: '1',
      desc: [
        // 定义的假数据，后期由接口获取
        {
          name: 'input',
          code: '',
        },
        {
          name: 'output',
          code: '',
        },
      ],
    },
  ],
});

// 初始化编辑器内容
initializeEditorContents();

watch(
  () => props,
  () => {
    resultInfo.value.status = props.status;
    // 目前props.status只有success、error、running三种
    resultInfo.value.title = StatusInfoTitle[props.status];
    if (props?.inputAndOutput) {
      resultInfo.value.time =
        props.inputAndOutput.input_parameters.timeout ?? 0;
      resultInfo.value.infoList[0].desc[0].code =
        props.inputAndOutput.input_parameters;
      resultInfo.value.infoList[0].desc[1].code =
        props.inputAndOutput.output_parameters;
      
      // 更新编辑器内容
      const inputKey = '1-0';
      const outputKey = '1-1';
      editorContents.value[inputKey] = formatCodeData(props.inputAndOutput.input_parameters);
      editorContents.value[outputKey] = formatCodeData(props.inputAndOutput.output_parameters);
    }
    if (props.status === 'success' || props.status === 'error') {
      resultInfo.value.time = props.costTime;
    } else {
      resultInfo.value.time = '';
    }
    
    // 数据更新后延迟刷新所有编辑器
    nextTick(() => {
      setTimeout(() => {
        forceRefreshAllEditors();
      }, 200);
    });
  },
  { deep: true, immediate: true },
);

// 复制
const handleCopy = (code) => {
  // 判断是否有值
  if (!code) {
    errorMsg(t('feedback.noCopyMessage'));
    return;
  }
  
  try {
    // 优先使用格式化后的内容
    const formattedCode = formatCodeData(code);
    
    // 使用现代clipboard API或降级方法
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(formattedCode)
        .then(() => {
          successMsg(t('feedback.copied_successfully'));
        })
        .catch((err) => {
          console.error('复制文本时出错:', err);
          fallbackCopy(formattedCode);
        });
    } else {
      fallbackCopy(formattedCode);
    }
  } catch (error) {
    console.error('复制时出错:', error);
    // 降级使用原始内容
    try {
      const fallbackContent = typeof code === 'string' ? code : yaml.dump(code);
      if (navigator.clipboard) {
        navigator.clipboard.writeText(fallbackContent).then(() => {
          successMsg(t('feedback.copied_successfully'));
        }).catch(() => {
          fallbackCopy(fallbackContent);
        });
      } else {
        fallbackCopy(fallbackContent);
      }
    } catch (fallbackError) {
      console.error('降级复制也失败:', fallbackError);
      errorMsg(t('feedback.noCopyMessage'));
    }
  }
};

// 降级复制方法
const fallbackCopy = (text: string) => {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
    successMsg(t('feedback.copied_successfully'));
  } catch (err) {
    console.error('降级复制方法也失败了:', err);
    errorMsg(t('feedback.noCopyMessage'));
  } finally {
    document.body.removeChild(textArea);
  }
};
</script>
<style lang="scss">
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.resultDropDown {
  position: absolute;
  width: 100%;
  min-height: 32px;
  line-height: 32px;
  height: fit-content;
  left: 0px;
  background-color: var(--o-bg-color-base);
  top: calc(100% + 12px);
  box-shadow: var(--flow-nodeBox-shadow);
  border-radius: 8px;
  .el-collapse-item__header {
    padding: 8px 16px;
    height: 32px;
    line-height: 32px;
    box-sizing: border-box;
    display: flex;
    gap: 8px;
    .icon {
      width: 16px;
      height: 16px;
      background-size: contain !important;
    }
    .successIcon {
      background: url(@/assets/images/flow_success.png) center center no-repeat;
    }

    .errorIcon {
      background: url(@/assets/images/flow_fail.png) center center no-repeat;
    }

    .runningIcon {
      background: url(@/assets/images/loading.png) center center no-repeat;
      animation: spin 2s linear infinite;
    }
    .time {
      height: 16px;
      line-height: 16px;
      padding: 0px 8px;
      border-radius: 4px;
    }
    .flexRight {
      margin-left: auto;
      margin-right: -4px;
    }
  }
  .el-collapse-item__content {
    .itemTitle {
      display: flex;
      width: 100%;
      height: 32px;
      background-color: var(--o-time-text);
      padding: 8px 16px;
      .subName {
        flex: 1;
        font-size: 16px;
        line-height: 16px;
      }
      .copyIcon {
        width: 16px;
        cursor: pointer;
      }
      .lightCopy {
        background: url(@/assets/svgs/light_copy.svg) center center no-repeat;
      }
      .darkCopy {
        background: url(@/assets/svgs/light_copy.svg) center center no-repeat;
      }
    }
    .o-collapse-content {
      padding-left: 0px;
      margin-bottom: 8px;
      
      .monaco-container {
        height: 160px;
        max-height: 160px;
        overflow: hidden;
        border: 1px solid var(--o-time-text);
        border-radius: 4px;
        
        // 确保Monaco Editor容器样式
        :deep(.monaco-editor-container) {
          height: 160px !important;
          
          .monaco-editor {
            height: 160px !important;
          }
        }
        
        // 兼容JSON Monaco Editor的样式
        :deep(.json-monaco-editor) {
          height: 160px !important;
          
          .editor-container {
            height: 160px !important;
            border: none;
          }
        }
      }
      
      &:last-child {
        margin-bottom: 0px;
      }
    }
  }
}
</style>

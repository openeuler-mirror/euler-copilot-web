<script lang="ts" setup>
import { Position, Handle } from '@vue-flow/core';
import { ref, watch } from 'vue';
import NodeMirrorText from '../codeMirror/nodeMirrorText.vue';
import { CopyDocument, WarnTriangleFilled, Delete, Plus } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { IconSuccess } from '@computing/opendesign-icons';
import { getSrcIcon, getNodeClass } from '../types';
import { useI18n } from 'vue-i18n';
const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  data: {
    type: Object, // 目前定义的对象中只有label，desc属性是有的，后续可能会有展开的情形
    required: true,
  },
  type: {
    type: String,
    required: false,
  },
  position: {
    type: Object,
    required: false,
  },
  disabled: {
    type: Boolean,
    required: false,
  },
  selected: {
    type: Boolean,
    default: false,
  },
});
const emits = defineEmits(['delNode', 'editYamlDrawer', 'updateConnectHandle', 'insertNodeFromHandle']);
const { t } = useI18n();

const statusList = ref(['running', 'success', 'error']);
const nodeDescription = ref<string[]>([]);
// 当前节点状态-工作流调试结果-成功/失败/运行中
const curStatus = ref('');

// 当前节点运行耗时
const costTime = ref('');

// 当前handle是否连接中[分别是target和source]
const handleTargetConnecting = ref(false);
const handleSourceConnecting = ref(false);

// Handle位置插入按钮的悬停状态
const sourceHandleHovered = ref(false);

// 定义传给mirror展示输入输出的存储量
const inputAndOutput = ref({
  input_parameters: {},
  output_parameters: {},
});

// 控制删除按钮文字显示
const showDeleteText = ref(false);

watch(
  () => props.data,
  () => {
    nodeDescription.value = props.data.description.split('\n\n') || [];
    const isInclude = statusList.value.includes(props.data?.status);
    // 设置节点的状态-默认以及成功、失败、运行中
    if (!isInclude) {
      curStatus.value = 'default';
    } else {
      curStatus.value = props.data?.status;
    }
    // 节点调试消耗时间【目前只有调试接口返回的节点step.output才有值，其余状态为''不显示】
    costTime.value = props.data?.constTime || '';
    // 判断是否有调试的输入输出，有调试的输入输出，需要将其显示/否则显示默认的输出
    if (props.data.content?.type === 'input') {
      inputAndOutput.value.input_parameters = props.data.content.params;
    } else if (props.data.content?.type === 'output') {
      inputAndOutput.value.output_parameters = props.data.content.params;
    } else {
      inputAndOutput.value.input_parameters =
        props.data?.parameters?.input_parameters || {};
      inputAndOutput.value.output_parameters =
        props.data?.parameters?.output_parameters || {};
    }
    handleTargetConnecting.value = false;
    handleSourceConnecting.value = false;
  },
  { deep: true, immediate: true },
);

// 删除节点
const delNode = (id) => {
  emits('delNode', id);
};

// 编辑yaml
const editYaml = (nodeName, nodeDesc, yamlCode) => {
  emits('editYamlDrawer', nodeName, nodeDesc, yamlCode, props.id);
};

// 设置当前正在连接[这里是使连接过程中，handle节点高亮]
const setConnectStatus = (type) => {
  if (type === 'source') {
    handleSourceConnecting.value = true;
  } else {
    handleTargetConnecting.value = true;
  }
  // 更新当前节点handle连接状态
  emits('updateConnectHandle', props.id);
};

// 处理节点点击事件
const handleNodeClick = () => {
  if (!props.disabled) {
    editYaml(props.data.name, props.data.description, props.data.parameters);
  }
};

const handleCopyTextToclipboard = (text) => {
  const input = document.createElement('input');
  input.value = text;
  document.body.appendChild(input);
  input.select();
  document.execCommand('copy');
  ElMessage({
    showClose: true,
    message: t('feedback.copied_successfully'),
    icon: IconSuccess,
    customClass: 'o-message--success',
    duration: 2000,
  });
  document.body.removeChild(input);
};

// 处理source handle插入节点事件
const handleSourceInsertNode = (event) => {
  event.stopPropagation();
  if (props.disabled) {
    return;
  }
  
  // 发射插入节点事件，传递节点信息和handle类型
  emits('insertNodeFromHandle', {
    nodeId: props.id,
    handleType: 'source',
    nodePosition: props.position
  });
};

// Handle悬停事件处理
const handleSourceHandleEnter = () => {
  if (!props.disabled) {
    sourceHandleHovered.value = true;
  }
};

const handleSourceHandleLeave = () => {
  sourceHandleHovered.value = false;
};
</script>

<template>
  <div class="customNodeStyle" :class="[curStatus, { 'node-selected': selected }]">
    <Handle
      :class="{ isConnecting: handleTargetConnecting }"
      @mousedown="setConnectStatus('target')"
      type="target"
      :position="Position.Left"
    />
    

    <div class="nodeContainer">
      <div class="nodeBox" :class="getNodeClass(props.data)" @click="handleNodeClick">
        <div class="title" v-if="props.data.name">
          <div class="iconLabel">
            <img
              class="iconStyle"
              v-if="props.data.nodeId"
              :src="getSrcIcon(props.data)"
            />
            <el-icon v-else class="warnTiangleIcon">
              <WarnTriangleFilled />
            </el-icon>
            <div class="label">{{ props.data.name }}</div>
          </div>
        </div>
        <!-- 移除description显示 -->
      </div>
      <!-- 将ID移到footer位置，设为次要样式 -->
      <div class="nodeFooter" v-if="props.id">
        <div class="nodeIdText">
          <span>{{ props.id }}</span>
        </div>
        <el-icon
          class="copydocument"
          @click="handleCopyTextToclipboard(props.id)"
        >
          <CopyDocument />
        </el-icon>
      </div>
    </div>
    
    <!-- 右上角删除按钮小卡片 -->
    <div class="deleteCardWrapper" v-if="!props.disabled">
      <div class="deleteCard">
        <button
          class="deleteButton"
          @click="delNode(props.id)"
          :title="$t('semantic.interface_delete')"
          @mouseenter="showDeleteText = true"
          @mouseleave="showDeleteText = false"
        >
          <el-icon class="delete-icon">
            <Delete />
          </el-icon>
          <span class="delete-text" v-show="showDeleteText">{{ $t('semantic.interface_delete') }}</span>
        </button>
      </div>
    </div>
    
    <Handle
      type="source"
      :position="Position.Right"
      @mousedown="setConnectStatus('source')"
      :class="{ isConnecting: handleSourceConnecting }"
      :connectable="props.data?.isConnectSource"
    />
    
    <!-- Source +按钮 - 独立定位，远离Handle -->
    <div 
      v-if="!props.disabled"
      class="handle-plus-button source-plus"
      @mouseenter="handleSourceHandleEnter"
      @mouseleave="handleSourceHandleLeave"
      @click="handleSourceInsertNode"
    >
      <el-icon v-if="sourceHandleHovered" class="plus-icon">
        <Plus />
      </el-icon>
    </div>
    <!-- 调试时出现-暂时隐藏 -->
    <NodeMirrorText
      v-if="curStatus !== 'default'"
      :status="curStatus"
      :costTime="costTime"
      :inputAndOutput="inputAndOutput"
      style="display: block"
    ></NodeMirrorText>
  </div>
</template>

<style scoped>
.customNodeStyle {
  position: relative;
  /* 确保Handle容器能正确定位 */
}

.deleteCardWrapper {
  position: absolute;
  top: -8px;
  right: -8px;
  z-index: 10;
}

.deleteCard {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 自定义删除按钮样式 - 悬浮圆形到圆角矩形动画 */
.deleteButton {
  /* 基础样式 */
  border: none;
  background-color: #f56c6c;
  color: #ffffff;
  cursor: pointer;
  padding: 0;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  
  /* 圆形按钮尺寸 */
  width: 32px;
  height: 32px;
  border-radius: 50%;
  
  /* 布局样式 */
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  overflow: hidden;
  
  /* 悬浮效果 */
  box-shadow: 0 4px 12px rgba(245, 108, 108, 0.4);
  
  /* 动画效果 - 分离不同属性的动画时间 */
  transition: 
    width 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    border-radius 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    padding 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.3s ease;
  
  /* 初始变形状态 */
  transform: scaleX(1) translateY(0);
  transform-origin: center;
  
  /* 移除默认按钮样式 */
  outline: none;
  text-decoration: none;
  box-sizing: border-box;
}

.deleteButton:hover {
  background-color: #f56c6c;
  color: #ffffff;
  
  /* 展开为圆角矩形 */
  width: 88px;
  height: 32px;
  border-radius: 16px;
  padding: 0 12px;
  
  /* 左右拉伸变形效果 */
  transform: scaleX(1.05) translateY(-1px);
  
  /* 增强悬浮效果 */
  box-shadow: 0 6px 20px rgba(245, 108, 108, 0.5);
}

.deleteButton:active {
  background-color: #e6a23c;
  box-shadow: 0 2px 8px rgba(245, 108, 108, 0.6);
  transform: scaleX(1) translateY(0);
}

.deleteButton:focus {
  outline: 2px solid #f56c6c40;
  outline-offset: 2px;
}

.delete-icon {
  font-size: 14px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.deleteButton:hover .delete-icon {
  transform: scale(0.9);
}

.delete-text {
  font-size: 12px;
  margin-left: 6px;
  opacity: 0;
  transform: translateX(-8px) scale(0.8);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.deleteButton:hover .delete-text {
  opacity: 1;
  transform: translateX(0) scale(1);
}

/* 只在hover整个节点时显示删除卡片 */
.customNodeStyle .deleteCardWrapper {
  opacity: 0;
  transition: opacity 0.2s;
}

.customNodeStyle:hover .deleteCardWrapper {
  opacity: 1;
}

/* +按钮容器 - 独立定位，远离Handle */
.handle-plus-button {
  position: absolute;
  width: 40px; /* 扩大触发区域 */
  height: 40px; /* 扩大触发区域 */
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 15;
  pointer-events: auto;
  transition: all 0.2s ease;
  /* 调试时可以启用这个边框来查看触发区域 */
  /* border: 1px dashed rgba(99, 149, 253, 0.3); */
}



/* Source handle的+按钮位置 - 在节点右侧，触发区域延伸到节点边缘 */
.source-plus {
  right: -25px; /* 稍微靠近节点，扩大的触发区域会延伸到节点 */
  top: 50%;
  transform: translate(50%, -50%); /* 居中对齐，让触发区域更合理 */
}

/* +图标样式 */
.handle-plus-button .plus-icon {
  font-size: 11px;
  color: #6395fd;
  background: #ffffff;
  border: 1px solid #6395fd;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 3px 8px rgba(99, 149, 253, 0.4);
  transition: all 0.2s ease;
  opacity: 0.9;
}

.handle-plus-button .plus-icon:hover {
  background: #6395fd;
  color: #ffffff;
  transform: scale(1.15);
  box-shadow: 0 5px 15px rgba(99, 149, 253, 0.6);
  opacity: 1;
}

/* 仅在节点悬停时显示+按钮 */
.customNodeStyle .handle-plus-button {
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s ease 0s, visibility 0s ease 0.5s; /* 延迟隐藏 */
}

.customNodeStyle:hover .handle-plus-button,
.customNodeStyle .handle-plus-button:hover {
  opacity: 1;
  visibility: visible;
  transition: opacity 0.2s ease 0s, visibility 0s ease 0s; /* 立即显示 */
}

/* 黑夜模式支持 - 使用用户指定的颜色规范 */
.dark .customNodeStyle {
  background: #353f58 !important;
  border: 2px solid rgba(255, 255, 255, 0.08) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4) !important;
  }
  
  .nodeBox {
    background: #353f58 !important;
    
    .title {
      .label {
        color: #ffffff !important;
      }
    }
    
    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25) !important;
    }
  }
  
  .nodeFooter {
    background: rgba(255, 255, 255, 0.05) !important;
    border-top-color: rgba(255, 255, 255, 0.08) !important;
    
    .nodeIdText {
      color: rgba(255, 255, 255, 0.6) !important;
    }
    
    .copydocument {
      color: rgba(255, 255, 255, 0.6) !important;
      
      &:hover {
        color: rgba(255, 255, 255, 0.8) !important;
      }
    }
  }
  
  .deleteButton {
    background-color: #e53e3e;
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(229, 62, 62, 0.4);
    
    &:hover {
      background-color: #c53030;
      box-shadow: 0 6px 20px rgba(229, 62, 62, 0.5);
    }
    
    &:active {
      background-color: #9c2222;
    }
  }
  
  .handle-plus-button .plus-icon {
    background: #353f58;
    border-color: #63b3ed;
    color: #63b3ed;
    box-shadow: 0 3px 8px rgba(99, 179, 237, 0.4);
    
    &:hover {
      background: #63b3ed;
      color: #353f58;
      box-shadow: 0 5px 15px rgba(99, 179, 237, 0.6);
    }
  }
}
</style>

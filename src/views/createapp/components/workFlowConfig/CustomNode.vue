<script lang="ts" setup>
import { Position, Handle } from '@vue-flow/core';
import { ref, watch } from 'vue';
import NodeMirrorText from '../codeMirror/nodeMirrorText.vue';
import { CopyDocument, WarnTriangleFilled } from '@element-plus/icons-vue';
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
});
const emits = defineEmits(['delNode', 'editYamlDrawer', 'updateConnectHandle']);
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

// 定义传给mirror展示输入输出的存储量
const inputAndOutput = ref({
  input_parameters: {},
  output_parameters: {},
});

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
const editYaml = (nodeName, nodeDesc, yamlCode, nodeId) => {
  emits('editYamlDrawer', nodeName, nodeDesc, yamlCode, props.id, nodeId);
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
</script>

<template>
  <div class="customNodeStyle" :class="curStatus">
    <Handle
      :class="{ isConnecting: handleTargetConnecting }"
      @mousedown="setConnectStatus('target')"
      type="target"
      :position="Position.Left"
    ></Handle>
    <div class="nodeBox" :class="getNodeClass(props.data)">
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

        <div class="moreTip" :class="{ notAllow: props.disabled }">
          <el-popover
            :disabled="props.disabled"
            placement="bottom-end"
            trigger="hover"
            popper-class="nodeDealPopper"
          >
            <template #reference>
              <div class="moreDots">
                <div class="nodeDot"></div>
                <div class="nodeDot"></div>
                <div class="nodeDot"></div>
              </div>
            </template>
            <el-button
              text
              class="dealItem"
              @click="
                editYaml(
                  props.data.name,
                  props.data.description,
                  props.data.parameters,
                  props.data.nodeId
                )
              "
            >
              {{ $t('semantic.edit') }}
            </el-button>
            <el-button text class="dealItem" @click="delNode(props.id)">
              {{ $t('semantic.interface_delete') }}
            </el-button>
          </el-popover>
        </div>
      </div>
      <div class="desc" v-if="props.data.description">
        <div
          v-for="(desc, index) in nodeDescription"
          :class="{ descSign: nodeDescription.length > 1 && !index }"
          :key="index"
        >
          {{ desc }}
        </div>
      </div>
      <div class="nodeIdShow" v-if="props.id">
        <div class="nodeIdText">
          <span>ID:</span>
          <span>
            {{ props.id }}
          </span>
        </div>
        <el-icon
          class="copydocument"
          @click="handleCopyTextToclipboard(props.id)"
        >
          <CopyDocument />
        </el-icon>
      </div>
    </div>
    <Handle
      type="source"
      :position="Position.Right"
      @mousedown="setConnectStatus('source')"
      :class="{ isConnecting: handleSourceConnecting }"
      :connectable="props.data?.isConnectSource"
    ></Handle>
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

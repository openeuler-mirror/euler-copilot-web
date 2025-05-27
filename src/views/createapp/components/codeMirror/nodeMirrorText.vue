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
        <span>{{ resultInfo.title }}</span>
        <!-- 这里接口返回的需要限制最大位数 -->
        <span
          class="time"
          :class="`${resultInfo.status}Bg`"
          v-if="resultInfo.time"
        >
          {{ resultInfo.time }}
        </span>
        <span class="flexRight">展开结果</span>
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
          <div class="subName">{{ subItem.name }}</div>
          <div
            class="copyIcon"
            :class="themeStore.theme === 'light' ? 'lightCopy' : 'darkCopy'"
            @click="handleCopy(subItem.code)"
          ></div>
        </div>
        <MirrorText
          ref="textarea"
          :class="{ outputMirror: idx === 1 }"
          :yamlCode="yaml.dump(subItem.code)"
          :disabled="true"
        ></MirrorText>
      </div>
    </el-collapse-item>
  </el-collapse>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import { IconChevronDown } from '@computing/opendesign-icons';
import MirrorText from '../codeMirror/mirrorTextArea.vue';
import { useChangeThemeStore } from 'src/store/conversation';
import yaml from 'js-yaml';
import { writeText } from 'src/utils';
import { errorMsg, successMsg } from 'src/components/Message';
import { StatusInfoTitle } from '../types';
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
const nodeResult = ref();
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
          name: '输入',
          code: '',
        },
        {
          name: '输出',
          code: '',
        },
      ],
    },
  ],
});

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
    }
    if (props.status === 'success' || props.status === 'error') {
      resultInfo.value.time = props.costTime;
    } else {
      resultInfo.value.time = '';
    }
  },
  { deep: true, immediate: true },
);

// 复制
const handleCopy = (code) => {
  // 判断是否有值
  if (!code) {
    errorMsg($t('feedback.noCopyMessage'));
    return;
  }
  writeText(yaml.dump(code));
  successMsg($t('feedback.copied_successfully'));
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
      .cm-editor {
        max-height: 160px;
        overflow-y: auto;
        .cm-gutterElement {
          span[title='Fold line'] {
            display: none;
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

<script lang="ts" setup>
import type { DialoguePanelType } from './type';
import marked from 'src/utils/marked.js';
import { computed, ref, withDefaults } from 'vue';
import { writeText } from 'src/utils';
import {
  useSessionStore,
  useChangeThemeStore,
  echartsObj,
} from 'src/store/conversation';
import { useHistorySessionStore } from 'src/store';
import AgainstPopover from 'src/views/dialogue/components/AgainstPopover.vue';
import dayjs from 'dayjs';
import xss from 'xss';
import { errorMsg, successMsg } from 'src/components/Message';
import ReportPopover from 'src/views/dialogue/components/ReportPopover.vue';
import DialogueThought from './DialogueThought.vue';
import { onMounted, watch, onBeforeUnmount, reactive } from 'vue';
import * as echarts from 'echarts';
import color from 'src/assets/color';
import i18n from 'src/i18n';
import { storeToRefs } from 'pinia';
import { useLangStore } from 'src/store';
const { user_selected_app } = storeToRefs(useHistorySessionStore());
import { Suggestion } from 'src/apis/paths/type';
const { params } = storeToRefs(useHistorySessionStore());
const { language } = storeToRefs(useLangStore());
const echartsDraw = ref();
const visible = ref(false);
export interface DialoguePanelProps {
  key: number;
  //
  cid: number;
  // groupid
  groupId: string;
  // 用来区分是用户还是ai的输入
  type: DialoguePanelType;
  // 文本内容
  inputParams: object;
  // 文本内容
  content?: string[] | string;
  // 当前选中的第n次回答的索引，默认是最新回答
  currentSelected?: number;
  // 文本内容是否生成完毕
  isFinish?: boolean;
  // 是否在loading
  isLoading?: boolean;
  // 创建时间
  createdAt?: string | Date;
  // 用户头像
  avatar?: string;
  // 是否需要重新生成
  needRegernerate?: boolean;
  // 是否选择插件
  userSelectedApp?: any;
  //
  recordList?: string[] | undefined;
  // MessageList 结构
  messageArray?: MessageArray[] | undefined;
  //
  isCommentList?: string[] | undefined;
  //
  search_suggestions?: any;
  //
  echartsObj?: any;
  //
  test?: any;
  //--时间-问题数-token
  metadata?: Metadata;
  // -工作流的相关数据
  flowdata?: any;
  // 缺少的参数列表-有可能
  paramsList?: any;
  // 工作流调试用不到
  modeOptions: any;
  // 新增是否是工作流调试的-用于修改调试抽屉样式
  isWorkFlowDebug: boolean;
}
import JsonFormComponent from './JsonFormComponent.vue';
import { Metadata } from 'src/apis/paths/type';
import DialogueFlow from './DialogueFlow.vue';
import { api } from 'src/apis';
import { MessageArray } from 'src/views/dialogue/types';
var option = ref();
var show = ref(false);
const size = reactive({
  width: 328,
  height: 416,
});
const themeStore = useChangeThemeStore();
var myChart;
const { pausedStream, reGenerateAnswer, prePage, nextPage } = useSessionStore();
const props = withDefaults(defineProps<DialoguePanelProps>(), {
  isFinish: false,
  // 当前选中的第n次回答的索引
  // currentSelected: 0,
  needRegernerate: false,
});
const messageArray = ref<MessageArray>(props.messageArray);
const thoughtContent = ref('');
const index = ref(0);
const isComment = ref("none");
const emits = defineEmits<{
  (e: 'handleReport', qaRecordId: string, reason?: string): void;
  (
    e: 'handleSendMessage',
    groupId: string | undefined,
    question: string,
    user_selected_flow?: any,
  ): void;
  (e: 'clearSuggestion', index: number): void;
}>();

// #region ----------------------------------------< pause and regenerate >--------------------------------------

/**
 * 暂停和重新生成问答
 */
const handlePauseAndReGenerate = (cid?: number) => {
  if (!cid) {
    return;
  }
  emits('clearSuggestion', props.key);
  if (props.isFinish) {
    // 重新生成
    thoughtContent.value = '';
    reGenerateAnswer(cid, user_selected_app.value);
    index.value = messageArray.value.getAllItems().length - 1;
    isComment.value = "none";
  } else {
    // 停止生成
    pausedStream(cid);
  }
};

// #endregion

// 复制
const handleCopy = (): void => {
  if (!props.content || !Array.isArray(props.content)) {
    errorMsg(i18n.global.t('feedback.copied_failed'));
    return;
  }
  writeText(props.content[props.currentSelected]);
  successMsg(i18n.global.t('feedback.copied_successfully'));
  return;
};
/**
 * 赞同与反对
 */
const handleLike = async (
  type: 'liked' | 'disliked' | 'report',
): Promise<void> => {
  const qaRecordId = props.recordList[index.value];
  if (type === 'liked') {
    await api.commentConversation({
      type: !isSupport.value ? 'liked' : 'none',
      qaRecordId: qaRecordId,
      comment: !isSupport.value ? 'liked' : 'none',
      groupId: props.groupId,
    }).then((res) => {
      if(res[1].code === 200){
        isSupport.value = isSupport.value ? false : true;
        isAgainst.value = false;
        messageArray.value.getAllItems()[index.value].comment = isSupport.value ? 'liked' : 'none';
      }
    })
  } else if (type === 'disliked') {
    if(isAgainst.value){
      await api.commentConversation({
      type: 'none',
      qaRecordId: qaRecordId,
      comment: 'none',
      groupId: props.groupId,
    }).then((res) => {
      if(res[1].code === 200){
        isAgainst.value = false;
        isSupport.value = false;
        messageArray.value.getAllItems()[index.value].comment = 'none';
      }
    })
    }else{
      isAgainstVisible.value = true;
    }
  } else {
    isReportVisible.value = true;
  }
};

/**
 * 反对
 * @param reason
 * @param reasionLink
 * @param reasonDescription
 */
const handleDislike = async (
  reason: string,
  reasionLink?: string,
  reasonDescription?: string,
): Promise<void> => {
  const qaRecordId = props.recordList[index.value];
  await api.commentConversation(
    {
      type: !isAgainst.value ? 'disliked' : 'none',
      qaRecordId: qaRecordId,
      comment: !isAgainst.value ? 'disliked' : 'none',
      dislikeReason: reason,
      groupId: props.groupId,
      reasonLink: reasionLink,
      reasonDescription: reasonDescription,
    }
  ).then((res) => {
    if(res[1].code === 200){
      isAgainstVisible.value = false;
      isAgainst.value = isAgainst.value ? false : true;
      isSupport.value = false;
      messageArray.value.getAllItems()[index.value].comment = isAgainst.value ? 'disliked' : 'none';
    };
  });
};

const handleOutsideClick = () => {
  isAgainstVisible.value = false;
};

const bindDocumentClick = () => {
  document.addEventListener('click', handleOutsideClick);
};

const unbindDocumentClick = () => {
  document.removeEventListener('click', handleOutsideClick);
};

// 举报功能
const handleReport = async (
  reason_type: string,
  reason: string,
): Promise<void> => {
  const qaRecordId = props.recordList[index.value];
  emits('handleReport', qaRecordId, reason_type, reason);
  isAgainstVisible.value = false;
};

//处理举报逻辑
const handleReportClick = () => {
  isReportVisible.value = false;
};

//处理举报逻辑
const bindReportClick = () => {
  document.addEventListener('click', handleReportClick);
};

//处理举报逻辑
const unbindReportClick = () => {
  document.removeEventListener('click', handleReportClick);
};

const isAgainstVisible = ref<boolean>(false);
const isReportVisible = ref<boolean>(false);

const txt2imgPathZoom = ref('');
// 解析完成后的文本内容
const contentAfterMark = computed(() => {
  if (!props.content) {
    return '';
  }
  //xxs将大于号转为html实体以防歧义；将< >替换为正常字符；
  let str = marked.parse(
    xss(props.content[index.value])
      .replace(/&gt;/g, '>')
      .replace(/&lt;/g, '<'),
  );
  //将table提取出来中加一个<div>父节点控制溢出
  let tableStart = str.indexOf('<table>');
  if (tableStart !== -1) {
    str =
      str.slice(0, tableStart) +
      '<div class="overflowTable">' +
      str
        .slice(tableStart, str.indexOf('</table>') + '</table>'.length)
        .replace('</table>', '</table></div>') +
      str.slice(str.indexOf('</table>') + '</table>'.length);
  }
  //仅获取第一个遇到的 think 标签
  const startIndex = str.indexOf('<think>');
  const endIndex = str.indexOf('</think>');
  if (startIndex !== -1 && endIndex === -1) {
    // 计算 <a> 之后的字符串
    const contentAfterA = str.substring(startIndex + 7); // +2 是因为我们要跳过 <a> 这两个字符
    thoughtContent.value = contentAfterA;
    return '';
  } else if (startIndex !== -1 && endIndex !== -1) {
    thoughtContent.value = str.match(/<think>([\s\S]*?)<\/think>/)[1];
  }
  return str.replace(/<think>([\s\S]*?)<\/think>/g, '');
});

const prePageHandle = (cid: number) => {
  thoughtContent.value = '';
  prePage(cid);
  if (index.value === 0) {
    index.value = 0;
  } else {
    index.value--;
    isComment.value = messageArray.value.getAllItems()[index.value].comment;
    handleIsLike();
  }
};

const nextPageHandle = (cid: number) => {
  thoughtContent.value = '';
  nextPage(cid);
  if (index.value === (props.content as string[]).length - 1) {
    index.value = (props.content as string[]).length - 1;
  } else {
    index.value++;
    isComment.value = messageArray.value.getAllItems()[index.value].comment;
    handleIsLike();
  }
};

const isSupport = ref(false);
const isAgainst = ref(false);

const handleIsLike = () => {
  if (isComment.value === undefined) {
    isSupport.value = false;
    isAgainst.value = false;
  } else {
      if (isComment.value !== 'none') {
        isSupport.value = isComment.value === 'liked';
        isAgainst.value = !isSupport.value;
      } else {
        isSupport.value = false;
        isAgainst.value = false;
      }
  }
};

onMounted(() => {
  if(props.messageArray?.value){
    isComment.value = props.messageArray.value.getCommentbyIndex(index.value);
  }
  setTimeout(() => {
    handleIsLike();
  }, 200);
});

watch(
  () => props.messageArray,
  () => {
      index.value = 0;
      if(props.messageArray){
        index.value = props.messageArray?.getAllItems().length - 1;
      }
      messageArray.value = props.messageArray;
      if(props.messageArray){
        isComment.value = props.messageArray.getAllItems()[index.value].comment;
      }
      handleIsLike();
  },{
    immediate: true,
  }
);

watch(
  () => props.test,
  () => {
    if (props.test) {
      const chartDom = echartsDraw.value;
      echartsDraw.value.style.display = 'block';
      chartDom.style.width = '100%';
      chartDom.style.height = '800px';
      chartDom.style.marginTop = '10px';
      myChart = echarts.init(
        echartsDraw.value,
        themeStore.theme === 'dark' ? 'dark' : 'light',
      );
      myChart.setOption(echartsObj.value);
      option.value = echartsObj.value;
      show.value = true;
      echartsObj.value = {};
    }
  },
);

watch(
  () => themeStore.theme,
  () => {
    if (myChart && option) {
      if (myChart) {
        myChart.dispose();
      }
      myChart = echarts.init(
        echartsDraw.value,
        themeStore.theme === 'dark' ? 'dark' : 'light',
      );
      option.value.series[0].color = color;
      myChart.setOption(option.value);
    }
  },
);

watch(
  () => language.value,
  () => {
    popperSize();
  },
);

watch(
  () => index.value, 
  () => {
    handleIsLike();
  }
)

onBeforeUnmount(() => {
  isComment.value = undefined;
  index.value = 0;
});

const answer_zoom = ref(false);

const zoom_in = (event) => {
  txt2imgPathZoom.value = event.target.currentSrc;
  answer_zoom.value = true;
};

const zoom_out = () => {
  answer_zoom.value = false;
};

const selectQuestion = (item: Suggestion) => {
  let question = item.question;
  let user_selected_flow = item.flowId;
  if (user_selected_flow) {
    emits('handleSendMessage', undefined, question, user_selected_flow);
  } else {
    emits('handleSendMessage', undefined, question);
  }
};

const popperSize = () => {
  if (language.value == 'EN') {
    size.width = 418;
    size.height = 496;
    return size;
  } else {
    return size;
  }
};
const { conversationList } = storeToRefs(useSessionStore());
const { sendQuestion } = useSessionStore();

const chatWithParams = async () => {
  visible.value = false;
  const question = conversationList.value[props.cid - 1].message;
  const flowId = conversationList.value[props.cid].flowdata.flowId;
  await sendQuestion(
    undefined,
    question,
    user_selected_app.value,
    undefined,
    undefined,
    flowId,
    params.value,
  );
};

</script>
<template>
  <div
    class="dialogue-panel"
    :class="{ workFlowDebugStyle: props.isWorkFlowDebug }"
  >
    <div class="dialogue-panel__user" v-if="props.type === 'user'">
      <div class="dialogue-panel__user-time" v-if="createdAt">
        <div class="centerTimeStyle">
          {{ dayjs(createdAt * 1000).format('YYYY-MM-DD HH:mm:ss') }}
        </div>
      </div>
      <div class="dialogue-panel__user-time" v-else>
        <div class="centerTimeStyle">
          {{ dayjs(Date.now()).format('YYYY-MM-DD HH:mm:ss') }}
        </div>
      </div>
      <div class="dialogue-panel__content">
        <img v-if="avatar" :src="avatar" />
        <div v-else class="userArea">
          <img
            v-if="themeStore.theme === 'dark'"
            src="@/assets/svgs/dark_user.svg"
          />
          <img v-else src="@/assets/svgs/light_user.svg" />
        </div>
        <div class="content" v-if="content">
          <div class="message">{{ content }}</div>
          <JsonFormComponent
            :code="props.inputParams"
            title="参数补充"
            v-if="props.inputParams"
            type="input"
          />
        </div>
      </div>
    </div>
    <!-- AI回答 -->
    <div class="dialogue-panel__robot" v-else>
      <div class="dialogue-panel__robot-content">
        <!-- 这里是flowData -->
        <DialogueFlow
          v-if="flowdata"
          :isWorkFlowDebug="props.isWorkFlowDebug"
          :flowdata="props.flowdata"
        />
        <DialogueThought :content="thoughtContent" v-if="thoughtContent" />
        <div v-if="contentAfterMark" id="markdown-preview">
          <div v-html="contentAfterMark"></div>
          <a v-if="props.paramsList" @click="visible = true">补充参数</a>
          <!-- <img class="answer_img" src="" alt="" @click="zoom_in($event)" /> -->
          <div class="loading-echarts">
            <div ref="echartsDraw" class="draw" style="color: grey"></div>
          </div>
        </div>
        <el-dialog
          :model-value="visible"
          :show-close="false"
          width="50%"
          height="60%"
          title="补充参数"
          :close-on-press-escape="false"
          :close-on-click-modal="false"
          align-center
          overflow="scroll"
        >
          <JsonFormComponent
            :code="props.paramsList"
            title="参数补充"
            v-if="props.paramsList"
            type="code"
          />
          <div class="button-group">
            <el-button class="confirm-button" @click="chatWithParams()">
              {{ $t('history.ok') }}
            </el-button>
            <el-button class="confirm-button" @click="visible = false">
              {{ $t('history.cancel') }}
            </el-button>
          </div>
        </el-dialog>
        <div
          class="loading"
          v-if="
            !contentAfterMark &&
            !isFinish &&
            !$slots.default &&
            !flowdata &&
            !thoughtContent
          "
        >
          <img src="@/assets/images/loading.png" alt="" class="loading-icon" />
          <div class="loading-text">
            {{ $t('feedback.eulercopilot_is_thinking') }}
          </div>
        </div>
      </div>
      <div v-if="$slots.default" class="dialogue-panel__robot-slot">
        <slot name="default"></slot>
      </div>
      <div
        class="dialogue-panel__robot-bottom"
        v-if="!$slots.default && contentAfterMark"
      >
        <div class="action-buttons">
          <div class="pagenation" v-if="isFinish">
            <div class="pagenation-item" v-if="props.metadata">
              tokens:{{ props.metadata?.inputTokens }}↑|
              {{ props.metadata?.outputTokens }}‌↓|
              {{ Number(props.metadata?.timeCost).toFixed(2) }}
            </div>
            <img
              class="pagenation-arror mr-8"
              @click="prePageHandle(Number(cid))"
              src="@/assets/svgs/arror_left.svg"
            />
            <span class="pagenation-cur">{{ index! + 1 }}</span>
            <span class="pagenation-total">{{ `/${content?.length}` }}</span>
            <img
              class="pagenation-arror ml-8"
              @click="nextPageHandle(Number(cid))"
              src="@/assets/svgs/arror_right.svg"
            />
          </div>
          <div
            class="regenerate-button"
            v-if="needRegernerate && isFinish && !flowdata"
            @click="handlePauseAndReGenerate(Number(cid))"
          >
            <img
              v-if="themeStore.theme === 'dark'"
              src="@/assets/svgs/dark_regenerate.svg"
              alt=""
            />
            <img v-else src="@/assets/svgs/light_regenerate.svg" alt="" />
            <div>{{ $t('feedback.regenerate') }}</div>
          </div>

          <div class="button-group" v-if="isFinish">
            <el-tooltip
              placement="top"
              :content="$t('feedback.copy')"
              effect="light"
            >
              <img
                v-if="themeStore.theme === 'dark'"
                class="button-icon copy"
                src="@/assets/svgs/dark_copy.svg"
                @click="handleCopy"
              />
              <img
                v-else
                class="button-icon copy"
                src="@/assets/svgs/light_copy.svg"
                @click="handleCopy"
              />
            </el-tooltip>
            <el-tooltip
              placement="top"
              :content="$t('feedback.good_answer')"
              effect="light"
            >
              <img
                class="button-icon simg"
                v-if="!isSupport && themeStore.theme === 'dark'"
                src="@/assets/svgs/dark_support.svg"
                @click="handleLike('liked')"
              />
              <img
                class="button-icon simg"
                v-if="!isSupport && themeStore.theme === 'light'"
                src="@/assets/svgs/light_support.svg"
                @click="handleLike('liked')"
              />
              <img
                class="button-icon simg"
                v-if="isSupport"
                src="@/assets/svgs/support_active.svg"
                @click="handleLike('liked')"
              />
            </el-tooltip>
            <el-tooltip
              placement="top"
              :content="$t('feedback.bad_answer')"
              effect="light"
              ref="tooltip"
            >
              <el-popover
                placement="bottom-end"
                class="disliked-button"
                :visible="isAgainstVisible"
                width="328"
                height="328"
                @after-enter="bindDocumentClick"
                @after-leave="unbindDocumentClick"
              >
                <template #reference>
                  <img
                    class="button-icon"
                    v-if="!isAgainst && themeStore.theme === 'dark'"
                    src="@/assets/svgs/dark_against.svg"
                    @click="handleLike('disliked')"
                  />
                  <img
                    class="button-icon"
                    v-if="!isAgainst && themeStore.theme === 'light'"
                    src="@/assets/svgs/light_against.svg"
                    @click="handleLike('disliked')"
                  />
                  <img
                    class="button-icon"
                    v-if="isAgainst"
                    src="@/assets/svgs/against_active.svg"
                    @click="handleLike('disliked')"
                  />
                </template>
                <AgainstPopover
                  @click.stop
                  @close="isAgainstVisible = false"
                  @submit="handleDislike"
                />
              </el-popover>
            </el-tooltip>
            <el-tooltip
              placement="top"
              :content="$t('feedback.report')"
              effect="light"
              ref="tooltip"
            >
              <el-popover
                placement="bottom-end"
                class="disliked-button"
                :visible="isReportVisible"
                :width="size.width"
                :height="size.height"
                @after-enter="bindReportClick"
                @after-leave="unbindReportClick"
              >
                <template #reference>
                  <img
                    v-if="themeStore.theme === 'dark'"
                    class="button-icon"
                    src="@/assets/svgs/dark_report.svg"
                    @click="handleLike('report')"
                  />
                  <img
                    v-if="themeStore.theme === 'light'"
                    class="button-icon"
                    src="@/assets/svgs/light_report.svg"
                    @click="handleLike('report')"
                  />
                </template>
                <ReportPopover
                  @click.stop
                  @close="isReportVisible = false"
                  @report="handleReport"
                />
              </el-popover>
            </el-tooltip>
          </div>
        </div>
      </div>
      <div class="search-suggestions" v-if="props.search_suggestions">
        <h4 class="tip">{{ $t('feedback.try_ask_me') }}</h4>
        <ul class="search-suggestions_value">
          <li class="value" v-for="(item, index) in props.search_suggestions">
            <div @click="selectQuestion(item)">
              <p class="test" v-if="item.flowName">
                #{{item.flowName }}
              </p>
              {{ item.question }}
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
  <!-- 图片放大mask -->
  <div class="answer_img_mask" v-show="answer_zoom" @click="zoom_out()">
    <img :src="txt2imgPathZoom" />
  </div>
</template>

<style lang="scss">
.button-group {
  text-align: center;
  .confirm-button {
    margin-top: 32px;
    width: 64px;
    height: 24px;
    border-radius: 1;
    font-size: 12px;
  }
}
.overflowTable {
  overflow-x: scroll;
}

.test {
  display: inline-block;
  margin-right: 8px;
  font-size: 14px;
  background-image: linear-gradient(to right, #6d75fa, #5ab3ff);
  background-clip: text;
  color: transparent;
  line-height: 32px;
}
.answer_img_mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;

  img {
    max-width: 100%;
    max-height: 100%;
  }

  span {
    position: absolute;
    top: 10px;
    right: 10px;
    font-size: 20px;
  }
}

.el-popper[role='tooltip'] {
  max-width: 500px;
}

.el-popper {
  border: none;

  .disliked-popover-title {
    color: var(--o-text-color-primary);
    font-size: 16px;
    font-weight: 700;
    line-height: 24px;
  }

  .disliked-item .el-checkbox .el-checkbox__label {
    font-size: 12px;
    color: var(--o-text-color-secondary);
    line-height: 16px;
  }

  .disliked-button button:first-child {
    border: 1px solid var(--o-border-color-lighter);
    width: 64px;
    height: 24px;
    color: var(--o-text-color-secondary);
    font-size: 12px;
    line-height: 16px;

    &:hover {
      color: #7aa5ff;
      background-color: transparent;
      border: 1px solid #7aa5ff;
    }
  }

  .disliked-popover .disliked-button button:first-child:hover {
    background-color: transparent;
  }

  .disliked-button button:last-child {
    background-color: var(--o-color-primary);
    border: none;
    color: var(--o-color-white);

    &:hover {
      background-color: #7aa5ff;
      color: #fff;
    }
  }

  .is-disabled,
  .is-disabled:hover {
    background-color: #b3cbff !important;
    color: #e1eaff;
  }

  .disliked-popover .error-input__link,
  .disliked-popover .error-input__desc {
    background-color: var(--o-bg-color-light);
  }
}

.disliked-popover {
  .radio {
    width: 88px;
    margin-bottom: 4px;
  }

  .radio_item,
  .el-radio-button__inner {
    min-width: 88px;
    width: 100%;
    height: 100%;
    border: none;
    background-color: var(--o-bg-color-light);
    color: var(--o-text-color-primary);
    white-space: pre-wrap;
    overflow-wrap: break-word;
    word-break: auto-phrase;
  }

  .el-radio-button__original-radio:checked + .el-radio-button__inner {
    border: none;
    background-color: transparent;
    color: #6395fd;
    background-image: linear-gradient(
      to right,
      rgba(109, 117, 250, 0.2),
      rgba(90, 179, 255, 0.2)
    );
  }
}

.svg:hover {
  filter: invert(50%) sepia(66%) saturate(446%) hue-rotate(182deg)
    brightness(100%) contrast(103%);
}

.disliked-button {
  height: 16px;
  width: auto;
  margin-left: 12px;
  color: var(--o-text-color-secondary);

  svg {
    width: 16px;
    height: 16px;
  }
}

.el-tooltip {
  float: left; //解决整体右浮动.提示语位置偏差
}

::deep .el-popper .el-popper.is-customized {
  float: right; //解决整体右浮动.提示语位置偏差
  background-color: pink;
}

.el-popper.is-customized {
  padding: 6px 12px;
  background: #f4f6fa;
  box-shadow: 0 4px 8px 0 rgba($color: #000000, $alpha: 0.2);
}

.el-popper.is-customized .el-popper__arrow::before {
  background: #f4f6fa;
  right: 0;
}
</style>
<style lang="scss" scoped>
.search-suggestions {
  display: flex;
  line-height: 24px;
  margin-top: 16px;

  &_value {
    display: flex;
    flex-wrap: wrap;
  }
  .tip {
    color: var(--o-text-color-secondary);
    font-size: 12px;
    height: 32px;
    line-height: 32px;
    align-self: center;
    font-weight: 100;
    flex-shrink: 0;
  }
  .value {
    display: flex;
    color: var(--o-text-color-secondary);
    background-color: var(--o-bg-color-base);
    border-radius: 8px;
    padding: 8px 16px;
    margin: 0 0 8px 8px;
    font-size: 12px;
    &:hover {
      background-image: linear-gradient(to right, #6d75fa, #5ab3ff);
      color: var(--o-text-color-fourth);
    }
    p {
      align-content: center;
      align-items: center;
      line-height: 16px;
    }
  }
}
.dialogue-panel {
  // padding-right: 25px;
  // padding: 0px 15%;
  width: 1000px;
  &__user {
    position: relative;
    margin-bottom: 24px;

    &-time {
      display: flex;
      padding-left: calc(50% - 37px);
      color: #8d98aa;
      font-size: 12px;
      margin-top: 16px;
    }

    p {
      padding: 12px 16px;
      font-size: 16px;
      line-height: 24px;
    }
  }

  &__content {
    display: flex;
    align-items: flex-start;
    margin-top: 10px;
    overflow-wrap: break-word;
    word-break: break-all;

    img {
      width: 48px;
      height: 48px;
      position: absolute;
      left: -10px;
    }

    .content {
      //min-height: 48px;
      border-radius: 8px;
      border-top-left-radius: 0px;
      padding: 12px;
      // display: flex;
      // align-items: center;
      color: var(--o-text-color-primary);
      margin-left: 45px;
      background-image: linear-gradient(
        to right,
        rgba(109, 117, 250, 0.2),
        rgba(90, 179, 255, 0.2)
      );
      .messaege {
        top: 10px;
        margin-top: 24px;
        display: block;
        width: 100%;
      }
    }
  }

  &__robot {
    position: relative;
    padding-left: 45px;
    border-radius: 8px;

    .loading {
      display: flex;
      // min-height: 72px;
      // padding: 24px;
      background-color: var(--o-bg-color-base);
      border-radius: 8px;
      border-top-left-radius: 0px;

      @keyframes rotate-img {
        from {
          transform: rotate(0);
        }

        to {
          transform: rotate(360deg);
        }
      }

      &::before {
        content: '';
        position: absolute;
        top: 0px;
        width: 48px;
        height: 48px;
        left: -10px;
        background-image: url('src/assets/svgs/robot.svg');
      }

      &-icon {
        animation: rotate-img 1s infinite linear;
      }

      &-text {
        font-size: 16px;
        line-height: 24px;
        padding-left: 12px;
        color: var(--o-text-color-primary);
      }
    }

    &-slot {
      .dialog-panel__robot-time {
        display: flex;
        justify-content: center;
        color: #8d98aa;
        font-size: 12px;
        margin-bottom: 10px;
        margin-top: 16px;
      }

      &::before {
        content: '';
        position: absolute;
        left: -10px;
        top: 30px;
        width: 48px;
        height: 48px;
        background-image: url('src/assets/svgs/robot.svg');
      }
    }

    &-content {
      background-color: var(--o-bg-color-base);
      padding: 24px 24px 16px 24px;
      border-top-right-radius: 8px;
      overflow-wrap: break-word;
      text-align: justify;
      line-height: 24px;
      color: var(--o-text-color-primary);

      &::before {
        content: '';
        position: absolute;
        left: -10px;
        top: 0px;
        width: 48px;
        height: 48px;
        background-image: url('src/assets/svgs/robot.svg');
      }
    }

    &-bottom {
      background-color: var(--o-bg-color-base);
      padding: 0px 24px;
      border-radius: 0 0 8px 8px;

      .action-buttons {
        border-top: 1px dashed var(--o-border-color-light);
        padding: 16px 0 20px 0px;
        display: flex;
        align-items: center;

        .pagenation {
          display: flex;

          &-item {
            margin-right: 8px;
            border-radius: 4px;
            font-size: 12px;
            line-height: 16px;
            color: var(--o-text-color-tertiary) !important;
            letter-spacing: 0px;
          }

          img {
            width: 16px;
            height: 16px;
          }

          &-arror {
            margin: 0;
            cursor: pointer;
          }
          .ml-8 {
            margin-left: 8px;
          }
          .mr-8 {
            margin-right: 8px;
          }

          .pagenation-cur {
            font-size: 12px;
            line-height: 18px;
            color: var(--o-text-color-tertiary) !important;
          }

          .pagenation-total {
            font-size: 12px;
            line-height: 18px;
            color: var(--o-text-color-primary) !important;
          }

          letter-spacing: 2px;
        }

        .regenerate-button {
          display: flex;
          align-items: center;
          margin-left: 8px;
          color: var(--o-text-color-secondary);
          font-size: 12px;
          line-height: 16px;
          cursor: pointer;
          user-select: none;

          img {
            margin-right: 8px;
          }

          .paused-answer {
            color: #c4c2c2;
            cursor: text;
          }
        }

        .button-group {
          margin-left: auto;
          display: flex;
          align-items: center;
          font-size: 12px;

          .button-icon {
            width: 24px;
            height: 24px;
            margin-left: 4px;
          }

          .copy {
            width: 24px;
            height: 24px;
          }

          .copy:hover {
            filter: invert(50%) sepia(66%) saturate(446%) hue-rotate(182deg)
              brightness(100%) contrast(103%) contrast(99%);
          }

          .button-icon:hover {
            filter: invert(50%) sepia(66%) saturate(446%) hue-rotate(182deg)
              brightness(100%) contrast(103%) contrast(99%);
          }

          img {
            vertical-align: bottom;
            cursor: pointer;
            user-select: none;
            width: 16px;
            height: 16px;
          }
        }
      }
    }
  }

  &__stop {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 128px;
    height: 40px;
    border-radius: 8px;
    border: 1px solid var(--o-border-color-extralight);
    margin-top: 38px;
    margin-left: auto;
    margin-right: auto;
    cursor: pointer;

    img {
      width: 16px;
      height: 16px;
      margin-right: 8px;
    }

    &-answer {
      font-size: 16px;
      color: var(--o-text-color-primary);
      line-height: 24px;
    }
  }

  :deep(.el-loading-spinner .circular) {
    width: 20px;
    height: 20px;
  }
}
// 工作流调试抽屉样式
.workFlowDebugStyle {
  width: auto;
  padding-right: 24px;
  .loading {
    display: none;
  }
  .dialogue-panel__content {
    gap: 16px;
    .userArea {
      min-width: 48px;
      height: 48px;
      img {
        left: 0px;
      }
    }
    .content {
      margin-left: 0px;
      min-height: 48px;
      .message {
        white-space: pre-line;
      }
    }
  }
  .dialogue-panel__user-time {
    height: 20px;
    line-height: 20px;
    .centerTimeStyle {
      width: 136px;
      padding: 0 8px;
      background-color: var(--o-time-text);
      border-radius: 12px;
    }
  }
  .dialogue-panel__robot {
    gap: 16px;
    padding-left: 64px;
    .dialogue-panel__robot-content {
      border-radius: 8px;
      // 工作流调试时控制显示
      .dialogue-thought {
        // ai思考无需显示
        display: none;
      }
      ::v-deep(.demo-collapse) {
        border-radius: 4px;
        .title.el-collapse-item {
          .loading-text {
            display: flex;
            text-align: left;
            align-items: center;
            .textTitle {
              flex: 1;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .totalTime {
              min-width: 54px;
              width: fit-content;
              padding: 0px 8px;
              height: 16px;
              line-height: 16px;
              font-size: 12px;
              border-radius: 4px;
            }
            .totalTime.errorBg {
              background-color: rgba(227, 32, 32, 0.2);
            }
          }
        }
        .normal.el-collapse-item {
          border-bottom: 1px dashed #dfe5ef;
          .el-collapse-item__header {
            background-color: var(--o-bg-color-base) !important;
            color: var(--o-text-color-primary);
            padding-right: 0px;
            .o-collapse-icon {
              width: 16px;
              height: 16px;
            }
            .title {
              flex: 1;
              text-align: left;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .time {
              min-width: 54px;
              width: fit-content;
              padding: 0px 8px;
              height: 16px;
              line-height: 16px;
              border-radius: 4px;
              font-size: 12px;
            }
            &::after {
              background-color: transparent;
            }
          }
          &:last-child {
            border-bottom: 1px solid transparent !important;
          }
        }
        .el-collapse-item__content {
          margin: 0px 16px;
        }
      }
      // 调试抽屉中echarts无需显示
      .answer_img {
        display: none;
      }
      .loading-echarts {
        display: none;
      }
      &::before {
        left: 0;
      }
    }
  }
  // 调试抽屉中不需要显示底部反对等功能图标
  .dialogue-panel__robot-bottom {
    display: none;
  }
}
</style>

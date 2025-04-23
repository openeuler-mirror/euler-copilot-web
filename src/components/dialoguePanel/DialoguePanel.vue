<script lang="ts" setup>
import type { DialoguePanelType } from './type';
import { useDialogueActions } from './hooks/useDialogueActions';
import { useMarkdownParser } from './hooks/useMarkdownParser';
import { ref, toRef } from 'vue';
import { echartsObj } from 'src/store/conversation';
import { useHistorySessionStore } from 'src/store';
import AgainstPopover from 'src/views/dialogue/components/AgainstPopover.vue';
import dayjs from 'dayjs';
import ReportPopover from 'src/views/dialogue/components/ReportPopover.vue';
import DialogueThought from './DialogueThought.vue';
import { onMounted, watch, onBeforeUnmount, reactive } from 'vue';
import * as echarts from 'echarts';
import color from 'src/assets/color';
import { storeToRefs } from 'pinia';
import { useLangStore, useChangeThemeStore, useSessionStore } from '@/store';
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
  content: string[] | string;
  // 当前选中的第n次回答的索引，默认是最新回答
  currentSelected: number;
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
const isSupport = ref(false);
const isAgainst = ref(false);
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

const { handleCopy, handleFeedback } = useDialogueActions(
  toRef(props, 'content'),
  toRef(props, 'currentSelected'),
);

const { thoughtContent, contentAfterMark } = useMarkdownParser(
  toRef(props, 'content'),
  toRef(props, 'currentSelected'),
);
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

// 举报功能 目前未实现
const handleReport = async (reason: string): Promise<void> => {
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
  if (language.value == 'en') {
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
          {{ dayjs(Number(createdAt) * 1000).format('YYYY-MM-DD HH:mm:ss') }}
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
                class="button-icon"
                v-if="!isSupport && themeStore.theme === 'dark'"
                src="@/assets/svgs/dark_support.svg"
              />
              <img
                class="button-icon"
                v-if="
                  !isSupport &&
                  (themeStore.theme === 'light' || !themeStore.theme)
                "
                src="@/assets/svgs/light_support.svg"
              />
              <img
                class="button-icon"
                v-if="isSupport"
                src="@/assets/svgs/support_active.svg"
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
                  />
                  <img
                    class="button-icon"
                    v-if="
                      !isAgainst &&
                      (themeStore.theme === 'light' || !themeStore.theme)
                    "
                    src="@/assets/svgs/light_against.svg"
                  />
                  <img
                    class="button-icon"
                    v-if="isAgainst"
                    src="@/assets/svgs/against_active.svg"
                  />
                </template>
                <AgainstPopover @click.stop @close="isAgainstVisible = false" />
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
                  />
                  <img
                    v-if="themeStore.theme === 'light' || !themeStore.theme"
                    class="button-icon"
                    src="@/assets/svgs/light_report.svg"
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
<style lang="sass" scoped>
@import './DialoguePanel.scss'
</style>

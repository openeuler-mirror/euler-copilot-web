<script lang="ts" setup>
import type { DialoguePanelType } from "./type";
import marked from "src/utils/marked.js";
import { computed, onBeforeUpdate, onUpdated, ref, withDefaults } from "vue";
import { writeText } from "src/utils";
import { useSessionStore, useChangeThemeStore, txt2imgPath, echartsObj } from "src/store/conversation";
import { useHistorySessionStore } from 'src/store';
import AgainstPopover from "src/views/dialogue/components/AgainstPopover.vue";
import dayjs from "dayjs";
import xss from "xss";
import { errorMsg, successMsg } from "src/components/Message";
import ReportPopover from "src/views/dialogue/components/ReportPopover.vue";
import { onMounted, watch, onBeforeUnmount,reactive } from "vue";
import * as echarts from 'echarts';
import color from 'src/assets/color';
import { Linetooltip , Circlelegend } from './chartsCss'
import i18n from 'src/i18n';
import { storeToRefs } from 'pinia';
import { useLangStore } from 'src/store'
const { user_selected_app } = storeToRefs(useHistorySessionStore());
import { Suggest } from 'src/apis/paths/type';
const { params } = storeToRefs(useHistorySessionStore());
const { app } = storeToRefs(useSessionStore());
const { language } = storeToRefs(useLangStore());
const { changeLanguage } = useLangStore();
const echartsDraw = ref();
const visible = ref(false);
export interface DialoguePanelProps {
  key: number;
  // 
  cid: number;
  // 用来区分是用户还是ai的输入
  type: DialoguePanelType;
  // 文本内容
  inputParams:object;
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
  //
  isLikeList?: number[] | undefined;
  //
  search_suggestions?:any;
  //
  echartsObj?:any;
  //
  test?:any;
  //
  metadata?:Metadata;
  //
  flowdata?:any;
  //
  paramsList?:any;
  //
  modeOptions:any;
}
import JsonFormComponent from './JsonFormComponent.vue'
import { Metadata } from "srcapis/paths/type";
import DialogueFlow from "./DialogueFlow.vue";
import { emit, title } from "process";

var option = ref();
var show = ref(false);
const size = reactive({
    width:328,
    height:416
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

const index = ref(0);
const isLike = ref(props.isLikeList);
const emits = defineEmits<{
  (
    e: "commont",
    type: "support" | "against",
    qaRecordId: string,
    reason?: string,
    reasion_link?: string,
    reason_description?: string
  ): void;
  (
    e: 'report',
    qaRecordId:string,
    reason?: string,
  ): void;
  (
    e: 'handleSendMessage',
    groupId: string|undefined,
    question:string,
    user_selected_flow?:any,

  ): void;
  (
    e: 'clearSuggestion',
    index: number,
  ): void;
}>();

// #region ----------------------------------------< pause and regenerate >--------------------------------------

/**
 * 暂停和重新生成问答
 */
const handlePauseAndReGenerate = (cid?: number) => {
  if (!cid) {
    return;
  }

  emits("clearSuggestion", props.key);
  if (props.isFinish) {
    // 重新生成
    reGenerateAnswer(cid, user_selected_app.value);
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
const handleSupport = async (
  type: "support" | "against" | "report"
): Promise<void> => {
  if (type === "support") {
    const qaRecordId = props.recordList[index.value];
    emits("commont", type, props.cid, qaRecordId, index.value);
    isLike.value[index.value] = 1;
    handleIsLike();
  } else if (type === "against") {
    isAgainstVisible.value = true;
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
const handleAgainst = async (
  reason: string,
  reasionLink?: string,
  reasonDescription?: string
): Promise<void> => {
  const qaRecordId = props.recordList[index.value];
  emits(
    "commont",
    "against",
    props.cid,
    qaRecordId,
    index.value,
    reason,
    reasionLink,
    reasonDescription
  );
  isAgainstVisible.value = false;
  isLike.value[index.value] = 0;
  handleIsLike();
};

const handleOutsideClick = () => {
  isAgainstVisible.value = false;
};

const bindDocumentClick = () => {
  document.addEventListener("click", handleOutsideClick);
};

const unbindDocumentClick = () => {
  document.removeEventListener("click", handleOutsideClick);
};

// 举报功能
const handleReport = async (reason: string): Promise<void> => {
  const qaRecordId = props.recordList[index.value];
  emits("report", qaRecordId, reason);
  isAgainstVisible.value = false;
};

//处理举报逻辑
const handleReportClick = () => {
  isReportVisible.value = false;
};

//处理举报逻辑
const bindReportClick = () => {
  document.addEventListener("click", handleReportClick);
};

//处理举报逻辑
const unbindReportClick = () => {
  document.removeEventListener("click", handleReportClick);
};

const isAgainstVisible = ref<boolean>(false);
const isReportVisible = ref<boolean>(false);

const txt2imgPathZoom = ref('');
// 解析完成后的文本内容
const contentAfterMark = computed(() => {
  if (!props.content) {
    return "";
  }
  let str = marked.parse(
    xss(props.content[props.currentSelected])
      .replace(/&gt;/g, ">")
      .replace(/&lt;/g, "<")
  )
  let tableStart = str.indexOf('<table>');
  if(tableStart!== -1){
    str = str.slice(0, tableStart) + '<div class="overflowTable">' + str.slice(tableStart, str.indexOf('</table>') + '</table>'.length).replace('</table>', '</table></div>') + str.slice(str.indexOf('</table>') + '</table>'.length);
  }
  //将table提取出来中加一个<div>父节点控制溢出
  return str;
  //xxs将大于号转为html实体以防歧义；将< >替换为正常字符；
});


const prePageHandle = (cid: number) => {
  prePage(cid);
  if (index.value === 0) {
    index.value = 0;
  } else {
    index.value--;
    handleIsLike();
  }
};

const nextPageHandle = (cid: number) => {
  nextPage(cid);
  if (index.value === (props.isLikeList as number[]).length - 1) {
    index.value = (props.isLikeList as number[]).length - 1;
  } else {
    index.value++;
    handleIsLike();
  }
};

const isSupport = ref();
const isAgainst = ref();

const handleIsLike = () => {
  let a = 2;
  if (isLike.value === undefined) {
    return;
  } else {
    if (index.value <= isLike.value.length && isLike.value.length !== 0) {
      a = isLike.value[index.value];
    }
    if (a !== 2) {
      isSupport.value = Boolean(a);
      isAgainst.value = !Boolean(a);
    } else {
      isSupport.value = 0;
      isAgainst.value = 0;
    }
  }
};

onMounted(() => {
  isLike.value = props.isLikeList;
  setTimeout(() => {
    handleIsLike();
  }, 200);
});

watch(
  () => props.isLikeList,
  () => {
    if (isLike.value.length === props.isLikeList?.length) {
      handleIsLike();
    } else {
      isLike.value = props.isLikeList;
      handleIsLike();
    }
  }
);

watch(
  () => props.test,
  () => {
    if(props.test){
      const chartDom = echartsDraw.value;
    echartsDraw.value.style.display = 'block';
    chartDom.style.width = '100%';
    chartDom.style.height = '800px';
    chartDom.style.marginTop = '10px';
    myChart = echarts.init(echartsDraw.value,themeStore.theme === 'dark' ? "dark" : "light");
    myChart.setOption(echartsObj.value);
    option.value = echartsObj.value;
    show.value = true;
    echartsObj.value = {};
    }
  }
);

watch(
  () => themeStore.theme,
  () => {
    if(myChart && option){
    if (myChart) {  
        myChart.dispose();  
    }  
    myChart = echarts.init(echartsDraw.value,themeStore.theme === 'dark' ? "dark" : "light");
    option.value.series[0].color = color;
    myChart.setOption(option.value);
    }
  }
);

watch(
  () => language.value,
  () => {
      popperSize();
  },
);



onBeforeUnmount(() => {
  isLike.value = undefined;
  index.value = 0;
});

const answer_zoom = ref(false);
const zoom_in = (event) => {
  txt2imgPathZoom.value = event.target.currentSrc;
  answer_zoom.value = true;
}

const zoom_out = () => {
  answer_zoom.value = false;
}

const selectQuestion = (item:Suggest) => {
  let question = item.question;
  let user_selected_flow = item.flowId;
  if(user_selected_flow){
    emits('handleSendMessage',undefined,question,user_selected_flow);
  }else{
    emits('handleSendMessage',undefined,question);
  }
  
};

// const selectQuestion = (item:object) => {
//   let question = item.question;
//   let user_selected_flow = item.flow;
//   emits('handleSendMessage',question,user_selected_flow);
// };

const popperSize = () => {
  if(language.value == "EN"){
    size.width = 418;
    size.height = 496;
    return size
  }else{
    return size
  }
}
const { conversationList } = storeToRefs(useSessionStore());
const { sendQuestion } = useSessionStore();


const chatWithParams = async () => {
  visible.value = false;
  // handleSendMessage(undefined,undefined,user_selected_app.value);
  // reGenerateAnswer(props.cid, user_selected_app.value,"params");
  const language = localStorage.getItem('localeLang') === 'CN' ? 'zh' : 'en';
  const len = conversationList.value.length;
  const question = (conversationList.value[props.cid - 1]).message;
  const flowId = (conversationList.value[props.cid]).flowdata.flowId;
  await sendQuestion(undefined,question, user_selected_app.value, undefined, undefined, flowId,params.value);
}

const searchAppName = (appId) => {
  for(let item in props.modeOptions){
    if(props.modeOptions[item].value == appId){
      return props.modeOptions[item].label
    }
  }
  return ''
    }

const handleSendMessage = async (question, user_selected_flow, user_selected_app) => {
  visible.value = false;
  // handleSendMessage(undefined,undefined,user_selected_app.value);
}

</script>
<template>
  <div class="dialogue-panel">
    <div class="dialogue-panel__user" v-if="props.type === 'user'">
      <div class="dialogue-panel__user-time" v-if="createdAt">
        {{ dayjs(createdAt * 1000).format("YYYY-MM-DD HH:mm:ss") }}
      </div>
      <div class="dialogue-panel__user-time" v-else>
        {{ dayjs(Date.now()).format("YYYY-MM-DD HH:mm:ss") }}
      </div>
      <div class="dialogue-panel__content">
        <img v-if="avatar" :src="avatar" />
        <div v-else>
          <img v-if="themeStore.theme === 'dark'" src="@/assets/images/dark_user.png" />
          <img v-else src="@/assets/images/light_user.png" />
        </div>
        <div class="content" v-if="content">
          <div class="message">{{ content }}</div>
          <JsonFormComponent :code="props.inputParams" title="参数补充" v-if="props.inputParams" type="input" />
        </div>

      </div>
    </div>
    <!-- AI回答 -->
    <div class="dialogue-panel__robot" v-else>
      <div class="dialogue-panel__robot-content">
      <DialogueFlow v-if="flowdata"  :flowdata="props.flowdata"/> 
      <div v-if="contentAfterMark" id="markdown-preview">
        <div v-html="contentAfterMark"></div>
      <a v-if="props.paramsList" @click="visible = true">补充参数</a>
        <img class="answer_img" src="" alt="" @click="zoom_in($event)" />
        <div class="loading-echarts">
          <div ref="echartsDraw"  class="draw" style=" color: grey ;"></div>
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
    <JsonFormComponent :code="props.paramsList" title="参数补充" v-if="props.paramsList" type="code" />
    <div class="button-group">
        <el-button class="confirm-button"  @click="chatWithParams()">{{$t('history.ok')}}</el-button>
        <el-button class="confirm-button"  @click="visible = false">{{$t('history.cancel')}}</el-button>
      </div>
    </el-dialog>
      <div class="loading" v-if="!contentAfterMark && !isFinish && !$slots.default &&!flowdata">
        <img src="@/assets/images/loading.png" alt="" class="loading-icon">
        <div class="loading-text">{{$t('feedback.eulercopilot_is_thinking')}}</div>
      </div>
    </div>
      <div v-if="$slots.default" class="dialogue-panel__robot-slot">
        <slot name="default"></slot>
      </div>
      <div class="dialogue-panel__robot-bottom" v-if="!$slots.default && contentAfterMark">
        <div class="action-buttons">
          <div class="pagenation" v-if="isFinish">
            <div class="pagenation-item" v-if="props.metadata">tokens:{{ props.metadata?.input_tokens }}↑|{{ props.metadata?.output_tokens }}‌↓|{{ Number(props.metadata?.time).toFixed(2) }}</div>
              <img
                class="pagenation-arror"
                @click="prePageHandle(Number(cid))"
                src="@/assets/svgs/arror_left.svg"
              />
              <span class="pagenation-cur">{{ currentSelected! + 1 }}</span>
              <span class="pagenation-total">{{ `/${content?.length}` }}</span>
              <img
                class="pagenation-arror"
                @click="nextPageHandle(Number(cid))"
                src="@/assets/svgs/arror_right.svg"
              />
            </div>
          <div class="regenerate-button" v-if="needRegernerate && isFinish" @click="handlePauseAndReGenerate(Number(cid))">
            <img v-if="themeStore.theme === 'dark'" src="@/assets/svgs/dark_regenerate.svg" alt="">
            <img v-else src="@/assets/svgs/light_regenerate.svg" alt="">
            <div>{{$t('feedback.regenerate')}}</div>
          </div>

          <div class="button-group" v-if="isFinish">
            <el-tooltip placement="top"  :content="$t('feedback.copy')" effect="light">
              <img v-if="themeStore.theme === 'dark'" class="button-icon copy" src="@/assets/svgs/dark_copy.svg" @click="handleCopy" />
              <img v-else class="button-icon copy" src="@/assets/svgs/light_copy.svg" @click="handleCopy" />
            </el-tooltip>
            <el-tooltip placement="top" :content="$t('feedback.good_answer')" effect="light">
              <img
                class="button-icon simg"
                v-if="!isSupport && themeStore.theme === 'dark'"
                src="@/assets/svgs/dark_support.svg"
                @click="handleSupport('support')"
              />
              <img
                class="button-icon simg"
                v-if="!isSupport && themeStore.theme === 'light'"
                src="@/assets/svgs/light_support.svg"
                @click="handleSupport('support')"
              />
              <img
                class="button-icon simg"
                v-if="isSupport"
                src="@/assets/svgs/support_active.svg"
                @click="handleSupport('support')"
              />
            </el-tooltip>
            <el-tooltip
              placement="top"
              :content="$t('feedback.bad_answer')"
              effect="light"
              ref="tooltip"
            >
              <div class="against-button">
                <el-popover placement="bottom-end" :visible="isAgainstVisible" width="328" height="328"
                  @after-enter="bindDocumentClick" @after-leave="unbindDocumentClick">
                  <template #reference>
                    <img class="button-icon" v-if="!isAgainst && themeStore.theme === 'dark'"
                      src="@/assets/svgs/dark_against.svg" @click="handleSupport('against')" />
                    <img class="button-icon" v-if="!isAgainst && themeStore.theme === 'light'"
                      src="@/assets/svgs/light_against.svg" @click="handleSupport('against')" />
                    <img class="button-icon" v-if="isAgainst" src="@/assets/svgs/against_active.svg"
                      @click="handleSupport('against')" />
                  </template>
                  <AgainstPopover @click.stop @close="isAgainstVisible = false" @submit="handleAgainst" />
                </el-popover>
              </div>
            </el-tooltip>
            <el-tooltip placement="top" :content="$t('feedback.report')" effect="light" ref="tooltip">
              <div class="against-button">
                <el-popover
                  placement="bottom-end"
                  :visible="isReportVisible"
                  :width="size.width"
                  :height="size.height"
                  @after-enter="bindReportClick"
                  @after-leave="unbindReportClick"
                >
                  <template #reference>
                    <img v-if="themeStore.theme === 'dark'" class="button-icon" src="@/assets/svgs/dark_report.svg"
                      @click="handleSupport('report')" />
                    <img v-if="themeStore.theme === 'light'" class="button-icon" src="@/assets/svgs/light_report.svg"
                      @click="handleSupport('report')" />
                  </template>
                  <ReportPopover @click.stop @close="isReportVisible = false" @report="handleReport" />
                </el-popover>
              </div>
            </el-tooltip>
          </div>
        </div>
      </div>
      <div class='search-suggestions' v-if='props.search_suggestions'>
        <h4 class='tip'>{{$t('feedback.try_ask_me')}}</h4>
        <ul class='search-suggestions_value'>
          <li class='value'
          v-for="(item, index) in props.search_suggestions" >
          <p @click='selectQuestion(item)'><p class='test' v-if='item.appId'>#{{searchAppName(item.appId)}}</p>{{item.question}}</p></li>
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
.overflowTable{
  overflow-x: scroll;
}

.test{
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

.el-popper[role="tooltip"].is-dark,
.el-popper[role="tooltip"].is-light {
  background-color: var(--o-bg-color-base);
}

.el-popper .el-popper__arrow::before {
  right: 0;
  visibility: hidden;
}

.el-popper[role="tooltip"] {
  max-width: 500px;
}

.el-popper {
  border: none;

  .against-popover-title {
    color: var(--o-text-color-primary);
    font-size: 16px;
    font-weight: 700;
    line-height: 24px;
  }

  .against-item .el-checkbox .el-checkbox__label {
    font-size: 12px;
    color: var(--o-text-color-secondary);
    line-height: 16px;
  }

  .against-button button:first-child {
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

  .against-popover .against-button button:first-child:hover {
    background-color: transparent;
  }

  .against-button button:last-child {
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

  .against-popover .error-input__link,
  .against-popover .error-input__desc {
    background-color: var(--o-bg-color-light);
  }
}

.against-popover {
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

  .el-radio-button__original-radio:checked+.el-radio-button__inner {
    border: none;
    background-color: transparent;
    color: #6395fd;
    background-image: linear-gradient(to right,
        rgba(109, 117, 250, 0.2),
        rgba(90, 179, 255, 0.2));
  }
}

.svg:hover {
  filter: invert(50%) sepia(66%) saturate(446%) hue-rotate(182deg) brightness(100%) contrast(103%);
}

.against-button {
  height: 16px;
  width: auto;
  margin-left: 16px;
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

.search-suggestions{
  display: flex;
  line-height: 24px;
  margin-top: 16px;

  &_value{
    display: flex;
    flex-wrap: wrap;
  }
  .tip{
    color:var(--o-text-color-secondary);
    font-size: 12px;
    height: 32px;
    line-height: 32px;
    align-self: center;
    font-weight: 100;
    flex-shrink: 0
  }
  .value{
    display: flex;
    color:var(--o-text-color-secondary);
    background-color: var(--o-bg-color-base);
    border-radius: 8px;
    padding: 8px 16px;
    margin: 0 0 8px 8px;
    font-size: 12px;
    &:hover {
        background-image: linear-gradient(to right, #6d75fa, #5ab3ff);
        color: var(--o-text-color-fourth);
    }
    p{
      align-content: center;
      align-items: center;
      line-height: 16px;
    }
  }
}
.dialogue-panel {
  // padding-right: 25px;
  // padding: 0px 15%;
  width:1000px;
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
      background-image: linear-gradient(to right,
          rgba(109, 117, 250, 0.2),
          rgba(90, 179, 255, 0.2));
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
        content: "";
        position: absolute;
        top: 0px;
        width: 48px;
        height: 48px;
        left: -10px;
        background-image: url("src/assets/images/robot.png");
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
        content: "";
        position: absolute;
        left: -10px;
        top: 30px;
        width: 48px;
        height: 48px;
        background-image: url("src/assets/images/robot.png");
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
        content: "";
        position: absolute;
        left: -10px;
        top: 0px;
        width: 48px;
        height: 48px;
        background-image: url("src/assets/images/robot.png");
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
            line-height: 18px;
            color: var(--o-text-color-tertiary) !important;
            letter-spacing: 0px;
          }

          img {
            width: 16px;
            height: 16px;
          }

          &-arror {
            margin: 0;
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
            width: 20px;
            height: 20px;
          }

          .copy {
            width: 20px;
            height: 20px;
          }

          .copy:hover {
            filter: invert(50%) sepia(66%) saturate(446%) hue-rotate(182deg) brightness(100%) contrast(103%) contrast(99%);
          }

          .button-icon:hover {
            filter: invert(50%) sepia(66%) saturate(446%) hue-rotate(182deg) brightness(100%) contrast(103%) contrast(99%);
          }

          img {
            vertical-align: bottom;
            cursor: pointer;
            user-select: none;
            width: 16px;
            height: 16px;
          }

          .simg {
            margin-left: 16px;
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
</style>

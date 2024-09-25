<script lang="ts" setup>
import { computed, ref } from 'vue';
import { writeText } from 'src/utils';
import { useSessionStore, useChangeThemeStore } from 'src/store/session';
import dayjs from 'dayjs';
import { errorMsg, successMsg } from 'src/components/Message';
import { onMounted,watch,onBeforeUnmount } from 'vue';

export interface DialoguePanelProps {
  cid: string;
  type:string;
  // 用来区分是用户还是ai的输入
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
  userSelectedPlugins?: any;
  //
  recordList?:string[] | undefined;
  //
  isLikeList?:number[] | undefined;
  search_suggestions?:any;
}
const themeStore = useChangeThemeStore();
const { pausedStream, reGenerateAnswer, prePage, nextPage } = useSessionStore();
const props = withDefaults(defineProps<DialoguePanelProps>(), {
  isFinish: false,
  // 当前选中的第n次回答的索引
  currentSelected: 0,
  needRegernerate: false,
});

const index = ref(0);
const isLike = ref(props.isLikeList);
const emits = defineEmits<{
  (
    e: 'commont',
    type: 'support' | 'against',
    recordId:string,
    reason?: string,
    reason_link?: string,
    reason_description?: string,
  ): void;
  (
    e: 'report',
    recordId:string,
    reason?: string,
  ): void;
  (
    e: 'handleSendMessage',
    question:string,
    user_selected_flow?:any
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
  if (props.isFinish) {
    // 重新生成
    reGenerateAnswer(cid, props.userSelectedPlugins);
  } else {
    // 停止生成
    pausedStream(cid);
  }
};

// #endregion

// 复制
const handleCopy = (): void => {
  if (!props.content || !Array.isArray(props.content)) {
    errorMsg('复制失败');
    return;
  }
  writeText(props.content[props.currentSelected]);
  successMsg('复制成功');
  return;
};

// 解析完成后的文本内容
const contentAfterMark = computed(() => {
  if (!props.content) {
    return '';
  }
  return props.content[props.currentSelected]
});

const prePageHandle = (cid:number) => {
  prePage(cid);
  if(index.value === 0){
    index.value = 0;
  }else{
    index.value--;
    handleIsLike();
  }
}

const nextPageHandle = (cid:number) => {
  nextPage(cid);
  if(index.value === (props.isLikeList as number[]).length-1){
    index.value = (props.isLikeList as number[]).length-1;
  }else{
    index.value++;
    handleIsLike();
  }
}

const isSupport = ref();
const isAgainst = ref();

const handleIsLike = () => {
  let a = 2;
  if(isLike.value === undefined){
    return
  }else{
    if(index.value<=isLike.value.length && isLike.value.length !== 0){
    a = isLike.value[index.value];
    }
  if(a !== 2){
    isSupport.value = Boolean(a);
    isAgainst.value = !a;
  }else{
    isSupport.value = 0;
    isAgainst.value = 0;
  }
  }
}

onMounted(()=>{
  isLike.value = props.isLikeList;
  setTimeout(() => {
    handleIsLike();
  }, 200);
})


watch(
  () => props.isLikeList,
  () => {
      isLike.value = props.isLikeList;
      handleIsLike();
  },
);

onBeforeUnmount(() => {
  isLike.value = undefined;
  index.value = 0;
})

const selectQuestion = (item:object) => {
  let question = item.question;
  let user_selected_flow = item.id;
  if(user_selected_flow){
    emits('handleSendMessage',question,user_selected_flow);
  }else{
    emits('handleSendMessage',question);
  }
}
</script>
<template>
  <div class="dialogue-panel">
    <div class="dialogue-panel__user" v-if="props.type === 'user'">
      <div class="dialogue-panel__user-time">
        <span>{{ dayjs(createdAt).format('YYYY-MM-DD HH:mm:ss') }}</span>
      </div>
      <div class="dialogue-panel__content">
        <img v-if="avatar" :src="avatar" />
        <div v-else>
          <img v-if="themeStore.theme === 'dark'" src="src/assets/images/dark_user.png" />
          <img v-else src="src/assets/images/light_user.png" />
        </div>
        <p v-if="content">{{ content }}</p>
      </div>
    </div>
    <!-- AI回答 -->
    <div class="dialogue-panel__robot" v-else>
      <div
        v-if="contentAfterMark"
        v-html="contentAfterMark"
        id="markdown-preview"
        class="dialogue-panel__robot-content"
      ></div>
      <div class="loading" v-else-if="!contentAfterMark">
        <img src="/src/assets/images/loading.png" alt="" class="loading-icon">
        <div class="loading-text">openEuler Copilot System正在生成回答......</div>
      </div>
      <div v-if="$slots.default" class="dialogue-panel__robot-slot">
        <!-- <div class="dialog-panel__robot-time">
          {{ dayjs().format('YYYY-MM-DD HH:mm:ss') }}
        </div> -->
        <slot name="default"></slot>
      </div>
      <div class="dialogue-panel__robot-bottom" v-if="!$slots.default && contentAfterMark">
        <div class="action-buttons">
          <div class="pagenation" v-if="props.isFinish">
              <img
                class="pagenation-arror"
                @click="prePageHandle(Number(cid))"
                src="src/assets/svgs/arror_left.svg"
              />
              <span class="pagenation-cur">{{ currentSelected! + 1 }}</span>
              <span class="pagenation-total">{{ `/${content?.length}` }}</span>
              <img
                class="pagenation-arror"
                @click="nextPageHandle(Number(cid))"
                src="src/assets/svgs/arror_right.svg"
              />
            </div>
          <div class="regenerate-button" v-if="needRegernerate && props.isFinish" @click="handlePauseAndReGenerate(Number(cid))">
            <img v-if="themeStore.theme === 'dark'" src="/src/assets/svgs/dark_regenerate.svg" alt="">
            <img v-else src="/src/assets/svgs/light_regenerate.svg" alt="">
            <div>重新生成</div>
          </div>

          <div class="button-group" v-if="props.isFinish">
            <el-tooltip placement="top"  content="复制" effect="light">
              <img v-if="themeStore.theme === 'dark'" class="button-icon copy" src="src/assets/svgs/dark_copy.svg" @click="handleCopy" />
              <img v-else class="button-icon copy" src="src/assets/svgs/light_copy.svg" @click="handleCopy" />
            </el-tooltip>
          </div>
        </div>
      </div>
      <div class='search-suggestions' v-if='props.search_suggestions'>
        <h4 class='tip'>你可以继续问我:</h4>
        <ul class='search-suggestions_value'>
          <li class='value'
          v-for="(item, _) in props.search_suggestions" >
          <p @click='selectQuestion(item)'><p class='test' v-if='item.name'>#{{item.name}}</p>{{item.question}}</p></li>
        </ul>
      </div>
    </div>
  </div>
  
</template>

<style lang="scss">

.overflowTable{
  width: 100%;
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
.el-popper[role=tooltip].is-dark, .el-popper[role=tooltip].is-light {
  background-color: var(--o-bg-color-base);
}

.el-popper .el-popper__arrow::before {
  right: 0;
  visibility: hidden;
}

.el-popper[role=tooltip] {
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

  .against-popover .against-button button:first-child:hover {
    background-color: transparent;
  }

  .against-button button:last-child {
    background-color: var(--o-button-disable-background);
    border: 1px soild pink;
    border-color:var(--o-button-disable-border);
    color: var(--o-button-color);
  }

  .is-disabled, .is-disabled:hover {
    background-color: #b3cbff !important;
    color: #e1eaff;
  }

  .against-popover .error-input__link, .against-popover .error-input__desc {
    background-color: var(--o-bg-color-light);
  }
}

.against-popover {
  .radio {
    width: 88px;
    margin-bottom: 4px;
  }

  .radio_item, .el-radio-button__inner {
    min-width: 88px;
    width: 100%;
    height: 32px;
    border: none;
    background-color: var(--o-bg-color-light);
    color: var(--o-text-color-primary);
  }

  .el-radio-button__original-radio:checked + .el-radio-button__inner {
    border: none;
    background-color: transparent;
    color: #6395fd;
    background-image: linear-gradient(to right, rgba(109, 117, 250, 0.2), rgba(90, 179, 255, 0.2));
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
  // background-color: pink;
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
  width:calc(100% - 48px);
  &__user {
    position: relative;
    margin-bottom: 24px;

    &-time {
      display: flex;
      padding-left: calc(50% - 37px);
      color: #8d98aa;
      font-size: 12px;
      margin-top: 16px;
      span{
        background-color: var(--o-span-color);
        padding: 0px 2px;
        border-radius: 12px;
      }
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

    p {
      min-height: 48px;
      border-radius: 8px;
      border-top-left-radius: 0px;
      display: flex;
      align-items: center;
      color: var(--o-text-color-primary);
      margin-left: 45px;
      background-image: linear-gradient(to right, rgba(109, 117, 250, 0.2), rgba(90, 179, 255, 0.2));
    }
  }

  &__robot {
    position: relative;
    padding-left: 45px;
    border-radius: 8px;

    .loading {
      display: flex;
      min-height: 72px;
      padding: 24px;
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
        left: -10px;
        top: 0px;
        width: 48px;
        height: 48px;
        background-image: url('src/assets/images/robot.png');
      }

      &-icon {
        animation: rotate-img 1s infinite linear;
      }

      &-text {
        font-size: 16px;
        line-height: 24px;
        padding-left: 12px;
        color: #6395FD;
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
        background-image: url('src/assets/images/robot.png');
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
        background-image: url('src/assets/images/robot.png');
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
            img {
              width: 16px;
              height: 16px;
            }

            &-arror {
              margin: 0;
            }

            .pagenation-cur {
              font-size: 12px;
              line-height: 16px;
              color: var(--o-text-color-tertiary) !important;
            }

            .pagenation-total {
              font-size: 12px;
              line-height: 16px;
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
            // margin-right: 8px;
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
            filter: invert(50%) sepia(66%) saturate(446%) hue-rotate(182deg) brightness(100%) contrast(103%)
              contrast(99%);
          }

          .button-icon:hover {
            filter: invert(50%) sepia(66%) saturate(446%) hue-rotate(182deg) brightness(100%) contrast(103%)
              contrast(99%);
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
    position: relative;
    img {
      width: 16px;
      height: 16px;
      margin-right: 8px;
    }

    &-answer {
      display: block;
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

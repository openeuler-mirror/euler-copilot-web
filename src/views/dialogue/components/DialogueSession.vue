<script lang="ts" setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import DialoguePanel from 'src/components/dialoguePanel/DialoguePanel.vue';
import InitalPanel from './InitalPanel.vue';
import { storeToRefs } from 'pinia';
import { useSessionStore, useChangeThemeStore } from 'src/store';

import type { ConversationItem, RobotConversationItem } from '../types';
import { api } from 'src/apis';
import { useHistorySessionStore } from 'src/store/historySession';
import { successMsg } from 'src/components/Message';
import { FitAddon } from 'xterm-addon-fit';
import { AttachAddon } from 'xterm-addon-attach';
import { Terminal } from 'xterm';
import 'xterm/css/xterm.css';
import i18n from 'src/i18n';
const { user_selected_plugins, selectMode } = storeToRefs(useHistorySessionStore());
const session = useSessionStore();

export interface DialogueSession {
  modeOptions: any;
}

const props = withDefaults(defineProps<DialogueSession>(), {});

enum SupportMap {
  support = 1,
  against = 0,

}
// const dialogueRef = ref();
const { pausedStream, reGenerateAnswer, prePage, nextPage } = useSessionStore();
const themeStore = useChangeThemeStore();
const modeOptions = ref(props.modeOptions);
const questions = [
  {
    groupId: 0,
    id: 1,
    question: 'open_euler_community_edition_categories',
  },
  {
    groupId: 0,
    id: 2,
    question: 'lts_release_cycle_and_support',
  },
  {
    groupId: 0,
    id: 3,
    question: 'innovation_release_cycle_and_support',
  },
  {
    groupId: 0,
    id: 4,
    question: 'container_cloud_platform_solution',
  },
  {
    groupId: 1,
    id: 5,
    question: 'sec_gear_main_functions',
  },
  {
    groupId: 1,
    id: 6,
    question: 'dde_description',
  },
  {
    groupId: 1,
    id: 7,
    question: 'lustre_description',
  },
  {
    groupId: 2,
    id: 8,
    question: 'open_euler_testing_management_platform',
  },
  {
    groupId: 2,
    id: 9,
    question: 'open_euler_pkgship',
  },
  {
    groupId: 2,
    id: 10,
    question: 'open_euler_software_package_introduction_principles',
  },
  {
    groupId: 2,
    id: 11,
    question: 'download_rpm_without_installing',
  },
  {
    groupId: 3,
    id: 12,
    question: 'count_the_occurrences_of_the_hello',
  },
  {
    groupId: 3,
    id: 13,
    question: 'convert_uppercase_to_lowercase',
  },
  {
    groupId: 3,
    id: 14,
    question: 'list_files_with_specific_permissions',
  },
  {
    groupId: 3,
    id: 15,
    question: 'search_error_keyword_with_context',
  },
  {
    groupId: 4,
    id: 16,
    question: 'clear_dependencies_for_software_package',
  },
  {
    groupId: 4,
    id: 17,
    question: 'gpgcheck_purpose_in_dnf',
  },
  {
    groupId: 4,
    id: 18,
    question: 'installonly_limit_function_in_dnf',
  },
  {
    groupId: 4,
    id: 19,
    question: 'clean_requirement_on_remove_function_in_dnf',
  },
  {
    groupId: 5,
    id: 20,
    question: 'hunan_tobacco_monopoly_applications_on_openeuler',
  },
  {
    groupId: 5,
    id: 21,
    question: 'xsky_applications_on_openeuler',
  },
];

let groupid = ref(0);

const tagNum = ref(3);

let filterQuestions = computed(() => questions.filter(item => item.groupId === groupid.value % 6));

// 对话输入内容
const dialogueInput = ref<string>('');

// 对话列表
const { sendQuestion } = useSessionStore();
const { conversationList, isAnswerGenerating, dialogueRef} = storeToRefs(useSessionStore());
const { generateSession } = useHistorySessionStore();
const { currentSelectedSession } = storeToRefs(useHistorySessionStore());
/**
 * 发送消息
 */
const handleSendMessage = async (question: string, user_selected_flow?: string[]) => {
  if (isAnswerGenerating.value) return;
  const language = sessionStorage.getItem('localeLang') === 'CN' ? 'zh' : 'en';
  const len = conversationList.value.length;
  if (len > 0 && !(conversationList.value[len - 1] as RobotConversationItem).isFinish) return;
  dialogueInput.value = '';
  if (!currentSelectedSession.value) {
    await generateSession();
  }
  if (user_selected_flow) {
    await sendQuestion(question, undefined, undefined, undefined, user_selected_flow);
  } else {
    await sendQuestion(question, user_selected_plugins.value, undefined, undefined, undefined);
  }
};

/**
 * 处理鼠标事件
 * @param event
 */
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    if (dialogueInput.value !== '') {
      handleSendMessage(dialogueInput.value);
    }
  }
};

/**
 *
 * @param item
 */
const getItem = <T>(item: ConversationItem, field: string): T | undefined => {
  if (field in item) {
    return (item as RobotConversationItem)[field] as T;
  }
  return undefined;
};

// textarea实例
const inputRef = ref<HTMLTextAreaElement | null>(null);

/**
 * 支持、反对 更改逻辑的钩子函数。
 * @param type
 * @param cid
 */
const handleCommont = async (
  type: 'support' | 'against',
  cid: number,
  qaRecordId: number,
  index: number,
  reason?: string,
  reasonLink?: string,
  reasonDescription?: string
) => {
  const params: {
    qaRecordId: string;
    isLike: number;
    dislikeReason?: string;
    reasonLink?: string;
    reasonDescription?: string;
  } = {
    qaRecordId: qaRecordId,
    isLike: SupportMap[type],
    dislikeReason: reason,
    reasonLink: reasonLink,
    reasonDescription: reasonDescription,
  };

  const [_, res] = await api.commentConversation(params);
  if (!_ && res) {
    successMsg(i18n.global.t('feedback.feedbackSuccesful'));
  }
};

/**
 * 举报逻辑的钩子函数。
 * @param type
 * @param cid
 */
const handleReport = async (qaRecordId: string, reason: string) => {
  const params: {
    qaRecordId: string;
    reason: string;
  } = {
    record_id: qaRecordId,
    reason: reason,
  };
  const [_, res] = await api.report(params);
  if (!_ && res) {
    successMsg(i18n.global.t('feedback.feedbackSuccesful'));
  }
};

const changeProblem = () => {
  groupid.value++;
};

const selectQuestion = event => {
  dialogueInput.value = event.target.innerText;
};

const getMode = async () => {
  if (modeOptions.value.length === 1) {
    const [_, res] = await api.getRecognitionMode();
    if (!_ && res) {
      res.result.forEach(item => {
        const opt = {
          label: item.plugin_name,
          value: item.plugin_name,
          disabled: false,
        };
        opt ? modeOptions.value.push(opt) : '';
      });
    }
  } else {
    return;
  }
};

const setOptionDisabled = () => {
  if (selectMode.value.length === 0) {
    modeOptions.value.map(item => {
      item.disabled = false;
      return item;
    });
  } else {
    const isAuto = selectMode.value.some(item => item === 'auto');
    let first = true;
    modeOptions.value.map(item => {
      if (!first) {
        item.disabled = isAuto ? true : false;
      } else {
        item.disabled = isAuto ? false : true;
      }
      first = false;
      return item;
    });
  }
};

let socket = ref(null);
const terminal = ref(null);
const fitAddon = new FitAddon();

let term = ref(null);
let termLoading = ref(false);
let isTermShow = ref(false);
const activePane = ref('shell');

const fnChangeShellBox = isShow => {
  if (isShow) {
    if (!socket.value) {
      termLoading.value = true;
      createWs();
    }
  } else {
    // 关闭连接
    if (socket.value) {
      socket.value.close();
      socket.value = null;
    }
    if (term.value) {
      term.value.dispose();
    }
  }
};

// 创建WebSocket
const createWs = () => {
  socket.value = new WebSocket('ws://10.24.107.18:8002/shell/ws/1/213');
  socket.value.onopen = () => {
    termLoading.value = false;
    // socket.value.send(JSON.stringify({
    //   ctrl: 'resize',
    //   data: {
    //     width: 500,
    //   }
    // }));
  };
  socket.value.onclose = () => {
    // console.log('close');
  };
  socket.value.onerror = e => {
    term.value.write(`\x1b[31m${e}\x1b[m\r\n`);
  };
  initTerm();
};

const initTerm = () => {
  term.value = new Terminal({
    fontSize: 14,
    cursorBlink: true,
    row: 32,
  });
  const attachAddon = new AttachAddon(socket.value);
  term.value.open(terminal.value);
  fitAddon.activate(term.value); // 自适应尺寸
  attachAddon.activate(term.value);

  nextTick(() => {
    fitAddon.fit();
  });
  term.value.focus();
};

onMounted(() => {
  // 全局数据初始化
  // getMode();
  if (!inputRef.value) return;
  inputRef.value.focus();
});

watch(
  () => props,
  () => {
    modeOptions.value = props.modeOptions;
  },
  {
    deep: true,
  }
);

watch(selectMode, (newValue, oldValue) => {
  setOptionDisabled();
  user_selected_plugins.value = [];
  let first = true;
  if (selectMode.value.length !== 0) {
    if (selectMode.value[0] === 'auto') {
      user_selected_plugins.value.push('auto');
    } else {
      selectMode.value.forEach(item => {
        const plugin = {
          plugin_name: item,
        };
        user_selected_plugins.value.push(plugin.plugin_name);
      });
    }
  }
  nextTick(() => {
    const totalW = (document.querySelector('.recognitionMode') as HTMLElement).offsetWidth;
    const selectPreW = (document.querySelector('.el-select') as HTMLElement).offsetWidth;
    const allTags = document.querySelectorAll('.recognitionMode .el-select-tags-wrapper .el-tag--info');
    document.querySelector('.recognitionMode .el-select-tags-wrapper')
      ? ((document.querySelector('.recognitionMode .el-select-tags-wrapper') as HTMLElement).style.display = 'flex')
      : '';
    const allTagsWidth = document.querySelector('.recognitionMode .el-select-tags-wrapper')
      ? (document.querySelector('.recognitionMode .el-select-tags-wrapper') as HTMLElement).offsetWidth
      : '';
    const nTag = allTags[allTags.length - 1] as HTMLElement;
    const isNExist = true;
    if (selectPreW >= totalW && newValue.length > oldValue.length && isNExist) {
      return;
    }
    if (totalW > allTagsWidth + 100) {
      (document.querySelector('.recognitionMode .el-select') as HTMLElement).style.width = `${allTagsWidth + 70}px`;
    } else {
      (document.querySelector('.recognitionMode .el-select') as HTMLElement).style.width = `${totalW}px`;
    }
    if (allTags.length > 3) {
      const lastTag = allTags[allTags.length - 3] as HTMLElement;
      const selectDomW = (document.querySelector('.el-select') as HTMLElement).offsetWidth;
      let show_w = 0;
      if (selectDomW >= totalW) {
        show_w = selectDomW - lastTag.offsetWidth + 200;
        if (show_w >= totalW) {
          tagNum.value = Math.min(tagNum.value, selectMode.value.length - 2);
        } else {
          tagNum.value = Math.min(tagNum.value, selectMode.value.length - 1);
        }
      } else {
        tagNum.value = allTags.length;
      }
    }
  });
});

watch(isTermShow, (newValue, oldValue) => {
  fnChangeShellBox(newValue);
});

/**
 * 暂停和重新生成问答
 */
const handlePauseAndReGenerate = (cid?: number) => {
  // 停止生成handlePauseAndReGenerate
  pausedStream(cid);
};
</script>

<template>
  <div style="height: 100%; width: 100%; display: flex">
    <!-- 会话区域 -->
    <div style="height: 100%" class="dialogue-conversation">
      <div class="dialogue-conversation-main" ref="dialogueRef">
        <DialoguePanel
          v-for="(item, index) in conversationList"
          :cid="item.cid"
          :key="index"
          :type="item.belong"
          :content="item.message"
          :echartsObj="getItem(item, 'echartsObj')"
          :recordList="item.belong === 'robot' ? item.messageList.getRecordIdList() : ''"
          :isLikeList="item.belong === 'robot' ? item.messageList.getIslikeList() : ''"
          :is-finish="getItem(item, 'isFinish')"
          :is-support="getItem(item, 'isSupport')"
          :is-against="getItem(item, 'isAgainst')"
          :test="getItem(item, 'test')"
          :created-at="item.createdAt"
          :current-selected="item.currentInd"
          :need-regernerate="item.cid === conversationList.slice(-1)[0].cid"
          :user-selected-plugins="user_selected_plugins"
          :search_suggestions="getItem(item, 'search_suggestions')"
          @commont="handleCommont"
          @report="handleReport"
          @handleSendMessage="handleSendMessage"
        />
        <div v-if="conversationList.length === 0">
          <InitalPanel />
        </div>
      </div>

      <div class="dialogue-conversation-bottom">
        <!-- 问题换一换 -->
        <div
          v-if="isAnswerGenerating"
          class="dialogue-panel__stop"
          @click="handlePauseAndReGenerate(Number(conversationList.length))"
        >
          <img v-if="themeStore.theme === 'dark'" src="@/assets/svgs/dark_stop_answer.svg" alt="" />
          <img v-else src="@/assets/svgs/light_stop_answer.svg" alt="" />
          <div class="dialogue-panel__stop-answer">
            {{ $t('feedback.stop') }}
          </div>
        </div>
        <div class="problem" v-if="conversationList.length === 0">
          <ul>
            <li v-for="item in filterQuestions" :key="item.id" @click="selectQuestion">
              {{ $t('question.' + item.question) }}
            </li>
          </ul>
          <div class="change-button" @click="changeProblem">
            <img v-if="themeStore.theme === 'dark'" src="@/assets/svgs/light_change.svg" alt="" />
            <img v-else src="@/assets/svgs/dark_change.svg" alt="" />
            <span>{{ $t('main.refresh') }}</span>
          </div>
        </div>
        <!-- 识别方式 -->
        <div class="recognitionMode">
          <el-select
            class="mode-select"
            v-model="selectMode"
            multiple
            collapse-tags
            filterable
            allow-create
            default-first-option
            :placeholder="$t('main.query_interpretation')"
          >
            <el-option
              v-for="item in modeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
              :disabled="item.disabled"
            />
          </el-select>
          <!-- <el-switch v-model="isTermShow" style="margin-left: 10px"
                     active-text="智能shell"></el-switch> -->
        </div>
        <!-- 输入框 -->
        <div class="dialogue-conversation-bottom-sendbox">
          <div class="dialogue-conversation-bottom-sendbox__textarea">
            <textarea
              ref="inputRef"
              v-model="dialogueInput"
              maxlength="2000"
              :placeholder="$t('main.ask_me_anything')"
              @keydown="handleKeydown"
            />
          </div>
          <!-- 发送问题 -->
          <div class="dialogue-conversation-bottom-sendbox__icon">
            <!-- <div class="word-limit"><span :class="[dialogueInput.length>=2000 ? 'red-word' : '']">{{dialogueInput.length}}</span>/2000</div> -->
            <img v-if="isAnswerGenerating || dialogueInput.length <= 0" src="@/assets/images/send_disable.png" alt="" />
            <div v-else @click="handleSendMessage(dialogueInput)">
              <img v-if="themeStore.theme === 'dark'" src="@/assets/images/dark_send.png" alt="" />
              <img v-else src="@/assets/images/light_send.png" alt="" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.dialogue-panel__stop {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 128px;
  height: 40px;
  border-radius: 8px;
  border: 1px solid var(--o-text-color-primary);
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
::v-deep .el-input__inner {
  border: none;
  box-shadow: none;
}

button[disabled] {
  color: white;
  background: #b8d9ff;
  border-color: #b8d9ff;
}

button[disabled]:hover {
  color: white;
  background: #b8d9ff;
  border-color: #b8d9ff;
}

.dialogue-conversation {
  flex: 1;
  border-radius: 0 8px 8px 0;
  display: flex;
  flex-direction: column;
  position: relative;
  align-items: center;
  justify-content: space-between;
  min-width: 500px;

  /* 滚动条轨道样式 */
  ::-webkit-scrollbar-track {
    background-image: linear-gradient(180deg, #e7f0fd 1%, #daeafc 40%) !important;
    display: none;
  }

  ::-webkit-scrollbar {
    width: 3px;
    height: 3px;
    // display: none;
  }

  /* 滚动条的滑块 */
  ::-webkit-scrollbar-thumb {
    background-color: #c3cedf;
    border-radius: 3px;
    // display: none;
  }

  &::before {
    content: '';
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    opacity: 0.4;
    background-image: linear-gradient(180deg, #e7f0fd 1%, #accbee 100%);
    z-index: -1;
  }

  &-main {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    height: calc(100%);
    overflow-y: auto;
    .initial-message {
      background-color: #fff;
    }
  }

  &-bottom {
    margin-top: 24px;
    height: auto;
    width: 1000px;

    &-sendbox {
      background-color: var(--o-bg-color-base);
      height: 120px;
      border-radius: 8px;
      padding: 16px 24px;
      bottom: 0px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

      .word-limit {
        font-size: 12px;
        display: block;
        height: 30px;
        line-height: 30px;
        float: right;
        text-align: center;
        margin-right: 98px;
        color: #8d98aa;

        .red-word {
          color: #e02020;
        }
      }

      .send-button {
        position: absolute;
        font-size: 12px;
        width: 80px;
        height: 30px;
        right: 48px;
        bottom: 40px;
        border-radius: 2px;
      }

      &__textarea {
        height: 60%;
        position: relative;

        textarea {
          width: 100%;
          height: 100%;
          border: none;
          color: var(--o-text-color-primary);
          font-size: 16px;
          background-color: var(--o-bg-color-base);
          font-family: HarmonyOS_Sans_SC_Medium, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
            Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;

          &:focus {
            outline: none;
          }

          &::placeholder {
            color: var(--o-text-color-tertiary);
          }
        }

        textarea::-webkit-input-placeholder {
          font-family: HarmonyOS_Sans_SC_Medium;
        }
      }

      &__icon {
        text-align: right;
      }
    }
  }
}

.dialogue-shell {
  flex: 1;
  height: calc(100% - 36px);
  width: 500px;

  :deep(.xterm) {
    padding: 10px;
    height: 100%;
  }
}

.problem {
  display: flex;
  margin-top: 16px;
  bottom: 160px;
  width: 1000px;
  max-height: 100px;
  overflow-y: auto;

  ul {
    display: flex;
    flex-wrap: wrap;

    li {
      padding: 8px 16px;
      font-size: 12px;
      border-radius: 8px;
      color: var(--o-text-color-secondary);
      line-height: 16px;
      background: var(--o-bg-color-base);
      margin-right: 8px;
      margin-bottom: 8px;

      &:hover {
        background-image: linear-gradient(to right, rgba(109, 117, 250, 0.8), rgba(90, 179, 255, 0.8));
        color: var(--o-text-color-fourth);
      }

      &:active {
        background-image: linear-gradient(to right, rgba(109, 117, 250, 1), rgba(90, 179, 255, 1));
        color: var(--o-text-color-fourth);
      }
    }
  }

  div {
    height: 32px;
    margin-left: 8px;
    cursor: pointer;
    padding-top: 8px;
    display: flex;

    img {
      margin-right: 4px;
      width: 14px;
      height: 14px;
    }

    span {
      width: 36px;
      margin-top: -2px;
      font-size: 12px;
      color: var(--o-text-color-secondary);
      line-height: 16px;
    }
  }
}

.change-button {
  position: absolute;
  right: calc(10% + 36px);
  bottom: 168px;
  position: unset;
}

.recognitionMode {
  width: calc(100% - 48px);
  // min-width: 154px;
  margin-bottom: 8px;
  margin-top: 16px;
  border-radius: 8px;

  .mode-select {
    max-width: 100%;
    height: 40px;
    min-width: 160px;
  }
}

::v-deep .el-input__wrapper {
  border: none;
  box-shadow: none;
  height: 40px;
  width: 175px;
}

::v-deep .el-tag .is-closable .el-tag--info .el-tag--default .el-tag--light {
  border-radius: 4px;
}

.multiple-select {
  display: block;
}

:deep(.el-input__wrapper) {
  border-radius: 8px;
}

:deep(.el-select) {
  border-radius: 8px;
  background: var(--o-bg-color-base);
}
</style>

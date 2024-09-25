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
import { listen } from '@tauri-apps/api/event';
import marked from 'src/utils/marked.js';


interface StreamPayload {
  message: string;
}

export interface DialogueSession {
  modeOptions: any;
}

const props = withDefaults(defineProps<DialogueSession>(), {
});

enum SupportMap {
  support = 1,
  against = 0,
}

const { pausedStream, reGenerateAnswer, prePage, nextPage } = useSessionStore();
const themeStore = useChangeThemeStore();
const modeOptions = ref(props.modeOptions);
const questions = [
  {
    groupId: 0,
    id: 1,
    question: 'openEuler社区版本有哪些分类？'
  },
  {
    groupId: 0,
    id: 2,
    question: 'openEuler长期支持版本的发布间隔周期和社区支持各是多久？'
  },
  {
    groupId: 0,
    id: 3,
    question: 'openEuler社区创新版本的发布间隔周期和社区支持各是多久？'
  },
  {
    groupId: 0,
    id: 4,
    question: 'openEuler社区的容器云管理平台解决方案(CCPS)是什么？'
  },
  {
    groupId: 1,
    id: 5,
    question: 'secGear主要提供哪三大能力？'
  },
  {
    groupId: 1,
    id: 6,
    question: 'DDE是一款什么组件？'
  },
  {
    groupId: 1,
    id: 7,
    question: 'Lustre是什么？'
  },
  {
    groupId: 2,
    id: 8,
    question: 'openEuler社区的测试管理平台是什么？'
  },
  {
    groupId: 2,
    id: 9,
    question: 'openEuler的pkgship是什么？'
  },
  {
    groupId: 2,
    id: 10,
    question: 'openEuler软件包引入原则是什么？'
  },
  {
    groupId: 2,
    id: 11,
    question: 'openEuler系统如何将一个RPM包下载到本地而不安装？'
  },
  {
    groupId: 3,
    id: 12,
    question: '请给我一个shell命令，实现以下功能：计算test.txt文件中hello字符串的出现次数'
  },
  {
    groupId: 3,
    id: 13,
    question: '请给我一个shell命令，实现以下功能：linux命令将本目录及子目录文本文件中的大写字母修改成小写字母'
  },
  {
    groupId: 3,
    id: 14,
    question: 'shell命令查找当前目录下权限符合的文件并列出'
  },
  {
    groupId: 3,
    id: 15,
    question: '请给我一个shell命令，实现以下功能：在/home目录及其子目录中查找关键字“error”的文本文件，并将匹配行以及它们前后的3行内容输出到名为“result.txt”的文件中'
  },
  {
    groupId: 4,
    id: 16,
    question: 'openEuler系统如何清除软件源的依赖？'
  },
  {
    groupId: 4,
    id: 17,
    question: 'openEuler系统DNF中的gpgcheck参数是用来做什么的？'
  },
  {
    groupId: 4,
    id: 18,
    question: 'openEuler系统DNF中的installonly_limit参数的作用是？'
  },
  {
    groupId: 4,
    id: 19,
    question: 'openEuler系统DNF中的clean_requirement_on_remove参数具有什么功能？'
  },
  {
    groupId: 5,
    id: 20,
    question: '湖南省烟草专卖局基于openeuler系统有哪些应用？'
  },
  {
    groupId: 5,
    id: 21,
    question: 'XSKY星辰天合公司基于openeuler系统有哪些应用？'
  },
];

let groupid = ref(0);

const selectMode = ref([]);

const user_selected_plugins = ref('');

const tagNum = ref(6);

let filterQuestions = computed(() =>
  questions.filter(item => item.groupId === (groupid.value % 6)));

// 对话输入内容
const dialogueInput = ref<string>('');

// 对话列表
const { sendQuestion } = useSessionStore();
const { conversationList, isAnswerGenerating, dialogueRef } = storeToRefs(useSessionStore());
const { generateSession } = useHistorySessionStore();
const { currentSelectedSession } = storeToRefs(useHistorySessionStore());

/**
 * 发送消息
 */
const handleSendMessage = async (question: string, user_selected_flow?: string[]) => {
  if (isAnswerGenerating.value) return;
  const len = conversationList.value.length;
  if (len > 0 && !(conversationList.value[len - 1] as RobotConversationItem).isFinish){
    return;
  }
  dialogueInput.value = '';
  if (!currentSelectedSession.value) {
    await generateSession();
  }
  if (user_selected_flow) {
    await sendQuestion(question, undefined, undefined, undefined, user_selected_flow);
  } else {
    await sendQuestion(question, selectMode.value, undefined, undefined, undefined);
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
  reasonDescription?: string,
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
    successMsg('反馈成功');
  }
};

/**
 * 举报逻辑的钩子函数。
 * @param type
 * @param cid
 */
const handleReport = async (
  qaRecordId: string,
  reason: string,
) => {
  const params: {
    qaRecordId: string;
    reason: string;
  } = {
    record_id: qaRecordId,
    reason: reason,
  };
  const [_, res] = await api.report(params);
  if (!_ && res) {
    successMsg('反馈成功');
  }
};

const changeProblem = () => {
  groupid.value++;
};

const selectQuestion = (event) => {
  dialogueInput.value = event.target.innerText;
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

onMounted(() => {
  if (!inputRef.value) return;
  inputRef.value.focus();
});

watch(() => props, () => {
  modeOptions.value = props.modeOptions;
}, {
  deep: true
})

const createNewSession = async (): Promise<void> => {
  conversationList.value = [];
  await generateSession();
};

const contentMessage = ref('')

/**
 * 暂停和重新生成问答
 */
const handlePauseAndReGenerate = (cid?: number) => {
    pausedStream(cid);
};

listen<StreamPayload>("fetch-stream-data", (event) => {
  const line = event.payload.message.replace(/^data:\s*/, '').trim();
  try {
    const json = JSON.parse(line);
    const len = conversationList.value.length;
    if (json.search_suggestions) {
    conversationList.value[len-1].search_suggestions = json.search_suggestions;
    } else if (json.qa_record_id) {

    } else {
    contentMessage.value = contentMessage.value + json.content
    let str =  marked.parse(contentMessage.value.replace(/&gt;/g, '>').replace(/&lt;/g, '<'));
    // 将 table 提取出来中加一个 <div> 父节点控制溢出
    let tableStart = str.indexOf('<table>');
    if (tableStart!== -1) {
      str = str.slice(0, tableStart) + '<div class="overflowTable">' + str.slice(tableStart, str.indexOf('</table>') + '</table>'.length).replace('</table>', '</table></div>') + str.slice(str.indexOf('</table>') + '</table>'.length);
    }
    const answerIndex = conversationList.value.length - 1>=0?conversationList.value.length - 1:0;
    const conversationItem = conversationList.value[answerIndex] as RobotConversationItem;
    conversationList.value[len-1].message[conversationItem.currentInd] = str
    }
  } catch (error) {
    if (line == '[DONE]') {
      conversationList.value[conversationList.value.length - 1].isFinish = true;
      isAnswerGenerating.value = false;
      contentMessage.value='';
    } else if (error === '[SENSETIVE]') {
      //敏感词处理
    } else {
      //Error处理
    }
  };
});
</script>

<template>
  <div style="height: 100%; width: 100%; display: flex">
    <!-- 会话区域 -->
    <div style="height: 100%" class="dialogue-session">
      <div class="dialogue-session-main" ref="dialogueRef">
        <DialoguePanel
          v-for="(item, index) in conversationList"
          :cid="item.cid"
          :key="index"
          :type="item.belong"
          :content="item.message"
          :recordList="item.belong === 'robot' ? item.messageList.getRecordIdList() : ''"
          :isLikeList="item.belong === 'robot' ? item.messageList.getIslikeList() : ''"
          :is-finish="getItem(item, 'isFinish')"
          :is-support="getItem(item, 'isSupport')"
          :is-against="getItem(item, 'isAgainst')"
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

      <div class="dialogue-session-bottom">
        <!-- 问题换一换 -->
        <div
          v-if="isAnswerGenerating"
          class="dialogue-panel-stop"
          @click="handlePauseAndReGenerate(Number(conversationList.length))"
        >
          <img
            v-if="themeStore.theme === 'dark'"
            src="/src/assets/svgs/dark_stop_answer.svg"
            alt=""
          />
          <img v-else src="/src/assets/svgs/light_stop_answer.svg" alt="" />
          <div class="dialogue-panel__stop-answer">停止回答</div>
        </div>
        <div class="problem" v-if="conversationList.length === 0">
          <ul>
            <li
              v-for="item in filterQuestions"
              :key="item.id"
              @click="selectQuestion"
            >
              {{ item.question }}
            </li>
          </ul>
          <div class="change-button" @click="changeProblem">
            <img
              v-if="themeStore.theme === 'dark'"
              src="src/assets/svgs/light_change.svg"
              alt=""
            />
            <img v-else src="src/assets/svgs/dark_change.svg" alt="" />
            <span>换一换</span>
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
            :multiple="false" 
            allow-create
            default-first-option
            placeholder="请选择识别方式"
          >
            <el-option
              v-for="item in modeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
              :disabled="item.disabled"
            />
          </el-select>
          <img
            class="renew_btn"
            @click="createNewSession()"
            v-if="isAnswerGenerating || dialogueInput.length <= 0"
            src="/src/assets/images/createIcon.svg"
            alt=""
          />
        </div>
        <!-- 输入框 -->
        <div class="dialogue-session-bottom-sendbox">
          <div class="dialogue-session-bottom-sendbox__textarea">
            <textarea
              ref="inputRef"
              v-model="dialogueInput"
              maxlength="2000"
              placeholder="在此输入你想了解的内容"
              @keydown="handleKeydown"
            />
          </div>
          <!-- 发送问题 -->
          <div class="dialogue-session-bottom-sendbox__icon">
            <!-- <div class="word-limit"><span :class="[dialogueInput.length>=2000 ? 'red-word' : '']">{{dialogueInput.length}}</span>/2000</div> -->
            <img
              v-if="isAnswerGenerating || dialogueInput.length <= 0"
              src="/src/assets/images/send_disable.png"
              alt=""
            />
            <div v-else @click="handleSendMessage(dialogueInput)">
              <img
                v-if="themeStore.theme === 'dark'"
                src="/src/assets/images/dark_send.png"
                alt=""
              />
              <img v-else src="/src/assets/images/light_send.png" alt="" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.renew_btn {
  position: absolute;
  left: calc(100% - 70px);
}

.dialogue-panel-stop {
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

.dialogue-session {
  flex: 1;
  border-radius: 0 8px 8px 0;
  display: flex;
  flex-direction: column;
  position: relative;
  align-items: center;
  justify-content: space-between;
  // min-width: 500px;

  /* 滚动条轨道样式 */
  ::-webkit-scrollbar-track {
    background-image: linear-gradient(
      180deg,
      #e7f0fd 1%,
      #daeafc 40%
    ) !important;
    display: none;
  }

  ::-webkit-scrollbar {
    width: 3px;
    height: 3px;
    display: none;
  }

  /* 滚动条的滑块 */
  ::-webkit-scrollbar-thumb {
    background-color: #c3cedf;
    border-radius: 3px;
    display: none;
  }

  &::before {
    content: "";
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
    // width: 1000px;
    width: calc(100% - 48px);

    &-sendbox {
      background-color: var(--o-bg-color-base);
      // height: 40px;
      border-radius: 8px;
      // padding: 16px 24px;
      padding: 11px;
      bottom: 0px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      overflow: hidden;

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

      &__textarea {
        position: relative;
        height: 100px;
        textarea {
          width: 100%;
          height: 100%;
          border: none;
          color: var(--o-text-color-primary);
          font-size: 12px;
          background-color: var(--o-bg-color-base);
          font-family: HarmonyOS_Sans_SC_Medium, system-ui, -apple-system,
            BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell,
            "Open Sans", "Helvetica Neue", sans-serif;

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
        position: absolute;
        bottom: 8px;
        text-align: right;
        right: 36px;
        img {
          width: 32px;
        }
      }
    }
  }
}

.problem {
  display: flex;
  margin-top: 16px;
  bottom: 160px;
  // width: 1000px;
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
        background-image: linear-gradient(
          to right,
          rgba(109, 117, 250, 0.8),
          rgba(90, 179, 255, 0.8)
        );
        color: var(--o-text-color-fourth);
      }

      &:active {
        background-image: linear-gradient(
          to right,
          rgba(109, 117, 250, 1),
          rgba(90, 179, 255, 1)
        );
        color: var(--o-text-color-fourth);
      }
    }
  }

  div {
    height: 28px;
    position: absolute;
    right: 32px;
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
  }
}

::v-deep .el-input__wrapper {
  border: none;
  box-shadow: none;
  height: 40px;
  width: 150px;
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

<script lang="ts" setup>
import { onMounted, ref } from "vue";
import DialoguePanel from "src/components/dialoguePanel/DialoguePanel.vue";
import InitalHome from "./InitalHome.vue";
import { storeToRefs } from "pinia";
import { useSessionStore, useChangeThemeStore } from "src/store/session";
import type { ConversationItem, RobotConversationItem } from "../types";
import { api } from "src/apis/";
import { useHistorySessionStore } from "src/store/";
import { errorMsg, successMsg } from "src/components/Message";
import { runCommand } from "src/utils";
import { listen } from "@tauri-apps/api/event";
import { arch } from "@tauri-apps/api/os";
import marked from "src/utils/marked";

interface StreamPayload {
  message: string;
}

export interface DialogueSession {
  modeOptions: any;
}

export interface ExampleQuestionItem {
  groupId: number;
  id: number;
  question: string;
}

enum SupportMap {
  support = 1,
  against = 0,
}

const { pausedStream } = useSessionStore();
const themeStore = useChangeThemeStore();

const selectMode = ref("");
const selectedPlugin = ref("");
const copyList = ref("");

// 对话输入内容
const dialogueInput = ref<string>("");

// 对话列表
const { sendQuestion, judgeMessage } = useSessionStore();
const { conversationList, isAnswerGenerating, dialogueRef } = storeToRefs(
  useSessionStore()
);
const { generateSession } = useHistorySessionStore();
const { currentSelectedSession } = storeToRefs(useHistorySessionStore());

/**
 * 发送消息
 */
const handleSendMessage = async (
  question: string,
  user_selected_flow?: string
) => {
  if (isAnswerGenerating.value) return;
  const len = conversationList.value.length;
  if (
    len > 0 &&
    !(conversationList.value[len - 1] as RobotConversationItem).isFinish
  ) {
    return;
  }
  dialogueInput.value = "";
  if (!currentSelectedSession.value) {
    await generateSession();
  }
  if (user_selected_flow) {
    await sendQuestion(
      question,
      undefined,
      undefined,
      undefined,
      user_selected_flow
    );
  } else {
    await sendQuestion(
      question,
      selectMode.value,
      undefined,
      undefined,
      undefined
    );
  }
};

/**
 * 处理鼠标事件
 * @param event
 */
const handleKeydown = (evt: any): any => {
  if (evt.key === "Enter" && !evt.shiftKey) {
    evt.preventDefault();
    if (dialogueInput.value !== "") {
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

// TextArea 实例
const inputRef = ref<HTMLTextAreaElement | null>(null);

/**
 * 支持、反对 更改逻辑的钩子函数。
 * @param type
 * @param cid
 */
const handleComment = async (
  type: "support" | "against",
  recordId: string,
  reason?: string,
  reasonLink?: string,
  reasonDescription?: string
) => {
  const params: {
    recordId: string;
    isLike: number;
    dislikeReason?: string;
    reasonLink?: string;
    reasonDescription?: string;
  } = {
    recordId: recordId,
    isLike: SupportMap[type],
    dislikeReason: reason,
    reasonLink: reasonLink,
    reasonDescription: reasonDescription,
  };

  const [_, res] = await api.commentConversation(params);
  if (!_ && res) {
    successMsg("反馈成功");
  }
};

/**
 * 举报逻辑的钩子函数。
 * @param type
 * @param cid
 */
const handleReport = async (recordId: string, reason?: string | undefined) => {
  const params: {
    recordId: string;
    reason: string;
  } = {
    recordId: recordId,
    reason: reason ? reason : "",
  };
  const [_, res] = await api.report(params);
  if (!_ && res) {
    successMsg("反馈成功");
  }
};

onMounted(() => {
  if (!inputRef.value) return;
  inputRef.value.focus();
});

const createNewSession = async (): Promise<void> => {
  isAnswerGenerating.value = false;
  conversationList.value = [];
  await generateSession();
};

const contentMessage = ref("");

/**
 * 暂停和重新生成问答
 */
const handlePauseAndReGenerate = (cid?: number) => {
  pausedStream(cid);
  isAnswerGenerating.value = false;
  contentMessage.value = "";
};

const handleCreateNewSession = (cid?: number) => {
  handlePauseAndReGenerate(cid);
  createNewSession();
}

const handleMarkdown = async (content: string) => {
  const lastIndex = conversationList.value.length - 1;
  let markedStr = marked.parse(
    content.replace(/&gt;/g, ">").replace(/&lt;/g, "<")
  );
  // 将 table 提取出来中加一个 <div> 父节点控制溢出
  if (typeof markedStr === "string") {
    let tableStart = markedStr.indexOf("<table>");
    if (tableStart !== -1) {
      markedStr =
        markedStr.slice(0, tableStart) +
        '<div class="overflowTable">' +
        markedStr
          .slice(tableStart, markedStr.indexOf("</table>") + "</table>".length)
          .replace("</table>", "</table></div>") +
        markedStr.slice(markedStr.indexOf("</table>") + "</table>".length);
    }
    const answerIndex = lastIndex >= 0 ? lastIndex : 0;
    const conversationItem = conversationList.value[
      answerIndex
    ] as RobotConversationItem;
    (conversationList.value[lastIndex] as RobotConversationItem).message[
      conversationItem.currentInd
    ] = markedStr;
    (conversationList.value[lastIndex] as RobotConversationItem).copyList[
      conversationItem.currentInd
    ] = copyList.value + content;
  }
};

listen<StreamPayload>("fetch-stream-data", (event) => {
  const line = event.payload.message.replace(/^data:\s*/, "").trim();
  const lastIndex = conversationList.value.length - 1;
  try {
    const json = JSON.parse(line);
    if (json.search_suggestions) {
      (
        conversationList.value[lastIndex] as RobotConversationItem
      ).searchSuggestions = json.search_suggestions;
    } else if (json.qa_record_id) {
    } else if (json.type === "extract") {
      let data = json.data;
      if (typeof data === "string") {
        data = JSON.parse(data);
      }
      if (data.shell) {
        const command = data.shell as string;
        if (command.startsWith("docker")) {
          arch().then((architecture) => {
            if (architecture === "x86_64") {
              runCommand(command);
            } else {
              errorMsg("AI 容器镜像当前只支持在 x86_64 架构上运行");
            }
          });
        } else {
          runCommand(command);
        }
      } else if (data.script) {
        console.log(data.script);
      } else if (data.output) {
        contentMessage.value = data.output;
        handleMarkdown(contentMessage.value);
      }
    } else if (json.content) {
      contentMessage.value = contentMessage.value + json.content;
      handleMarkdown(contentMessage.value);
    }
  } catch (error) {
    contentMessage.value = "";
    if (line === "[DONE]") {
      (conversationList.value[lastIndex] as RobotConversationItem).isFinish =
        true;
      isAnswerGenerating.value = false;
    } else if (judgeMessage(lastIndex, line)) {
      console.error("JSON decode error:", line);
    }
  }
});
</script>

<template>
  <div style="height: 100%; width: 100%; display: flex">
    <!-- 会话区域 -->
    <div style="height: 100%" class="dialogue-session">
      <div class="dialogue-session-main" ref="dialogueRef">
        <DialoguePanel
          v-for="(item, index) in conversationList"
          :cid="item.cid.toString()"
          :key="index"
          :type="item.belong"
          :content="item.message"
          :copyList="item.copyList"
          :recordList="
            item.belong === 'robot'
              ? item.messageList.getRecordIdList()
              : undefined
          "
          :isLikeList="
            item.belong === 'robot'
              ? item.messageList.getIslikeList()
              : undefined
          "
          :is-finish="getItem(item as ConversationItem, 'isFinish')"
          :is-support="getItem(item as ConversationItem, 'isSupport')"
          :is-against="getItem(item as ConversationItem, 'isAgainst')"
          :created-at="item.createdAt"
          :current-selected="item.currentInd"
          :need-regernerate="item.cid === conversationList.slice(-1)[0].cid"
          :user-selected-plugins="selectedPlugin"
          :search-suggestions="getItem(item as ConversationItem, 'searchSuggestions')"
          @comment="handleComment"
          @report="handleReport"
          @handleSendMessage="handleSendMessage"
        />
        <div v-if="conversationList.length === 0">
          <InitalHome />
        </div>
      </div>

      <div class="dialogue-session-bottom">
        <!-- 停止回答 -->
        <div
          v-if="isAnswerGenerating"
          class="dialogue-panel__stop"
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
        <div class="dialogue-btn-send">
          <!-- 新建对话 -->
          <div
            class="dialogue-session-bottom-refresh"
            @click="isAnswerGenerating ? handleCreateNewSession(Number(conversationList.length)) : createNewSession()"
          >
            <img class="refresh-button" src="/src/assets/svgs/create.svg" />
          </div>
          <!-- 输入框 -->
          <div class="dialogue-session-bottom-sendbox">
            <div class="dialogue-session-bottom-sendbox__textarea">
              <el-input
                ref="inputRef"
                type="textarea"
                :autosize="{ minRows: 1, maxRows: 4 }"
                placeholder="在此输入你想了解的内容，输入Shift+Enter换行"
                v-model="dialogueInput"
                maxlength="2000"
                resize="none"
                @keydown="handleKeydown"
              >
              </el-input>
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
  </div>
</template>
<style>
.el-textarea__inner,
.el-textarea__inner:focus,
.el-textarea__inner:hover {
  box-shadow: unset !important;
  font-size: 16px;
  min-height: 56px !important;
  padding: 16px !important;
  line-height: 24px;
}
</style>
<style lang="scss" scoped>
.refresh-button {
  height: 36px;
  position: relative;
  left: 0;
  cursor: pointer;
}

.dialogue-panel__stop {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 128px;
  height: 40px;
  border-radius: 8px;
  border: 1px solid var(--o-text-color-primary);
  margin: 38px auto 16px;
  cursor: pointer;
  position: relative;

  img {
    width: 16px;
    height: 16px;
    margin-right: 8px;
  }

  &-answer {
    display: block;
    font-size: 14px;
    color: var(--o-text-color-primary);
    line-height: 24px;
  }
}

:deep(.el-input__inner) {
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
  max-width: 100%;
  flex: 1;
  border-radius: 0 8px 8px 0;
  display: flex;
  flex-direction: column;
  position: relative;
  align-items: center;
  justify-content: space-between;

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
    height: 100%;
    overflow-y: auto;

    .initial-message {
      background-color: #fff;
    }
  }

  &-bottom {
    margin-top: 24px;
    height: auto;
    width: 100%;

    &-refresh {
      width: 56px;
      height: 56px;
      background-color: var(--o-bg-color-base);
      border-radius: 8px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
    }

    &-sendbox {
      background-color: var(--o-bg-color-base);
      border-radius: 8px;
      bottom: 0px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
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
        bottom: 4px;
        text-align: right;
        right: 4px;

        img {
          width: 40px;
        }
      }
    }
  }
}

:deep(.el-input__wrapper) {
  border: none;
  box-shadow: none;
  height: 40px;
  width: 150px;
}

:deep(.el-tag .is-closable .el-tag--info .el-tag--default .el-tag--light) {
  border-radius: 4px;
}

:deep(.el-input__wrapper) {
  border-radius: 8px;
}

:deep(.el-select) {
  border-radius: 8px;
  background: var(--o-bg-color-base);
}

.dialogue-btn-send {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dialogue-session-bottom-sendbox__icon {
  width: 40px;
  height: 40px;
  position: relative;
}

.dialogue-session-bottom-sendbox {
  display: flex;
  align-items: baseline;
  padding-right: 8px;
  flex: 1;
}

.dialogue-session-bottom-sendbox__textarea {
  flex: 1;
}
</style>

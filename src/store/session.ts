// Copyright (c) Huawei Technologies Co., Ltd. 2023-2024. All rights reserved.
// licensed under the Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.
import { defineStore } from 'pinia';
import { ref, nextTick } from 'vue';
import { useHistorySessionStore } from 'src/store';
import {
  MessageArray,
  type ConversationItem,
  type RobotConversationItem,
  type UserConversationItem,
} from 'src/views/dialogue/types';
import { api } from 'src/apis';
import { successMsg } from 'src/components/Message';
import { invoke } from '@tauri-apps/api/tauri';

let controller = new AbortController();
export const useSessionStore = defineStore('session', () => {
  // #region ----------------------------------------< scroll >--------------------------------------
  // 会话窗口容器
  const dialogueRef = ref<HTMLDivElement | null>(null);
  /**
   * 滚动到底部
   */
  const scrollBottom = (action: 'smooth' | 'auto' = 'smooth'): void => {
    nextTick(() => {
      if (!dialogueRef.value) {
        return;
      }
      //完成所有渲染再执行
      setTimeout(() => {
        dialogueRef.value?.scrollTo({
          top: dialogueRef.value.scrollHeight,
          behavior: action,
        });
      }, 0);
    });
  };

  // #endregion
  // 是否暂停回答
  const isPaused = ref(false);
  // 会话列表
  const conversationList = ref<ConversationItem[]>([]);

  // ai回复是否还在生成中
  const isAnswerGenerating = ref<boolean>(false);
  /**
   * 请求流式数据
   * @param params
   */
  const getStream = async (
    params: {
      question: string;
      conversationID?: string;
      userSelectedPlugin?: string;
      recordID?: string;
      userSelectedFlow?: string;
    },
    ind?: number
  ): Promise<void> => {
    const { currentSelectedSession } = useHistorySessionStore();
    params.conversationID = currentSelectedSession;
    console.log("Current conversation ID:", params.conversationID);
    // 当前问答在整个问答记录中的索引
    const answerIndex = ind ?? conversationList.value.length - 1;
    // const conversationItem = conversationList.value[answerIndex] as RobotConversationItem;

    controller = new AbortController();
    try {
      const sessionId: string = await invoke("refresh_session_id", {
        sessionId: localStorage.getItem('session'),
      });
      localStorage.setItem('session', sessionId);
      console.log("Refreshed session ID:", sessionId)
    } catch (error) {
      console.error("Error refreshing session ID:", error);
    }
    try {
      await invoke('chat', {
        session: localStorage.getItem('session'),
        question: params.question,
        conversation: params.conversationID,
        language: 'zh',
        record: params.recordID,
        plugin: params.userSelectedPlugin,
        flow: params.userSelectedFlow,
        flowId: "",
      }).then(async (status: any) => {
        console.log(status);
        const isServiceOk = await handleServiceStatus(status);
        if (!isServiceOk) {
          return;
        }
      }).catch((error) => {
        throw new Error(`RUST backend error: ${error}`);
      })
    } catch (err: any) {
      console.log(err);
      isPaused.value = true;
      isAnswerGenerating.value = false;
      (conversationList.value[answerIndex] as RobotConversationItem).isFinish = true;
      if (err.name === 'AbortError') {
        successMsg('暂停成功');
        (conversationList.value[answerIndex] as RobotConversationItem).isFinish = true;
      } else {
        (conversationList.value[answerIndex] as RobotConversationItem).message[
          (conversationList.value[answerIndex] as RobotConversationItem).currentInd
        ] += '系统繁忙，请稍后再试';
      }
    }
  };

  const handleServiceStatus = async (
    status: number
  ): Promise<boolean> => {
    if (status === 401 || status === 403) {
      return false;
    } else if (status === 429) {
      throw new Error(`HTTP error, Rate limit exceeded`);
    } else {
      return true;
    }
  };

  /**
   * 处理不合法信息
   * @param ind 当前问答对索引
   */
  const judgeMessage = (ind: number, msg: string): boolean => {
    let errorMsg = '';
    if (msg.includes('[SENSITIVE]')) {
      errorMsg = '很抱歉，暂时只支持问题 openEuler 和 Linux 领域相关的问题';
    }
    if (msg.includes('[ERROR]')) {
      errorMsg = '系统繁忙，请稍后再试';
    }
    if (errorMsg) {
      (conversationList.value[ind] as RobotConversationItem).message[
        (conversationList.value[ind] as RobotConversationItem).currentInd
      ] = errorMsg;
      (conversationList.value[ind] as RobotConversationItem).isFinish = true;
      isAnswerGenerating.value = false;
      scrollBottom();
      return false;
    }
    return true;
  };

  /**
   * 发送问题
   * @param question 问题
   * @param regenerateInd 重新生成的回答索引
   */
  const sendQuestion = async (
    question: string,
    userSelectedPlugin?: string,
    regenerateInd?: number,
    recordId?: string,
    user_selected_flow?: string,
  ): Promise<void> => {
    if (regenerateInd) {
      // 重新生成，指定某个回答，修改默认索引
      (conversationList.value[regenerateInd] as RobotConversationItem).message.push('');//123
      (conversationList.value[regenerateInd] as RobotConversationItem).currentInd =
        (conversationList.value[regenerateInd] as RobotConversationItem).message.length - 1;//123
    } else {
      // 初次生成 ，创建一个问题和一个回答
      const ind = conversationList.value.length;
      const a = new MessageArray()
      a.addItem('', '', 2);
      conversationList.value.push(
        {
          cid: ind + 1,
          belong: 'user',
          message: question,
        },
        {
          cid: ind + 2,
          belong: 'robot',
          message: [''],
          copyList:[''],
          messageList: a,
          currentInd: 0,
          isFinish: false,
          recordId: '',
          groupId: '',
          sessionId: '',
        }
      );
    }
    isAnswerGenerating.value = true;
    scrollBottom();
    if (user_selected_flow) {
      await getStream(
        {
          question,
          recordID: recordId,
          userSelectedPlugin: userSelectedPlugin,
          userSelectedFlow: user_selected_flow,
        },
        regenerateInd ?? undefined
      )
    } else if (userSelectedPlugin) {
      await getStream(
        {
          question,
          recordID: recordId,
          userSelectedPlugin: userSelectedPlugin,
        },
        regenerateInd ?? undefined
      )
    } else {
      await getStream(
        {
          question,
          recordID: recordId,
        },
        regenerateInd ?? undefined
      );
    }
  }

  /**
   * 暂停流式返回
   */
  const pausedStream = async (cid?: number): Promise<void> => {
    const answerIndex =
      conversationList.value.findIndex((val: any) => val.cid === cid) ||
      conversationList.value.length - 1;
    isPaused.value = true;
    (conversationList.value[answerIndex] as RobotConversationItem).isFinish = true;
    cancel();
    await invoke('stop');
  };

  /**
   * 重新生成回答
   * @param cid
   */
  const reGenerateAnswer = (cid: number, userSelectedPlugin: string): void => {
    const answerInd = conversationList.value.findIndex((val) => val.cid === cid);
    const question = (conversationList.value[answerInd - 1] as UserConversationItem).message;
    const recordId = (conversationList.value[answerInd] as RobotConversationItem).recordId;
    (conversationList.value[answerInd] as RobotConversationItem).isFinish = false;
    if (!question) {
      return;
    }
    sendQuestion(question, userSelectedPlugin, answerInd, recordId);
  };

  // #region ----------------------------------------< pagenation >--------------------------------------
  /**
   * 上一条
   * @param cid
   */
  const prePage = (cid: number): void => {
    const answerInd = conversationList.value.findIndex((val) => val.cid === cid);
    if ((conversationList.value[answerInd] as RobotConversationItem).currentInd === 0) {
      return;
    }
    (conversationList.value[answerInd] as RobotConversationItem).currentInd -= 1;
  };
  /**
   * 下一条
   * @param cid
   */
  const nextPage = (cid: number): void => {
    const answerInd = conversationList.value.findIndex((val) => val.cid === cid);

    if (
      conversationList.value[answerInd].message.length - 1 ===
      (conversationList.value[answerInd] as RobotConversationItem).currentInd
    ) {
      return;
    }
    (conversationList.value[answerInd] as RobotConversationItem).currentInd += 1;
  };
  // #endregion

  /**
   * 获取历史对话数据
   * @param sessionId
   */
  const getConversation = async (sessionId: string): Promise<void> => {
    const [_, res] = await api.getHistoryConversation(sessionId);
    if (!_ && res) {
      conversationList.value = [];
      res.result.forEach((record) => {
        if (
          (conversationList.value as RobotConversationItem[]).find(
            (i) => i.groupId === record.groupId
          )
        ) {
          const re = (conversationList.value as RobotConversationItem[]).find(
            (i) => i.groupId === record.groupId
          );
          re?.message.push(record.answer);
          if (typeof (re?.message) !== 'string') {
            re?.messageList.addItem(record.answer, record.recordId, typeof (record.is_like) === 'object' ? 2 : Number(record.is_like));
          }
          return;
        }
        const a = new MessageArray();
        a.addItem(record.answer, record.recordId, typeof (record.is_like) === 'object' ? 2 : Number(record.is_like));
        conversationList.value.push(
          {
            cid: conversationList.value.length + 1,
            belong: 'user',
            message: record.question,
            createdAt: record.created_time,
          },
          {
            cid: conversationList.value.length + 2,
            belong: 'robot',
            message: [record.answer],
            copyList:[''],
            messageList: a,
            currentInd: 0,
            isAgainst: false,
            isSupport: false,
            isFinish: true,
            recordId: record.recordId,
            sessionId: record.conversationId,
            groupId: record.groupId,
          }
        );
        scrollBottom('auto');
      });
    }
  };

  const cancel = () => {
    controller.abort();
  };

  return {
    isPaused,
    conversationList,
    isAnswerGenerating,
    dialogueRef,
    judgeMessage,
    sendQuestion,
    pausedStream,
    prePage,
    nextPage,
    reGenerateAnswer,
    getConversation,
    cancel,
  };
});

export const useChangeThemeStore = defineStore('theme', () => {
  const theme = ref('');
  const themeValue = localStorage.getItem('theme');
  if (themeValue) {
    theme.value = themeValue;
  } else {
    theme.value = 'dark'
  }
  return {
    theme,
  }
});

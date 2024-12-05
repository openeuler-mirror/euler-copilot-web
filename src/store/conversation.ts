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
import { useAccountStore, useHistorySessionStore } from 'src/store';
import {
  MessageArray,
  type ConversationItem,
  type RobotConversationItem,
  type UserConversationItem,
} from 'src/views/dialogue/types';
import { api } from 'src/apis';
import { successMsg } from 'src/components/Message';
import i18n from 'src/i18n';



const STREAM_URL = '/api/chat';
let controller = new AbortController();
export var txt2imgPath = ref("");
export var echartsObj = ref({});
export var echartsHas = ref(false);
var excelPath = ref('');

function getCookie(name: string) {
  let matches = document.cookie.match(new RegExp(
    "(?:^|; )" + name.replace(/([.$?*|{}()\[\]\\/+^])/g, '\\$1') + "=([^;]*)"
  ));
  return matches ? decodeURIComponent(matches[1]) : undefined;
}

export const useSessionStore = defineStore('conversation', () => {
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
        dialogueRef.value.scrollTo({
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
      user_selected_plugins?: any,
      sessionId?: string;
      qaRecordId?: string;
      user_selected_flow?: string;
    },
    ind?: number
  ): Promise<void> => {
    const language = sessionStorage.getItem('localeLang') === 'EN' ? 'en' : 'zh';
    const { currentSelectedSession } = useHistorySessionStore();
    params.sessionId = currentSelectedSession;
    // 当前问答在整个问答记录中的索引
    const answerIndex = ind ?? conversationList.value.length - 1;
    const conversationItem = conversationList.value[answerIndex] as RobotConversationItem;

    controller = new AbortController();
    const headers = {
      user: JSON.stringify({ userName: 'openEuler' }),
    };
    headers['Content-Type'] = 'application/json; charset=UTF-8';
    headers['X-CSRF-Token'] = getCookie('_csrf_tk');
    try {
      let resp;
      if (params.user_selected_flow) {
        resp = await fetch(STREAM_URL, {
          signal: controller.signal,
          method: 'POST',
          keepalive: true,
          headers: headers,
          body: JSON.stringify({
            question: params.question,
            conversation_id: params.sessionId,
            record_id: params.qaRecordId,
            files: [],
            user_selected_plugins: [],
            user_selected_flow: params.user_selected_flow,
            language,
          }),
        });
      }
      else if (params.user_selected_plugins) {
        resp = await fetch(STREAM_URL, {
          signal: controller.signal,
          method: 'POST',
          keepalive: true,
          headers: headers,
          body: JSON.stringify({
            question: params.question,
            conversation_id: params.sessionId,
            record_id: params.qaRecordId,
            files: [],
            user_selected_plugins: params.user_selected_plugins,
            language,
          }),
        });
      } else {
        resp = await fetch(STREAM_URL, {
          signal: controller.signal,
          keepalive: true,
          method: 'POST',
          headers: headers,
          body: JSON.stringify({
            question: params.question,
            conversation_id: params.sessionId,
            record_id: params.qaRecordId,
            files: [],
            user_selected_plugins: [],
            language,
          }),
        });
      }

      const isServiceOk = await handleServiceStatus(resp.status, params, ind);
      if (!isServiceOk) {
        return;
      }
      if (!resp.ok) {
        throw new Error(`HTTP error! status: ${resp.status}`);
      }
      if (!resp.body) {
        throw new Error(`HTTP error, body not exits`);
      }
      const reader = resp.body.getReader();
      const decoder = new TextDecoder('utf-8');

      let isEnd = true;
      isPaused.value = false;
      excelPath.value = '';
      echartsObj.value = {};
      txt2imgPath.value = '';
      while (isEnd) {
        if (isPaused.value) {
          // 手动暂停输出
          isAnswerGenerating.value = false;
          break;
        }
        const { done, value } = await reader.read();
        const decodedValue = decoder.decode(value, { stream: true });

        const isLegal = judgeMessage(answerIndex, decodedValue);
        if (!isLegal) {
          isEnd = false;
          break;
        }

        if (done) {
          if (excelPath.value.length > 0) {
            conversationItem.message[conversationItem.currentInd] += `</p><p>下载地址：${excelPath.value}`;
          }

          conversationItem.isFinish = true;
          isEnd = false;
          isAnswerGenerating.value = false;
          break;
        }
        const lines = decodedValue.split('\n\n').filter((line) => line.startsWith('data: {'));
        lines.forEach((line) => {
          const message = JSON.parse(line.replace(/^data:\s*/, '').trim());
          if (message["POST /txt2img"]) {
            const innerObj = JSON.parse(message["POST /txt2img"]);
            txt2imgPath.value = 'https://10.2.122.204/images/' + innerObj['image_name'];
          }
          else if ('gen_graph' in message) {
            echartsObj.value = JSON.parse(message["gen_graph"]);
          }
          else if (message["POST /transcribe"]) {
            const innerObj = JSON.parse(message["POST /transcribe"]);
            excelPath.value = 'https://10.2.122.203/outputs/' + innerObj['transcription'];
          }
          else if ('search_suggestions' in message) {
            conversationItem.search_suggestions = message.search_suggestions;
          }
          else if ('files' in message) {
            conversationItem.files = message.files;
          }
          else if ('qa_record_id' in message) {
            conversationItem.recordId = message.record_id;
          }
          else if ('type' in message) {
            if(message["type"]=== "render"){
              echartsObj.value = JSON.parse(message["data"]);
              echartsHas.value = true;
              conversationItem.echartsObj = JSON.parse(message["data"]);
              conversationItem.test = true;
            }else{

            }
          } else {
            // if (message.content.startsWith('<<<') && message.content.endWith('>>>')) {
            //   const obj = extractAttributesFromMarker(message.content);
            //   if (obj) {
            //     conversationItem.message[conversationItem.currentInd] += `## ${obj.title} \n`;
            //     conversationItem.message[
            //       conversationItem.currentInd
            //     ] += `<iframe src="${obj.link}" frameborder="0" width="100%" height="300"></iframe>`;
            //   }
            // } else {
              conversationItem.message[conversationItem.currentInd] += message.content;
            // }
            // if (dialogueRef.value.scrollHeight - (dialogueRef.value.clientHeight + dialogueRef.value.scrollTop) >= 2) {
            //   return
            // } else {
            //   scrollBottom();
            // }
            scrollBottom();
          }
        });
      }
    } catch (err: any) {
      console.log(err);
      isPaused.value = true;
      isAnswerGenerating.value = false;
      (conversationList.value[answerIndex] as RobotConversationItem).isFinish = true;
      if (err.name === 'AbortError') {
        successMsg(i18n.global.t('feedback.stopSuccessful'));
        (conversationList.value[answerIndex] as RobotConversationItem).isFinish = true;
      } else {
        (conversationList.value[answerIndex] as RobotConversationItem).message[
          (conversationList.value[answerIndex] as RobotConversationItem).currentInd
        ] += i18n.global.t('feedback.systemBusy');
      }
    }
  };

  /**
   * 解析图表格式的文本
   */
  const extractAttributesFromMarker = (str: string): { title: string; link: string } | null => {
    const regex = /<<<[^>]*title="([^"]+)"[^>]*link="([^"]+)"[^>]*>>>/;

    const match = str.match(regex);

    if (match) {
      return {
        title: match[1],
        link: match[2],
      };
    } else {
      return null;
    }
  };

  const handleServiceStatus = async (
    status: number,
    params: {
      question: string;
      sessionId?: string;
      qaRecordId?: string;
    },
    ind?: number
  ): Promise<boolean> => {
    if (status === 401 || status === 403) {
      // 鉴权失败重发
      const store = useAccountStore();
      const res = await store.refreshAccessToken();
      if (res) {
        await getStream(params, ind);
      }
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
      errorMsg = i18n.global.t('feedback.onlySupport');
    }
    //error没加限制
    if (msg.includes('[ERROR]')) {
      errorMsg = i18n.global.t('feedback.systemBusy');
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
    user_selected_plugins?: string[],
    regenerateInd?: number,
    qaRecordId?: string,
    user_selected_flow?: string,
  ): Promise<void> => {
    const { updateSessionTitle, currentSelectedSession } = useHistorySessionStore();
    if (conversationList.value.length === 0) {
      // 如果当前还没有对话记录，将第一个问题的questtion作为对话标题
      updateSessionTitle({ sessionId: currentSelectedSession, title: question.slice(0, 20) });
    }
    if (regenerateInd) {
      // 重新生成，指定某个回答，修改默认索引
      (conversationList.value[regenerateInd] as RobotConversationItem).message.push('');//123
      (conversationList.value[regenerateInd] as RobotConversationItem).currentInd =
        (conversationList.value[regenerateInd] as RobotConversationItem).message.length - 1;//123
    } else {
      // 初次生成 ，创建一个问题和一个回答
      const ind = conversationList.value.length - 1;
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
          qaRecordId,
          user_selected_plugins,
          user_selected_flow,
        },
        regenerateInd ?? undefined
      )
    } else if (user_selected_plugins?.length) {
      await getStream(
        {
          question,
          qaRecordId,
          user_selected_plugins: [...user_selected_plugins],
        },
        regenerateInd ?? undefined
      )
    } else {
      await getStream(
        {
          question,
          qaRecordId,
        },
        regenerateInd ?? undefined
      );
    }
  };
  /**
   * 暂停流式返回
   */
  const pausedStream = async (cid?: number): Promise<void> => {
    const answerIndex = conversationList.value.findIndex((val) => val.cid === cid) !== -1 ? conversationList.value.findIndex((val) => val.cid === cid) : conversationList.value.length - 1;
    isPaused.value = true;
    (conversationList.value[answerIndex] as RobotConversationItem).isFinish = true;
    cancel();
    await api.stopGeneration();
  };
  /**
   * 重新生成回答
   * @param cid
   */
  const reGenerateAnswer = (cid: number, user_selected_plugins: any[]): void => {
    const answerInd = conversationList.value.findIndex((val) => val.cid === cid);
    const question = (conversationList.value[answerInd - 1] as UserConversationItem).message;
    const recordId = (conversationList.value[answerInd] as RobotConversationItem).recordId;
    (conversationList.value[answerInd] as RobotConversationItem).isFinish = false;
    if (!question) {
      return;
    }
    sendQuestion(question, user_selected_plugins, answerInd, recordId);
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
    const index = (conversationList.value[answerInd] as RobotConversationItem).currentInd;
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
    const index = (conversationList.value[answerInd] as RobotConversationItem).currentInd;

  };
  // #endregion

  /**
   * 获取历史对话数据
   * @param sessionId
   */
  const getConversation = async (sessionId: string): Promise<void> => {
    const [_, res] = await api.getHistoryConversation(sessionId);
    //
    if (!_ && res) {
      conversationList.value = [];
      res.result.forEach((record) => {
        if (
          (conversationList.value as RobotConversationItem[]).find(
            (i) => i.groupId === record.group_id
          )
        ) {
          const re = (conversationList.value as RobotConversationItem[]).find(
            (i) => i.groupId === record.group_id
          );
          re?.message.push(record.answer);
          if (typeof (re?.message) !== 'string') {
            re?.messageList.addItem(record.answer, record.record_id, typeof (record.is_like) === 'object' ? 2 : Number(record.is_like));
          }
          return;
        }
        const a = new MessageArray();
        a.addItem(record.answer, record.record_id, typeof (record.is_like) === 'object' ? 2 : Number(record.is_like));
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
            messageList: a,
            currentInd: 0,
            isAgainst: false,
            isSupport: false,
            isFinish: true,
            recordId: record.record_id,
            sessionId: record.conversation_id,
            groupId: record.group_id,
          }
        );
        scrollBottom('auto');
      });
    }
  };

  const comment = (cid: number, isSupport: boolean, index: number): void => {
    const ind = conversationList.value.find((item) => item.cid === cid);
    // ind.message.items[index].is_like = isSupport;
  };

  const cancel = () => {
    controller.abort();
  };
  return {
    isPaused,
    conversationList,
    isAnswerGenerating,
    dialogueRef,
    sendQuestion,
    pausedStream,
    prePage,
    nextPage,
    reGenerateAnswer,
    getConversation,
    comment,
    cancel,
  };
});

export const useChangeThemeStore = defineStore('theme', () => {
  const theme = ref('');
  if (sessionStorage.getItem('theme')) {
    theme.value = sessionStorage.getItem('theme') || 'dark';
  }
  return {
    theme,
  }
});


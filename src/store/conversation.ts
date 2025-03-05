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
  AppShowType,
  MessageArray,
  type ConversationItem,
  type RobotConversationItem,
  type UserConversationItem,
} from 'src/views/dialogue/types';
import { api } from 'src/apis';
import { successMsg } from 'src/components/Message';
import i18n from 'src/i18n';
import { ElMessageBox } from 'element-plus';
import { qiankunWindow } from 'vite-plugin-qiankun/dist/helper';
import { storeToRefs } from 'pinia';
import { Application } from 'src/apis/paths/type';
import $bus from 'src/bus/index'
const STREAM_URL = '/api/chat';
const newStreamUrl = 'api/chat';
let controller = new AbortController();
export var txt2imgPath = ref("");
export var echartsObj = ref({});
export var echartsHas = ref(false);
var excelPath = ref('');
const features = {
  max_tokens: 2048,
  context_num: 2,
}

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
  const app = ref<AppShowType>({});
  const appList = ref<Application[]>();
  // ai回复是否还在生成中
  const isAnswerGenerating = ref<boolean>(false);
  /**
   * 请求流式数据
   * @param params
   * {
**/
  const getStream = async (
    params: {
      question: string;
      user_selected_app?: any,
      conversationId?: string;
      qaRecordId?: string;
      user_selected_flow?: string;
      groupId?: string;
      params?: any;
      type?: any;
    },
    ind?: number
  ): Promise<void> => {
    const language = localStorage.getItem('localeLang') === 'EN' ? 'en' : 'zh';
    const { currentSelectedSession } = useHistorySessionStore();
    params.conversationId = currentSelectedSession;
    // 当前问答在整个问答记录中的索引 openouler有什么ai特性
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
      let pp = {};
      if(params.params && typeof params.params === 'object'){
        pp = params.params;
      }else if(params.params && typeof params.params === 'string'){
        pp = Object(JSON.parse(params.params));
      }else{
        pp = {};
      }
      if (params.user_selected_flow) {
        // 之前的对话历史记录
        if (!params.type) {
          resp = await fetch(STREAM_URL, {
            signal: controller.signal,
            method: 'POST',
            keepalive: true,
            headers: headers,
            body: JSON.stringify({
              question: params.question,
              language,
              conversationId: params.conversationId,
              groupId: params.groupId,
              // record_id: params.qaRecordId,
              app:{
                appId:params.user_selected_app[0],
                flowId: params.user_selected_flow,
                params: pp,
                auth:{},
              },
              features:features,
            }),
          });
        } else {
          // 新的工作流调试记录
          resp = await fetch(newStreamUrl, {
            signal: controller.signal,
            method: 'POST',
            keepalive: true,
            headers: headers,
            body: JSON.stringify({
              app: {
                params: {},
                appId:params.user_selected_app[0],
                flowId: params.user_selected_flow,
              },
              question: params.question,
              conversationId: params.conversationId,
              debug: true,
            }),
          });

        }
      }
      else if (params.user_selected_app) {
        resp = await fetch(STREAM_URL, {
          signal: controller.signal,
          method: 'POST',
          keepalive: true,
          headers: headers,
          body: JSON.stringify({
            question: params.question,
            conversationId: params.conversationId,
            record_id: params.qaRecordId,
            language,
            groupId: params.groupId,
            // record_id: params.qaRecordId,
            app:{
              appId:params.user_selected_app[0],
              flowId: "",
              params: pp,
              auth:{},
            },
            features:features,
          }),
        });
      } else if(false){
        //写传参数情况
      }else {
        resp = await fetch(STREAM_URL, {
          signal: controller.signal,
          keepalive: true,
          method: 'POST',
          headers: headers,
          body: JSON.stringify({
            question: params.question,
            conversationId: params.conversationId,
            record_id: params.qaRecordId,
            language,
            groupId: params.groupId,
            // record_id: params.qaRecordId,
            app:{
              appId:"",
              flowId: "",
              params: {},
              auth:{},
            },
            features:features,
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
      let workFlowId = ''; // 这里存储工作流调试对话的判断id
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

          // 如果是工作流的调试功能-调试对话结束时-发送调试对话结束
          if (params.type && workFlowId) {
            $bus.emit('debugChatEnd');
          }
          break;
        }
        // 这里删除了\n\n
        const lines = decodedValue.split('\n\n').filter((line) => line.startsWith('data: {'));
        lines.forEach((line) => {
          // 这里json解析
          const message = Object(JSON.parse(line.replace(/^data:\s*/, '').trim()));
          if( 'metadata' in message){
            if(conversationItem.metadata?.time<message.metadata.time){
              conversationItem.metadata = message.metadata;
            }
          }
          if('event' in message){
            if(message["event"] === "text.add"){
              // conversationItem.message[conversationItem.currentInd] += message.content;
              scrollBottom();
              conversationItem.message[conversationItem.currentInd] += message.content.text;
            }
            else if(message["event"] === "heartbeat") {
              // conversationItem.files = [...conversationItem.files, message.content];
              // 不处理
          }
            else if(message["event"] == "ducument.add") {
              conversationItem.message[conversationItem.currentInd] += message.content;
              conversationItem.files = [...conversationItem.files, message.content];
          }
            else if(message["event"] === "suggest") {
                conversationItem.search_suggestions?conversationItem.search_suggestions.push(Object(message.content)):conversationItem.search_suggestions = [Object(message.content)]
              }
            else if(message["event"] === "init") {
              //初始化获取 metadata
              conversationItem.metadata = message.metadata;
              conversationItem.createdAt = message.content.created_at;
              conversationItem.groupId = message.groupId;
            }
            else if(message["event"] === "flow.start") {
              //事件流开始--后续验证对话无下拉连接后则完全替换
              let flow = message.flow;
              // 这里给工作流调试的对话id赋值，用于判断
              workFlowId = flow?.flowId;
              conversationItem.flowdata = {
                id: flow?.stepId || "",
                title: i18n.global.t('flow.flow_start'),
                // 工作流这里stepName代替step_progresss，为不影响首页对话暂且用||
                progress: flow?.stepProgress || "",
                status:'running',
                display:true,
                flowId:flow?.flowId||"",
                data:[[]],
              }
            }
            else if(message["event"] === "step.input") {
                conversationItem.flowdata?.data[0].push({
                  id:message.flow?.stepId,
                  title:message.flow?.stepName,
                  status:message.flow?.stepStatus,
                  data:{
                    input:message.content,
                  }
                })
                if(conversationItem.flowdata){
                  conversationItem.flowdata.progress = message.flow?.stepProgress;
                  conversationItem.flowdata.status = message.flow?.stepStatus;    
                }
            }
            else if(message["event"] === "step.output") {
              const target = conversationItem.flowdata?.data[0].find(item => item.id === message.flow?.stepId);
              if (target) {
                target.data.output = message.content
                target.status = message.flow?.stepStatus;
                // 工作流添加每阶段的时间耗时
                target['costTime'] = message.metadata?.timeCost;
                if(message.flow.step_status === "error"){
                  conversationItem.flowdata.status = message.flow?.stepStatus;
                }
              }
            }
            else if(message["event"] === "flow.stop") {
              //时间流结束
              let flow = message.content.flow;
              if (params.type) {
                // 如果是工作流的调试功能-添加status/data
                conversationItem.flowdata = {
                  id: flow?.stepId,
                  title: i18n.global.t('flow.flow_end'),
                  progress: flow?.stepProgress,
                  status: message.flow?.stepStatus,
                  display:true,
                  data:conversationItem?.flowdata?.data,
                };
              }else if(message.content.type !== "schema"){
                conversationItem.flowdata?.data[0].push({
                  id:"end",
                  title:"end",
                  status:message.flow?.stepStatus,
                  data:{
                    input:message.content,
                  }
                })
                conversationItem.flowdata = {
                  id: flow?.stepId,
                  title: i18n.global.t('flow.flow_end'),
                  progress: flow?.stepProgress,
                  status:"success",
                  display:true,
                  data:conversationItem.flowdata.data,
                };
                if(message.content.type === 'chart'){
                  conversationItem.echartsObj = message.content.data;
                }
              }else{
                conversationItem.paramsList = message.content.data;
                conversationItem.flowdata.title = i18n.global.t('flow.flow_params_error');
                conversationItem.flowdata.status = "error";
                conversationItem.paramsList = message.content.data;
              }
              
            } 
          }
        });
        // 将lines传递给workflow-以更新工作流节点的状态
        if(params.user_selected_flow && params.user_selected_app) {
          $bus.emit('getNodesStatue', lines);
        }
      }
    } catch (err: any) {
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
      conversationId?: string;
      qaRecordId?: string;
    },
    ind?: number
  ): Promise<boolean> => {
    if (status === 401 || status === 403) {
      // 鉴权失败重发
      await toAuth()
      return false;
    } else if (status === 429) {
      throw new Error(`HTTP error, Rate limit exceeded`);
    } else {
      return true;
    }
  };

  async function toAuth() {
    const store = useAccountStore()
    if (qiankunWindow.__POWERED_BY_QIANKUN__) {
      const url = await store.getAuthUrl('login')
      if (url) {
        const redirectUrl = qiankunWindow.__POWERED_BY_QIANKUN__ ? `${url}&redirect_index=${location.href}` : url
        if (redirectUrl)
          window.location.href = redirectUrl
      }
    } else {
      ElMessageBox.confirm(i18n.global.t('Login.unauthorized'), i18n.global.t('history.confirmation_message1'), {
        confirmButtonText: i18n.global.t('Login.login'),
        showClose: false,
        showCancelButton: false,
        autofocus: false,
        closeOnClickModal: false,
        closeOnPressEscape: false,
      }).then(async () => {
        const url = await store.getAuthUrl('login')
        if (url) {
          const redirectUrl = qiankunWindow.__POWERED_BY_QIANKUN__ ? `${url}&redirect_index=${location.href}` : url
          if (redirectUrl)
            window.location.href = redirectUrl
        }
      }
      );
    }
  }
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
      const answerIndex = ind ?? conversationList.value.length - 1;
      const conversationItem = conversationList.value[answerIndex] as RobotConversationItem;
      conversationItem.flowdata.status = 'error';
    }
    if (errorMsg&&!(conversationList.value[ind] as RobotConversationItem).message[
      (conversationList.value[ind] as RobotConversationItem).currentInd
    ]) {
      (conversationList.value[ind] as RobotConversationItem).message[
        (conversationList.value[ind] as RobotConversationItem).currentInd
      ] = errorMsg;
      (conversationList.value[ind] as RobotConversationItem).isFinish = true;
      isAnswerGenerating.value = false;
      scrollBottom();
      return false;
    }
    scrollBottom();
    return true;
  };
  /**
   * 发送问题
   * @param question 问题
   * @param regenerateInd 重新生成的回答索引
   */
  const sendQuestion = async (
    groupId:string|undefined,
    question: string,
    user_selected_app?: string[],
    regenerateInd?: number,
    qaRecordId?: string,
    user_selected_flow?: string,
    params?: any,
    type?: any,
  ): Promise<void> => {
    const { updateSessionTitle, currentSelectedSession } = useHistorySessionStore();
    if (conversationList.value.length === 0) {
      // 如果当前还没有对话记录，将第一个问题的questtion作为对话标题
      const res = await updateSessionTitle({ conversationId: currentSelectedSession, title: question.slice(0, 20) });
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
          params: params,
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
          conversationId: '',
          // createdAt: Date.now(),
        }
      );
    }
    isAnswerGenerating.value = true;
    scrollBottom();
    if (user_selected_flow&&user_selected_app) {
      await getStream(
        {
          question,
          qaRecordId,
          user_selected_app:[...user_selected_app],
          user_selected_flow,
          groupId:groupId,
          params:params||undefined,
          type: type
        },
        regenerateInd ?? undefined
      )
    } else if (user_selected_app?.length) {
      await getStream(
        {
          question,
          qaRecordId,
          user_selected_app: [...user_selected_app],
          groupId:groupId,
          params:params||undefined,
        },
        regenerateInd ?? undefined
      )
    } else {
      await getStream(
        {
          question,
          qaRecordId,
          groupId:groupId,
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
    conversationList.value[answerIndex].message[0] += '暂停生成';
    (conversationList.value[answerIndex] as RobotConversationItem).isFinish = true;
    cancel();
    await api.stopGeneration();
  };
  /**
   * 重新生成回答
   * @param cid
   */
  const reGenerateAnswer = (cid: number, user_selected_app: any[],type?:string): void => {
    const answerInd = conversationList.value.findIndex((val) => val.cid === cid);
    const question = (conversationList.value[answerInd - 1] as UserConversationItem).message;
    const recordId = (conversationList.value[answerInd] as RobotConversationItem).recordId;
    let groupId = undefined;
    if(type&&type === "params"){
      groupId = undefined;
    }else{
      groupId = (conversationList.value[answerInd] as RobotConversationItem).groupId?(conversationList.value[answerInd] as RobotConversationItem).groupId:"";
    }
    (conversationList.value[answerInd] as RobotConversationItem).isFinish = false;
    if (!question) {
      return;
    }
    sendQuestion(groupId, question, user_selected_app, answerInd, recordId,"");
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
   * @param conversationId
   */
  const getConversation = async (conversationId: string): Promise<void> => {
    const [_, res] = await api.getHistoryConversation(conversationId);
    //解析读取 records字段得到对话数组列表
    // const [_, res] = await api.getHistoryConversation(conversationId).records;

    if (!_ && res) {
      conversationList.value = [];
      res.result.records.forEach((record) => {
        if (
          (conversationList.value as RobotConversationItem[]).find(
            (i) => i.groupId === record.groupId
          )
        ) {
          const re = (conversationList.value as RobotConversationItem[]).find(
            (i) => i.groupId === record.groupId
          );
          re?.message.push(record.content.answer);
          if (typeof (re?.message) !== 'string') {
            re?.messageList.addItem(record.content.answer, record.id, typeof (record.is_like) === 'object' ? 2 : Number(record.is_like));
            if(re?.currentInd!==undefined){
              re.currentInd = re.currentInd + 1;
            }
          }
          return;
        }
        const a = new MessageArray();
        a.addItem(record.content.answer, record.id, typeof (record.is_like) === 'object' ? 2 : Number(record.is_like));
        conversationList.value.unshift(
          {
            cid: conversationList.value.length + 1,
            belong: 'user',
            message: record.content.question,
            createdAt: record.created_at,
          },
          {
            cid: conversationList.value.length + 2,
            belong: 'robot',
            message: [record.content.answer],
            messageList: a,
            currentInd: 0,
            isAgainst: false,
            isSupport: false,
            isFinish: true,
            recordId: record.id,
            conversationId: record.conversationId,
            groupId: record.groupId,
            metadata: record.metadata,
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

  /**
   * 暂停流式返回
   */
  const stopDebug = async (): Promise<void> => {
    await api.stopGeneration();
  };

  const cancel = () => {
    controller.abort();
  };
  return {
    isPaused,
    conversationList,
    isAnswerGenerating,
    dialogueRef,
    app,
    appList,
    sendQuestion,
    pausedStream,
    stopDebug,
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
  if (localStorage.getItem('theme')) {
    theme.value = localStorage.getItem('theme') || 'dark';
  }
  return {
    theme,
  }
});


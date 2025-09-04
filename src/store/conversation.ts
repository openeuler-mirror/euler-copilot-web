// Copyright (c) Huawei Technologies Co., Ltd. 2023-2025. All rights reserved.
// licensed under the Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { fetchEventSource } from '@microsoft/fetch-event-source';

import { useHistorySessionStore, useLangStore } from 'src/store';
import {
  AppShowType,
  FlowDataType,
  MessageArray,
  type ConversationItem,
  type RobotConversationItem,
  type UserConversationItem,
  FlowType,
} from 'src/views/dialogue/types';
import { api } from 'src/apis';
import { successMsg } from 'src/components/Message';
import i18n from 'src/i18n';
import { Application } from 'src/apis/paths/type';
import { handleAuthorize } from 'src/apis/tools';
import $bus from 'src/bus/index';
import { useScrollBottom } from '@/hooks/useScrollBottom';
import { getCookie } from '@/apis/tools';
import { getBaseProxyUrl } from 'src/utils/tools';

export const echartsObj = ref({});

let controller = new AbortController();
const excelPath = ref('');
const features = {
  max_tokens: 2048,
  context_num: 2,
};

export const useSessionStore = defineStore('conversation', () => {
  // #region ----------------------------------------< scroll >--------------------------------------
  // 会话窗口容器
  const dialogueRef = ref<HTMLDivElement | null>(null);

  const { scrollToBottom } = useScrollBottom(dialogueRef, {
    threshold: 15,
  });

  // #endregion

  const langStore = useLangStore();
  // 是否暂停回答
  const isPaused = ref(false);
  // 会话列表
  const conversationList = ref<ConversationItem[]>([]);
  const currentMessage = ref({});
  const app = ref<AppShowType>({
    appId: '',
    name: '',
    selectedAppId: '',
  });
  const appList = ref<Application[]>();
  // ai回复是否还在生成中
  const isAnswerGenerating = ref(false);

  const currentTaskId = ref(null);

  // 方法集合 - 用于处理不同类型的event message
  const dataTransfers = {
    textAdd: (
      conversationItem: RobotConversationItem,
      message: Record<string, unknown>,
    ) => {
      scrollToBottom();
      const content = (message.content || {}) as Record<string, string>;
      const contentText: string = content.text || '';
      //向message添加值
      conversationItem.message[conversationItem.currentInd] += contentText;
      //向messageList添加值
      const items = conversationItem.messageList.getAllItems();
      items[conversationItem.currentInd].message += contentText;
    },
    documentAdd: (
      conversationItem: RobotConversationItem,
      message: Record<string, unknown>,
    ) => {
      if (!conversationItem.files) {
        conversationItem.files = [];
      }
      conversationItem.files = [...conversationItem.files, message.content];
    },
    suggestionFunc: (
      conversationItem: RobotConversationItem,
      message: Record<string, unknown>,
    ) => {
      if (conversationItem.search_suggestions) {
        conversationItem.search_suggestions.push(Object(message.content));
      } else {
        conversationItem.search_suggestions = [Object(message.content)];
      }
    },
    flowStart: (
      conversationItem: RobotConversationItem,
      message: Record<string, unknown>,
    ) => {
      const flow = (message.flow || {}) as Record<string, string>;
      conversationItem.flowdata = {
        id: `${flow.stepId || ''}`,
        title: i18n.global.t('flow.flow_start'),
        // 工作流这里stepName代替step_progress，为不影响首页对话暂且用||
        progress: flow.stepProgress || '',
        status: 'running',
        display: true,
        flowId: `${flow.stepId || ''}`,
        data: [[]],
      };
    },
    stepInput: (
      conversationItem: RobotConversationItem,
      message: Record<string, unknown>,
    ) => {
      const flow = (message.flow || {}) as Record<string, string>;
      conversationItem.flowdata?.data[0].push({
        id: flow.stepId,
        title: flow.stepName,
        status: flow.stepStatus,
        data: {
          input: message.content,
        },
      });
      if (conversationItem.flowdata) {
        conversationItem.flowdata.progress = flow.stepProgress;
        conversationItem.flowdata.status = flow.stepStatus;
      }
    },
    stepOutput: (
      conversationItem: RobotConversationItem,
      message: Record<string, unknown>,
    ) => {
      const flow = (message.flow || {}) as Record<string, string>;
      const metadata = (message.metadata || {}) as Record<string, unknown>;
      const target = conversationItem.flowdata?.data[0].find(
        (item) => item.id === flow.stepId,
      );
      if (target) {
        target.data.output = message.content;
        target.status = flow.stepStatus;
        // 工作流添加每阶段的时间耗时
        target['costTime'] = metadata.timeCost;
        if (flow.step_status === 'error' && conversationItem.flowdata) {
          conversationItem.flowdata.status = flow.stepStatus;
        }
      }
    },
    flowStop: (
      conversationItem: RobotConversationItem,
      message: Record<string, unknown>,
      isFlowDebug: boolean,
    ) => {
      const content = (message.content || {}) as Record<string, unknown>;
      const contentFlow = (content.flow || {}) as Record<string, string>;
      const messageFlow = (message.flow || {}) as Record<string, string>;
      if (isFlowDebug) {
        // 如果是工作流的调试功能-添加status/data
        conversationItem.flowdata = {
          id: contentFlow.stepId,
          title: i18n.global.t('flow.flow_end'),
          progress: contentFlow.stepProgress,
          status: messageFlow.stepStatus,
          display: true,
          data: conversationItem?.flowdata?.data,
        };
      } else if (content.type !== 'schema' && conversationItem.flowdata) {
        // 删除 end 逻辑
        conversationItem.flowdata = {
          id: messageFlow.stepId,
          title: currentTaskId ? i18n.global.t('flow.flow_start') : i18n.global.t('flow.flow_end'),
          progress: messageFlow.stepProgress,
          status: currentTaskId ? messageFlow.flowStatus : 'success',
          display: true,
          taskId: currentTaskId.value,
          data: conversationItem.flowdata.data,
        };
      } else {
        conversationItem.paramsList = content.data;
        if (conversationItem.flowdata) {
          conversationItem.flowdata.title = i18n.global.t(
            'flow.flow_params_error',
          );
          conversationItem.flowdata.status = 'error';
          conversationItem.paramsList = content.data;
        }
      }
    },
    dataDone: (
      conversationItem: RobotConversationItem,
      isFlowDebug: boolean,
    ) => {
      if (excelPath.value.length > 0) {
        conversationItem.message[conversationItem.currentInd] +=
          `</p><p>下载地址：${excelPath.value}`;
      }
      conversationItem.isFinish = true;
      isAnswerGenerating.value = false;
      // 如果是工作流的调试功能-调试对话结束时-发送调试对话结束
      if (isFlowDebug) {
        $bus.emit('debugChatEnd');
      }
    },
    waitingForStart: (
      conversationItem: RobotConversationItem,
      message: Record<string, unknown>,
    ) => {
      const flow = (message.flow || {}) as Record<string, string>;
      const content = (message.content || {}) as Record<string, string>;
      conversationItem.flowdata = {
        id: flow.stepId,
        title: flow.stepName,
        status: flow.stepStatus,
        taskId: currentTaskId,
        data: {
          exData: content,
        },
      };
      if (conversationItem.flowdata) {
        conversationItem.flowdata.progress = flow.stepProgress;
        conversationItem.flowdata.status = flow.stepStatus;
      }
    },
    flowCancel: (
      conversationItem: RobotConversationItem,
      message: Record<string, unknown>,
    ) => {
      const content = (message.content || {}) as Record<string, unknown>;
      const contentFlow = (content.flow || {}) as Record<string, string>;
      const messageFlow = (message.flow || {}) as Record<string, string>;

      // 取消运行
      conversationItem.flowdata = {
        id: contentFlow.stepId,
        title: i18n.global.t('flow.flow_cancel'),
        progress: contentFlow.stepProgress,
        status: messageFlow.stepStatus,
        display: true,
        data: conversationItem?.flowdata?.data,
      };
    },
  };

  // chat message回调
  const handleMsgDataShow = (
    params: Record<string, unknown>,
    msgData: Record<string, unknown>,
    conversationItem: RobotConversationItem,
  ) => {
    if (isPaused.value) {
      // 手动暂停输出
      isAnswerGenerating.value = false;
      return;
    }
    const rawMsgData = msgData.data as string;
    if (rawMsgData === '[DONE]') {
      dataTransfers.dataDone(conversationItem, !!params.type);
      return;
    }
    if (rawMsgData === '[ERROR]') {
      dataTransfers.dataDone(conversationItem, !!params.type);
      return;
    }

    // 同一时间戳传来的decodeValue是含有三条信息的合并，so需要分割
    // 这里json解析
    const message = JSON.parse(rawMsgData || '{}');
    const eventType = message['event'];
    if ('metadata' in message) {
      conversationItem.metadata = message.metadata;
    }
    currentTaskId.value = message.taskId;
    if ('event' in message) {
      switch (eventType) {
        case 'text.add':
          currentMessage.value = message;
          dataTransfers.textAdd(conversationItem, message);
          break;
        case 'heartbeat':
          break;
        case 'graph':
          conversationItem.echartsObj = message.content.option;
          break;
        case 'document.add':
          // 遇到文档添加事件，先省略
          dataTransfers.documentAdd(conversationItem, message);
          break;
        case 'Suggestion':
          dataTransfers.suggestionFunc(conversationItem, message);
          break;
        case 'init':
          //初始化获取 metadata
          conversationItem.metadata = message.metadata;
          conversationItem.createdAt = message.content.createdAt;
          conversationItem.groupId = message.groupId;
          break;
        case 'flow.start':
          //事件流开始--后续验证对话无下拉连接后则完全替换
          dataTransfers.flowStart(conversationItem, message);
          break;
        case 'step.input':
          dataTransfers.stepInput(conversationItem, message);
          break;
        case 'step.output':
          dataTransfers.stepOutput(conversationItem, message);
          break;
        case 'step.waiting_for_start':
          // 事件流等待开始
          dataTransfers.waitingForStart(conversationItem, message);
          break;
        case 'flow.cancel':
          // 事件流取消
          dataTransfers.flowCancel(conversationItem, message);
          break;
        case 'flow.stop':
          //时间流结束
          dataTransfers.flowStop(conversationItem, message, !!params.type);
          break;
        default:
          break;
      }
    }
    // 将lines传递给workflow-以更新工作流节点的状态
    if (params.user_selected_flow && params.user_selected_app) {
      $bus.emit('getNodesStatue', { data: message });
    }
  };

  // 方法集合 - 用于区分fetch时的请求
  const funcFetch = {
    fetchHistory: async (
      url: string,
      params: Record<string, unknown>,
      innerParams: Record<string, unknown>,
      fetchParams: Record<string, unknown>,
    ) => {
      if (!params.type) {
        await fetchEventSource(url, {
          ...fetchParams,
          body: JSON.stringify({
            app: {
              appId: params.user_selected_app,
              auth: {},
              flowId: params.user_selected_flow,
              params: innerParams || {},
            },
            conversationId: params.conversationId,
            features: features,
            groupId: params.groupId,
            language: langStore.language,
            question: params.question,
            // record_id: params.qaRecordId,
          }),
          openWhenHidden: true,
        });
        return;
      }
      // 新的工作流调试记录
      await fetchEventSource(url, {
        ...fetchParams,
        body: JSON.stringify({
          app: {
            appId: params.user_selected_app,
            flowId: params.user_selected_flow,
            params: {},
          },
          conversationId: params.conversationId,
          debug: true,
          language: langStore.language,
          question: params.question,
        }),
        openWhenHidden: true,
      });
    },
    fetchAppNew: async (
      url: string,
      params: Record<string, unknown>,
      innerParams: Record<string, unknown>,
      fetchParams: Record<string, unknown>,
    ) => {
      await fetchEventSource(url, {
        ...fetchParams,
        body: JSON.stringify({
          app: {
            appId: params.user_selected_app,
            auth: {},
            flowId: '',
            params: innerParams || {},
          },
          conversationId: params.conversationId,
          features: features,
          language: langStore.language,
          groupId: params.groupId,
          question: params.question,
          record_id: params.qaRecordId,
        }),
        openWhenHidden: true,
      });
    },
    fetchDefault: async (
      url: string,
      params: Record<string, unknown>,
      innerParams: Record<string, unknown>,
      fetchParams: Record<string, unknown>,
    ) => {
      await fetchEventSource(url, {
        ...fetchParams,
        body: JSON.stringify({
          app: {
            appId: '',
            flowId: '',
            params: {},
            auth: {},
          },
          conversationId: params.conversationId,
          features: features,
          groupId: params.groupId,
          language: langStore.language,
          question: params.question,
          record_id: params.qaRecordId,
        }),
        openWhenHidden: true,
      });
    },
    fetchWait: async (
      url: string,
      params: Record<string, unknown>,
      innerParams: Record<string, unknown>,
      fetchParams: Record<string, unknown>,
    ) => {
      await fetchEventSource(url, {
        ...fetchParams,
        body: JSON.stringify({ taskId: currentTaskId.value, params: params.params }),
        openWhenHidden: true,
      });
    },
  };

  const judgeResp = async (resp) => {
    const isServiceOk = await handleServiceStatus(resp.status);
    if (!isServiceOk) {
      return false;
    }
    if (!resp.ok) {
      throw new Error(`HTTP error! status: ${resp.status}`);
    }
    if (!resp.body) {
      throw new Error(`HTTP error, body not exits`);
    }
    return true;
  };

  /**
   * 请求流式数据
   **/
  const getStream = async (
    params: {
      question: string;
      user_selected_app?: any;
      conversationId?: string;
      qaRecordId?: string;
      user_selected_flow?: string;
      groupId?: string;
      params?: any;
      type?: any;
    },
    ind?: number,
    waitType?: string,
  ): Promise<void> => {
    const { currentSelectedSession } = useHistorySessionStore();
    params.conversationId = currentSelectedSession;
    // 当前问答在整个问答记录中的索引 openEuler有什么ai特性
    const answerIndex = ind ?? conversationList.value.length - 1;
    const conversationItem = conversationList.value[
      answerIndex
    ] as RobotConversationItem;
    controller = new AbortController();

    try {
      let pp;
      if (params.params && typeof params.params === 'object') {
        pp = params.params;
      } else if (params.params && typeof params.params === 'string') {
        pp = Object(JSON.parse(params.params));
      }
      isPaused.value = false;
      excelPath.value = '';
      echartsObj.value = {};
      // txt2imgPath.value = '';

      let resp = {} as Response;
      const baseProxyUrl = await getBaseProxyUrl();
      const streamUrl = baseProxyUrl + '/api/chat';
      const localEc = window.localStorage?.getItem('ECSESSION');
      const fetchParams = {
        signal: controller.signal,
        keepalive: true,
        method: 'POST',
        headers: {
          user: JSON.stringify({ userName: 'openEuler' }),
          'Content-Type': 'application/json; charset=UTF-8',
          'X-CSRF-Token': getCookie('_csrf_tk') || '',
          // 从 localStorage 获取 ECSESSION 并设置 Authorization
          ...(localEc ? { Authorization: `Bearer ${localEc}` } : {}),
        },
        body: {},
        onopen: async (response) => {
          resp = response;
        },
        onmessage: async (ev) => {
          handleMsgDataShow(params, ev, conversationItem);
        },
      };
      if (params.user_selected_flow) {
        // 之前的对话历史记录
        await funcFetch.fetchHistory(streamUrl, params, pp, fetchParams);
      } else if (params.user_selected_app) {
        // 新的工作流调试记录
        await funcFetch.fetchAppNew(streamUrl, params, pp, fetchParams);
      } else if (waitType) {
        await funcFetch.fetchWait(streamUrl, params, pp, fetchParams);
      } else {
        await funcFetch.fetchDefault(streamUrl, params, pp, fetchParams);
      }

      await judgeResp(resp);
    } catch (err: any) {
      isPaused.value = true;
      isAnswerGenerating.value = false;
      const targetItem = conversationList.value[
        answerIndex
      ] as RobotConversationItem;
      targetItem.isFinish = true;
      if (err.name === 'AbortError') {
        successMsg(i18n.global.t('feedback.stopSuccessful'));
        // targetItem.isFinish = true;
      } else {
        targetItem.message[targetItem.currentInd] += i18n.global.t(
          'feedback.systemBusy',
        );
      }
    }
  };

  /**
   * 处理服务状态
   * @param status
   */
  const handleServiceStatus = async (status: number): Promise<boolean> => {
    if (status === 401 || status === 403) {
      // 鉴权失败重发
      await handleAuthorize(status);
      return false;
    } else if (status === 429) {
      throw new Error(`HTTP error, Rate limit exceeded`);
    } else {
      return true;
    }
  };

  /**
   * 发送问题
   * @param groupId
   * @param question 问题
   * @param user_selected_app
   * @param regenerateInd 重新生成的回答索引
   * @param qaRecordId
   * @param user_selected_flow
   * @param params
   * @param type
   * @param waitType
   */
  const sendQuestion = async (
    groupId: string | undefined,
    question: string,
    user_selected_app?: string,
    regenerateInd?: number,
    qaRecordId?: string,
    user_selected_flow?: string,
    params?: any,
    type?: any,
    waitType?: string,
  ): Promise<void> => {
    const { updateSessionTitle, currentSelectedSession } =
      useHistorySessionStore();
    if (conversationList.value.length === 0) {
      // 如果当前还没有对话记录，将第一个问题的question作为对话标题
      await updateSessionTitle({
        conversationId: currentSelectedSession,
        title: question.slice(0, 20),
      });
    }
    if (regenerateInd) {
      const targetItem = conversationList.value[
        regenerateInd
      ] as RobotConversationItem;
      // 重新生成，指定某个回答，修改默认索引
      targetItem.message.push(''); //123
      // 重新生成，指定某个回答，修改默认索引
      targetItem.messageList.push({
        message: '',
        record_id: qaRecordId || '',
        comment: 'none',
      });
      targetItem.currentInd = targetItem.message.length - 1; //123
    } else if (!waitType) {
      // 初次生成 ，创建一个问题和一个回答
      const ind = conversationList.value.length - 1;
      const messageList = new MessageArray();
      messageList.addItem('', '', 'none');
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
          messageList,
          currentInd: 0,
          isFinish: false,
          recordId: '',
          groupId: '',
          conversationId: '',
          // createdAt: Date.now(),
        },
      );
    }
    isAnswerGenerating.value = true;
    scrollToBottom(true);

    let getStreamParams: Parameters<typeof getStream>[0] = {
      question,
      qaRecordId,
      groupId,
    };
    if (user_selected_flow && user_selected_app) {
      getStreamParams = {
        ...getStreamParams,
        user_selected_app: user_selected_app,
        user_selected_flow,
        params: params || undefined,
        type: type,
      };
    } else if (user_selected_app?.length) {
      getStreamParams = {
        ...getStreamParams,
        user_selected_app: user_selected_app,
        params: params || undefined,
      };
    }
    if (waitType) {
      getStreamParams = params;
    }
    await getStream(getStreamParams, regenerateInd ?? undefined, waitType);
  };

  /**
   * 暂停流式返回
   */
  const pausedStream = async (cid?: number): Promise<void> => {
    let answerIdx = conversationList.value.findIndex((val) => val.cid === cid);
    if (answerIdx === -1) {
      answerIdx = conversationList.value.length - 1;
    }

    isPaused.value = true;
    const targetItem = conversationList.value[
      answerIdx
    ] as RobotConversationItem;
    targetItem.message[0] += '暂停生成';
    targetItem.isFinish = true;
    cancel();
    const resp = await api.stopGeneration(currentMessage.value.taskId);
    if (resp?.[1]?.code === 200) {
      isAnswerGenerating.value = false;
    }
  };

  /**
   * 重新生成回答
   */
  const reGenerateAnswer = (
    cid: number,
    user_selected_app: string,
    type?: string,
  ): void => {
    const answerInd = conversationList.value.findIndex(
      (val) => val.cid === cid,
    );
    const answerItem = conversationList.value[
      answerInd
    ] as RobotConversationItem;
    const question = (
      conversationList.value[answerInd - 1] as UserConversationItem
    ).message;
    const recordId = answerItem.recordId;
    let groupId: string | undefined;
    if (type && type === 'params') {
      groupId = undefined;
    } else {
      groupId = answerItem.groupId || '';
    }
    answerItem.isFinish = false;
    if (!question) {
      return;
    }
    sendQuestion(groupId, question, user_selected_app, answerInd, recordId, '');
  };

  // #region ----------------------------------------< pagination >--------------------------------------
  /**
   * 上一条
   * @param cid
   */
  const prePage = (cid: number): void => {
    const answerItem = conversationList.value.find(
      (val) => val.cid === cid,
    ) as RobotConversationItem;
    if (!answerItem || answerItem.currentInd === 0) {
      return;
    }
    answerItem.currentInd -= 1;
  };

  /**
   * 下一条
   * @param cid
   */
  const nextPage = (cid: number): void => {
    const answerItem = conversationList.value.find(
      (val) => val.cid === cid,
    ) as RobotConversationItem;
    if (!answerItem) {
      return;
    }
    if (answerItem.message.length - 1 === answerItem.currentInd) {
      return;
    }
    answerItem.currentInd += 1;
  };
  // #endregion

  /**
   * 处理历史对话数据中尾注位置
   */
  const handleMessage = (record: any): string => {
    let message = record.content.answer;
    record.metadata.footNoteMetadataList?.reverse().forEach((footNoteMetadata: any) => {
      const insertFile = record.document?.filter((file: any) => file._id === footNoteMetadata.releatedId);
      const insertNumber = insertFile[0]?.order;
      if (!insertNumber) return;
      const pos = footNoteMetadata.insertPosition;
      message = message.slice(0, pos) + `[[${insertNumber}]]` + message.slice(pos)
    });
    return message;
  }

  /**
   * 获取历史对话数据
   * @param conversationId
   */
  const getConversation = async (conversationId: string): Promise<void> => {
    const [err, res] = await api.getHistoryConversation(conversationId);
    if (!err && res) {
      conversationList.value = [];
      const cList = conversationList.value as RobotConversationItem[];
      res.result.records.forEach((record) => {
        const targetRecord = cList.find((i) => i.groupId === record.groupId);
        if (targetRecord) {
          // 这里用groupId找到的targetRecord中的message必为array（为string的情况不存在groupId）
          targetRecord.message.push(record.content.answer);
          targetRecord.messageList.addItem(
            record.content.answer,
            record.id,
            // is_like字段改为 comment = "liked", "disliked", "none"
            record.comment,
          );
          if (targetRecord.currentInd !== undefined) {
            targetRecord.currentInd++;
          }
          return;
        }
        const messageList = new MessageArray();
        messageList.addItem(
          record.content.answer,
          record.id,
          // is_like字段改为 comment = "liked", "disliked", "none"
          record.comment,
        );
        conversationList.value.unshift(
          {
            cid: conversationList.value.length + 1,
            belong: 'user',
            message: record.content.question,
            createdAt: record.createdAt,
          },
          {
            cid: conversationList.value.length + 2,
            belong: 'robot',
            message: [handleMessage(record)],
            messageList,
            currentInd: 0,
            isAgainst: false,
            isSupport: false,
            isFinish: true,
            recordId: record.id,
            conversationId: record.conversationId,
            groupId: record.groupId,
            metadata: record.metadata,
            document: record.document,
            flowdata: record?.flow
              ? (generateFlowData(record.flow) as FlowType)
              : undefined,
          },
        );
        scrollToBottom();
      });
    }
  };

  //将获取到的 flow 数据结构转换
  const generateFlowData = (record: any): FlowDataType => {
    const flowData = {
      id: record.recordId,
      title: record.id,
      status: 'success',
      display: true,
      flowId: record.flowId,
      data: [[]] as any[],
    };
    // 看有没有取消的
    let isCancelled = false;
    for (let i = 0; i < record.steps.length; i++) {
      flowData.data[0].push({
        id: record.steps[i].stepId,
        title: record.steps[i].stepId,
        status: record.steps[i].stepStatus,
        data: {
          input: record.steps[i].input,
          output: record.steps[i].output,
          exData: record.steps[i].exData,
        },
      });
      if (record.steps[i].stepStatus === 'cancelled') {
        isCancelled = true;
      }
    }
    if (isCancelled) {
      flowData.status = 'cancelled';
    }
    return flowData;
  };

  /**
   * 暂停流式返回
   */
  const stopDebug = async (): Promise<void> => {
    isPaused.value = true;
    (
      conversationList.value[
      conversationList.value.length - 1
      ] as RobotConversationItem
    ).isFinish = true;
    cancel();
    const resp = await api.stopGeneration(currentMessage.value.taskId);
    if (resp?.[1]?.code === 200) {
      isAnswerGenerating.value = false;
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
    app,
    appList,
    currentMessage,
    sendQuestion,
    pausedStream,
    stopDebug,
    prePage,
    nextPage,
    reGenerateAnswer,
    getConversation,
    cancel,
  };
});

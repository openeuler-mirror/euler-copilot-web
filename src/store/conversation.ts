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
import { successMsg, errorMsg } from 'src/components/Message';
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

  const { language } = useLangStore();

  // 是否暂停回答
  const isPaused = ref(false);
  // 会话列表
  const conversationList = ref<ConversationItem[]>([]);
  const app = ref<AppShowType>({
    appId: '',
    name: '',
    selectedAppId: '',
  });
  const appList = ref<Application[]>();
  // ai回复是否还在生成中
  const isAnswerGenerating = ref(false);

  // 🔑 移除全局收集器，改为在每个conversationItem中存储文件

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
      conversationItem.message[conversationItem.currentInd] += message.content;
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
        
        // 统一的文件收集逻辑，存储到当前conversationItem.files中
        const addFileToConversationItem = (fileData: any) => {
          // 确保conversationItem.files是数组
          if (!conversationItem.files) {
            conversationItem.files = [];
          }
          
          // 严格的去重检查：基于file_id和filename
          const existingFile = conversationItem.files.find((item: any) => 
            item.file_id === fileData.file_id && item.filename === fileData.filename
          );
          
          if (!existingFile) {
            const fileItem = {
              file_id: fileData.file_id,
              filename: fileData.filename,
              file_type: fileData.file_type,
              file_size: fileData.file_size,
              variable_name: fileData.variable_name,
              content: fileData.content,
              step_name: target.title // 记录来源步骤
            };
            
            conversationItem.files.push(fileItem);
            return true;
          } else {
            return false;
          }
        };
        
        // 🔑 检查不同的文件格式并收集
        let hasFileData = false;
        
        // 格式1：单个文件对象
        if (typeof message.content === 'object' && message.content && 
            (message.content as any).file_id && (message.content as any).filename && (message.content as any).content) {
          addFileToConversationItem(message.content);
          hasFileData = true;
        }
        // 格式2：多文件格式 {type: 'files', files: [...]}
        else if (typeof message.content === 'object' && message.content && 
                 (message.content as any).type === 'files' && (message.content as any).files && 
                 Array.isArray((message.content as any).files)) {
          (message.content as any).files.forEach((fileData: any) => {
            if (fileData.file_id && fileData.filename && fileData.content) {
              addFileToConversationItem(fileData);
              hasFileData = true;
            }
          });
        }
        // 格式3：旧格式文件 {files: [...]}
        else if (typeof message.content === 'object' && message.content && 
                 (message.content as any).files && Array.isArray((message.content as any).files)) {
          (message.content as any).files.forEach((fileData: any) => {
            if (fileData.file_id && fileData.filename && fileData.content) {
              addFileToConversationItem(fileData);
              hasFileData = true;
            }
          });
        }
        
        // 设置步骤输出显示
        if (hasFileData) {
          // 保持原始文件格式，让FlowCode能够检测和显示
        target.data.output = message.content;
        } else {
          // 普通数据输出
          target.data.output = message.content;
        }
        
        target.status = flow.stepStatus;
        // 工作流添加每阶段的时间耗时
        target['costTime'] = metadata.timeCost;
        
        // 修复：更新整体flowdata状态逻辑
        if (conversationItem.flowdata) {
          if (flow.stepStatus === 'error') {
            // 如果有错误，立即设置为错误状态
            conversationItem.flowdata.status = 'error';
          } else if (flow.stepStatus === 'success') {
            // 如果步骤成功，检查是否所有步骤都完成了
            const allSteps = conversationItem.flowdata.data[0];
            const allCompleted = allSteps.every(step => 
              step.status === 'success' || step.status === 'error'
            );
            
            if (allCompleted) {
              // 所有步骤都完成了，检查是否有错误
              const hasError = allSteps.some(step => step.status === 'error');
              conversationItem.flowdata.status = hasError ? 'error' : 'success';
            }
            // 如果还有步骤未完成，保持running状态
          }
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
      
      // 🔑 关键修复：在 flow.stop 时就停止生成状态
      conversationItem.isFinish = true;
      isAnswerGenerating.value = false;
      
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
        
        $bus.emit('debugChatEnd');
      } else if (content.type !== 'schema' && conversationItem.flowdata) {
        // 删除 end 逻辑
        conversationItem.flowdata = {
          id: contentFlow.stepId,
          title: i18n.global.t('flow.flow_end'),
          progress: contentFlow.stepProgress,
          status: 'success',
          display: true,
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
      loopProgress: (
        conversationItem: RobotConversationItem,
        message: Record<string, unknown>,
      ) => {
        const content = (message.content || {}) as Record<string, unknown>;
        
        // 更新循环进度显示，但不停止生成状态
        if (conversationItem.flowdata) {
          conversationItem.flowdata.progress = `${content.iteration}/${content.total}`;
          conversationItem.flowdata.status = 'running'; // 确保状态保持为运行中
        }
      },
      loopCompleted: (
        conversationItem: RobotConversationItem,
        message: Record<string, unknown>,
        isFlowDebug: boolean,
      ) => {
        const content = (message.content || {}) as Record<string, unknown>;
        
        // 🔑 关键修改：循环完成时立即停止生成状态
        conversationItem.isFinish = true;
        isAnswerGenerating.value = false;
        
        // 更新flowdata状态
        if (conversationItem.flowdata) {
          conversationItem.flowdata.status = 'success';
          conversationItem.flowdata.progress = `${content.iteration_count}/${content.iteration_count}`;
        }
        
        // 如果是工作流调试，发送完成事件
        if (isFlowDebug) {
          $bus.emit('debugChatEnd');
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
      
      // 🔑 只有在还没完成时才设置完成状态
      if (!conversationItem.isFinish) {
        conversationItem.isFinish = true;
        isAnswerGenerating.value = false;
        
        // 如果是工作流的调试功能-调试对话结束时-发送调试对话结束
        if (isFlowDebug) {
          $bus.emit('debugChatEnd');
        }
      }
    },
  };

  // chat message回调
  const handleMsgDataShow = async (
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



    // 🔑 重要修复：处理带详细信息的ERROR消息
    if (rawMsgData.startsWith('[ERROR]')) {
      console.error('❌ 收到ERROR事件，停止对话生成:', rawMsgData);
      conversationItem.isFinish = true;
      isAnswerGenerating.value = false;
      
      // 🔑 重要：按正确顺序停止对话
      // 1. 首先中断前端fetchEventSource连接
      controller.abort();
      
      // 2. 然后调用后端停止接口，清理后端WebSocket连接
      try {
        const resp = await api.stopGeneration();
        if (resp?.[1]?.code === 200) {
          // 后端停止成功
        }
      } catch (stopError) {
        console.error('调用停止接口失败:', stopError);
        // 即使停止接口失败，也继续处理错误显示
      }
      
      // 提取错误信息
      const errorMessage = rawMsgData.replace('[ERROR]', '').trim();
      
      // 🔑 修复：确保错误信息正确显示在对话内容中
      // 初始化message数组和currentInd，如果不存在的话
      if (!conversationItem.message || conversationItem.message.length === 0) {
        conversationItem.message = [''];
        conversationItem.currentInd = 0;
      }
      
      const currentIndex = conversationItem.currentInd || 0;
      
      // 确保currentIndex对应的message元素存在
      if (!conversationItem.message[currentIndex]) {
        conversationItem.message[currentIndex] = '';
      }
      
      // 设置错误信息到对话内容中
      conversationItem.message[currentIndex] = errorMessage || '系统错误，请稍后再试';
      
      // 🔑 重要：显示错误提示给用户
      errorMsg(errorMessage || '系统错误，请稍后再试');
      return;
    }

    // 同一时间戳传来的decodeValue是含有三条信息的合并，so需要分割
    // 这里json解析，添加错误处理
    let message: any;
    try {
      message = JSON.parse(rawMsgData || '{}');
    } catch (parseError) {
      console.error('📨 JSON解析失败:', {
        rawData: rawMsgData,
        error: parseError,
        length: rawMsgData?.length
      });
      // 如果解析失败，尝试处理为文本消息
      if (rawMsgData && rawMsgData.trim()) {
        dataTransfers.textAdd(conversationItem, {
          event: 'text.add',
          content: { text: rawMsgData }
        });
      }
      return;
    }
    const eventType = message['event'];
    if ('metadata' in message) {
      conversationItem.metadata = message.metadata;
    }
    if ('event' in message) {
      switch (eventType) {
        case 'text.add':
          dataTransfers.textAdd(conversationItem, message);
          break;
        case 'heartbeat':
          break;
        case 'graph':
          conversationItem.echartsObj = message.content.option;
          break;
        case 'document.add':
          // 遇到文档添加事件，先省略
          // dataTransfers.documentAdd(conversationItem, message);
          break;
        case 'Suggestion':
          dataTransfers.suggestionFunc(conversationItem, message);
          break;
        case 'init':
          //初始化获取 metadata
          conversationItem.metadata = message.metadata;
          conversationItem.createdAt = message.content.created_at;
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
        case 'flow.stop':
          //时间流结束
          dataTransfers.flowStop(conversationItem, message, !!params.type);
          break;
        case 'loop.progress':
          //循环进度更新
          dataTransfers.loopProgress(conversationItem, message);
          break;
        case 'loop.completed':
          //循环完成
          dataTransfers.loopCompleted(conversationItem, message, !!params.type);
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
            language,
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
          language,
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
          language,
          question: params.question,
          record_id: params.qaRecordId,
        }),
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
        try {
          pp = Object(JSON.parse(params.params));
        } catch (parseError) {
          console.error('📨 参数解析失败:', {
            params: params.params,
            error: parseError
          });
          pp = {}; // 使用空对象作为默认值
        }
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
          await handleMsgDataShow(params, ev, conversationItem);
        },
      };

      if (params.user_selected_flow) {
        // 之前的对话历史记录
        await funcFetch.fetchHistory(streamUrl, params, pp, fetchParams);
      } else if (params.user_selected_app) {
        // 新的工作流调试记录
        await funcFetch.fetchAppNew(streamUrl, params, pp, fetchParams);
        // } else if (false) {
        //   //写传参数情况
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
    } else {
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
    await getStream(getStreamParams, regenerateInd ?? undefined);
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
    const resp = await api.stopGeneration();
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
            createdAt: record.created_at,
          },
          {
            cid: conversationList.value.length + 2,
            belong: 'robot',
            message: [record.content.answer],
            messageList,
            currentInd: 0,
            isAgainst: false,
            isSupport: false,
            isFinish: true,
            recordId: record.id,
            conversationId: record.conversationId,
            groupId: record.groupId,
            metadata: record.metadata,
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
    for (let i = 0; i < record.steps.length; i++) {
      flowData.data[0].push({
        id: record.steps[i].stepId,
        title: record.steps[i].stepId,
        status: record.steps[i].stepStatus,
        data: {
          input: record.steps[i].input,
          output: record.steps[i].output,
        },
      });
    }
    return flowData;
  };

  /**
   * 暂停流式返回
   */
  const stopDebug = async (): Promise<void> => {
    isPaused.value = true;
    
    // 安全检查：确保 conversationList 不为空
    if (conversationList.value.length > 0) {
      (
        conversationList.value[
          conversationList.value.length - 1
        ] as RobotConversationItem
      ).isFinish = true;
    }
    
    cancel();
    const resp = await api.stopGeneration();
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

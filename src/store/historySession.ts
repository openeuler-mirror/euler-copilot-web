// Copyright (c) Huawei Technologies Co., Ltd. 2023-2025. All rights reserved.
// licensed under the Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.
import { api } from 'src/apis';
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useSessionStore } from '.';
import type { SessionItem } from 'src/components/sessionCard/type';
import { successMsg } from 'src/components/Message';
import i18n from 'src/i18n';

export interface HistorySessionItem {
  conversationId: string;
  title: string;
  createdTime: string | Date;
  docCount: number;
  appId: string;
  debug: boolean;
  kbList: string[];
  llm: {
    icon: string;
    modelName: string;
    llmId: string;
  };
}

export const useHistorySessionStore = defineStore(
  'sessionStore',
  () => {
    // 历史会话列表
    const historySession = ref<HistorySessionItem[]>([]);
    const params = ref();
    const user_selected_app = ref<string>();
    const selectLLM = ref();
    const currentSelectedSession = ref<string>('');
    const { app } = storeToRefs(useSessionStore());
    /**
     * 选择历史会话
     * @param conversationId 会话id
     */
    const changeSession = async (conversationId: string): Promise<void> => {
      const { isAnswerGenerating } = useSessionStore();
      if (
        currentSelectedSession.value === conversationId ||
        isAnswerGenerating
      ) {
        return;
      }
      currentSelectedSession.value = conversationId;
      const { getConversation } = useSessionStore();
      await getConversation(currentSelectedSession.value).then(() => {
        const a = document.getElementsByClassName('draw');
        for (const i of a) {
          (i as HTMLElement).style.display = 'none';
        }
      });
    };
    // #region -----------------------------------------< select conversation >------------------------------------------------
    // 被选中的会话id列表
    const selectedSessionIds = ref<string[]>([]);

    // 是否全选
    const isSelectedAll = ref(false);
    // 不确定状态
    const indeterminate = computed(() =>
      selectedSessionIds.value.length === 0
        ? false
        : selectedSessionIds.value.length !== historySession.value.length,
    );
    /**
     * 全选
     */
    const selectAllSession = (): void => {
      if (isSelectedAll.value) {
        selectedSessionIds.value = historySession.value.map(
          (item) => item.conversationId,
        );
      } else {
        selectedSessionIds.value = [];
      }
    };
    /**
     * 获取当前 llm 模型的数值
     */
    const currentLLM = async () => {
      // 先置空
      selectLLM.value = {};
      await getHistorySession();
      historySession.value.forEach((item) => {
        if (item.conversationId === currentSelectedSession.value) {
          selectLLM.value = item.llm;
          if (item.appId) {
            app.value.appId = item.appId;
          }
        }
      });
    };
    /**
     * 选中某个会话
     * @param conversationId 会话id
     */
    const selectSession = (conversationId: string): void => {
      if (selectedSessionIds.value.includes(conversationId)) {
        selectedSessionIds.value = selectedSessionIds.value.filter(
          (val) => val !== conversationId,
        );
      } else {
        selectedSessionIds.value.push(conversationId);
      }
      // 更新isSelectedAll的值
      if (selectedSessionIds.value.length === historySession.value.length) {
        isSelectedAll.value = true;
      } else {
        isSelectedAll.value = false;
      }
    };
    // #endregion

    /**
     * 清空选择会话列表
     * @param conversationId 会话id
     */
    const initSessionList = (): void => {
      selectedSessionIds.value = [];
    };
    /**
     * 获取历史会话列表
     * @returns
     */
    const getHistorySession = async (): Promise<void> => {
      const conversationId = localStorage.getItem('conversationId');
      const [err, res] = await api.getSessionRecord();
      const { conversationList } = storeToRefs(useSessionStore());
      if (!err && res) {
        historySession.value = res.result.conversations
          .reverse()
          .map((item) => ({
            conversationId: item.conversationId,
            createdTime: item.createdTime,
            title: item.title,
            docCount: item.docCount || 0,
            llm: item.llm || {},
          }))
          .filter((item) => item.conversationId !== conversationId);
        if (res.result.conversations.length === 0) {
          await generateSession();
          return;
        }
        if (!currentSelectedSession.value) {
          currentSelectedSession.value =
            res.result.conversations[0]?.conversationId;
          //-----
        }
        if (currentSelectedSession.value) {
          const { getConversation, isAnswerGenerating } = useSessionStore();
          if (isAnswerGenerating) {
            return;
          }
          await getConversation(currentSelectedSession.value);
          return;
        }
        await createNewSession();
        if (res.result.conversations.length === 0) {
          conversationList.value = [];
        }
      }
    };
    /**
     * 更新会话标题
     * @param conversation
     * @returns
     */
    const updateSessionTitle = async (
      conversation: SessionItem,
    ): Promise<boolean> => {
      const [_] = await api.updateSession({
        conversationId: conversation.conversationId,
        title: conversation.title,
      });
      if (_) {
        return false;
      }
      await getHistorySession();
      return true;
    };

    /**
     * 创建新会话
     */
    const createNewSession = async (): Promise<void> => {
      const sId =
        historySession.value.length === 0
          ? null
          : historySession.value[0]?.conversationId;
      if (sId) {
        const [, cov] = await api.getHistoryConversation(sId);
        if (cov && cov.result.records.length === 0) {
          if (currentSelectedSession.value !== sId) {
            currentSelectedSession.value = sId;
          }
          successMsg(i18n.global.t('history.latestConversation'));
          await getHistorySession();
        } else {
          await generateSession();
        }
      } else {
        await generateSession();
      }
    };
    /**
     * 创建一个新的会话
     */
    const generateSession = async (): Promise<void> => {
      const [_, res] = await api.createSession(user_selected_app.value);
      if (!_ && res) {
        currentSelectedSession.value = res.result.conversationId;
        await getHistorySession();
      }
    };

    /**
     * 创建一个新的会话-debug工作流会话-需要一个传参
     */
    const generateSessionDebug = async (debug: any): Promise<any> => {
      const [_, res] = await api.createSessionDebug(debug);
      if (!_ && res) {
        currentSelectedSession.value = res.result.conversationId;
        await getHistorySession();
        return res.result.conversationId;
      }
    };

    return {
      params,
      historySession,
      currentSelectedSession,
      selectedSessionIds,
      indeterminate,
      isSelectedAll,
      changeSession,
      selectAllSession,
      selectSession,
      getHistorySession,
      updateSessionTitle,
      createNewSession,
      initSessionList,
      generateSession,
      generateSessionDebug,
      user_selected_app,
      selectLLM,
      currentLLM,
    };
  },
  {
    persist: {
      key: 'session',
      pick: [],
    },
  },
);

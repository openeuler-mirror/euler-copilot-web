// Copyright (c) Huawei Technologies Co., Ltd. 2023-2024. All rights reserved.
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
// import { invoke } from '@tauri-apps/api/tauri';

export interface HistorySessionItem {
  sessionId: string;
  title: string;
  createdTime: string | Date;
}

export const useHistorySessionStore = defineStore('sessionStore', () => {
  // 历史会话列表
  const historySession = ref<HistorySessionItem[]>([]);
  const currentSelectedSession = ref<string>('');
  /**
   * 选择历史会话
   * @param conversation_id 会话id
   */
  const changeSession = async (sessionId: string): Promise<void> => {
    const { isAnswerGenerating } = useSessionStore();
    if (currentSelectedSession.value === sessionId || isAnswerGenerating) {
      return;
    }
    currentSelectedSession.value = sessionId;
    const { getConversation } = useSessionStore();
    await getConversation(currentSelectedSession.value);
  };
  // #region -----------------------------------------< select session >------------------------------------------------
  // 被选中的会话id列表
  const selectedSessionIds = ref<string[]>([]);

  // 是否全选
  const isSelectedAll = ref(false);
  // 不确定状态
  const indeterminate = computed(() =>
    selectedSessionIds.value.length === 0
      ? false
      : selectedSessionIds.value.length !== historySession.value.length
  );
  /**
   * 全选
   */
  const selectAllSession = (): void => {
    isSelectedAll.value
      ? (selectedSessionIds.value = historySession.value.map(
          (item) => item.sessionId
        ))
      : (selectedSessionIds.value = []);
  };
  /**
   * 选中某个会话
   * @param sessionId 会话id
   */
  const selectSession = (sessionId: string): void => {
    selectedSessionIds.value.includes(sessionId)
      ? (selectedSessionIds.value = selectedSessionIds.value.filter(
          (val) => val !== sessionId
        ))
      : selectedSessionIds.value.push(sessionId);
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
   * @param conversation_id 会话id
   */
  const initSessionList = (): void => {
    selectedSessionIds.value = [];
  };
  /**
   * 获取历史会话列表
   * @returns
   */
  const getHistorySession = async (): Promise<void> => {
    const [_, res] = await api.getSessionRecord();
    const { conversationList } = storeToRefs(useSessionStore());
    if (!_ && res) {
      historySession.value = res.result.reverse().map((item) => ({
        sessionId: item.conversation_id,
        createdTime: item.created_time,
        title: item.title,
      }));
      if (res.result.length === 0) {
        await generateSession();
      }
      if (!currentSelectedSession.value) {
        currentSelectedSession.value = res.result[0]?.conversation_id;
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
      if (res.result.length === 0) {
        conversationList.value = [];
      }
    }
  };
  /**
   * 更新会话标题
   * @param session
   * @returns
   */
  const updateSessionTitle = async (session: SessionItem): Promise<boolean> => {
    const [_] = await api.updateSession(
      {
        sessionId: session.sessionId,
      },
      {
        title: session.title,
      }
    );
    if (_) {
      return false;
    }
    // await getHistorySession();
    return true;
  };

  /**
   * 创建新会话
   */
  const createNewSession = async (): Promise<void> => {
    const sId =
      historySession.value.length === 0
        ? null
        : historySession.value[0]?.sessionId;
    if (sId) {
      const [, cov] = await api.getHistoryConversation(sId);
      if (cov && cov.result.length === 0) {
        if (currentSelectedSession.value !== sId) {
          currentSelectedSession.value = sId;
        }
        successMsg('已是最新对话');
        // await getHistorySession();
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
    // await invoke('create_conversation').then(async (conversationId: any) => {
    //   if (conversationId) {
    //     currentSelectedSession.value = conversationId;
    //   }
    // }).catch((err) => {
    //   console.error(err);
    // });
  };

  return {
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
  };
});

<script lang="ts" setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import DialoguePanel from 'src/components/dialoguePanel/DialoguePanel.vue';
import UploadFileGroup from 'src/components/uploadFile/UploadFileGroup.vue';
import InitalPanel from 'src/views/dialogue/components/InitalPanel.vue';
import InterPreview from 'src/views/dialogue/components/InterPreview.vue';
import MultiSelectTags from'src/views/dialogue/components/MultiSelectTags.vue';
import { storeToRefs } from 'pinia';
import {
  IconCaretRight,
} from '@computing/opendesign-icons';
import { useSessionStore, useChangeThemeStore } from 'src/store';
import type { ConversationItem, RobotConversationItem } from '../types';
import type { UploadFileCard } from 'src/components/uploadFile/type.ts';
import { UploadTypeName, UploadStatus } from 'src/components/uploadFile/type';
import CommonFooter from 'src/components/commonFooter/CommonFooter.vue';
import { api } from 'src/apis';
import { useHistorySessionStore } from 'src/store/historySession';
import { successMsg, errorMsg } from 'src/components/Message';
import i18n from 'src/i18n';
const { user_selected_app, selectMode } = storeToRefs(useHistorySessionStore());
const { getHistorySession } = useHistorySessionStore();

export interface DialogueSession {
  isCreateApp?: any;
  createAppForm: any;
}

const props = withDefaults(defineProps<DialogueSession>(), {});
const Form = ref(props.createAppForm);
const AppForm = ref(props.createAppForm);
const { pausedStream } = useSessionStore();
const themeStore = useChangeThemeStore();
const isCreateApp = ref(props?.isCreateApp);
const selectedModal = ref({});
const handleChangeMode = (val: string) => { 
  selectedModal.value = val;
  console.log(val);
}
// const isCreateApp = ref(true);
const modeOptions = ref([
  {
    label: 'test1',
    value: 'session',
  },
  {
    label: 'test2',
    value: 'history',
  }]);
const { app } = storeToRefs(useSessionStore());
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

let filterQuestions = computed(() =>
  questions.filter((item) => item.groupId === groupid.value % 6),
);

// 对话输入内容
const dialogueInput = ref<string>('');

// 对话列表
const { sendQuestion } = useSessionStore();
const { conversationList, isAnswerGenerating, dialogueRef } =
  storeToRefs(useSessionStore());
const { generateSession } = useHistorySessionStore();
const { currentSelectedSession } = storeToRefs(useHistorySessionStore());
/**
 * 发送消息
 */
const handleSendMessage = async (
  groupId: string | undefined,
  question: string,
  user_selected_flow?: string[],
) => {
  if (isAnswerGenerating.value || !isAllowToSend.value) return;
  const len = conversationList.value.length;
  if (
    len > 0 &&
    !(conversationList.value[len - 1] as RobotConversationItem).isFinish
  )
    return;
  dialogueInput.value = '';
  if (uploadFilesView.value.length > 0) {
    // 发送文件则刷新左侧会话列表
    getHistorySession();
  }
  uploadFilesView.value.length = 0;

  if (!currentSelectedSession.value) {
    await generateSession();
  }
  if (user_selected_flow) {
    await sendQuestion(
      groupId,
      question,
      user_selected_app.value,
      undefined,
      undefined,
      user_selected_flow,
      undefined,
    );
  } else {
    await sendQuestion(
      groupId,
      question,
      user_selected_app.value,
      undefined,
      undefined,
      undefined,
      undefined,
    );
  }
};

/**
 * 处理鼠标事件
 * @param event
 */
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    if (dialogueInput.value !== '' && isAllowToSend.value) {
      handleSendMessage(undefined, dialogueInput.value);
    }
  }
};

/**
 *
 * @param item
 */
const getItem = <T,>(item: ConversationItem, field: string): T | undefined => {
  if (field in item) {
    return (item as RobotConversationItem)[field] as T;
  }
  return undefined;
};

// textarea实例
const inputRef = ref<HTMLTextAreaElement | null>(null);

/**
 * 举报逻辑的钩子函数。
 * @param type
 * @param cid
 */
const handleReport = async (qaRecordId: string,reason_type:string,reason: string) => {
  const params: {
    qaRecordId: string;
    reason_type:string;
    reason: string;
  } = {
    reason_type: reason_type,
    record_id: qaRecordId,
    reason: reason,
  };
  const [_, res] = await api.report(params);
  if (!_ && res) {
    successMsg(i18n.global.t('feedback.feedbackSuccesful'));
  }
};

// 上传按钮对象
const uploadButton = ref();
// 最大上传数量
const MAXUPLOADLEN: number = 10;
let uploadBatch: number = 0;
// 后端上传列表Map (key: sessionid , value: existUploadList)
const existUploadMap = new Map();
// 保存后端已有的上传文件列表
let existUploadList: Array<any> = [];
//upload视图Map不同会话 (key: sessionid , value: uploadFilesView)
const uploadViewsMap = new Map();
// upload视图列表
const uploadFilesView = ref<Array<UploadFileCard>>([]);
// 保存轮询Map (key: sessionid , value: pollingObject)
const pollingMap = new Map();
// 上传类型数组
const acceptTypeList = [...Object.values(UploadTypeName)];
// 上传类型字符串
const acceptType: string = acceptTypeList.map((item) => `.${item},`).join(' ');
// 发送消息按钮
const isAllowToSend = computed(() => {
  let defaultStatus = true;
  uploadFilesView.value?.forEach((element) => {
    element.status !== UploadStatus.USED &&
    element.status !== UploadStatus.UNUSED
      ? (defaultStatus = false)
      : undefined;
  });
  return defaultStatus;
});

// 会话切换时
watch(currentSelectedSession, async (newVal) => {
  if (!newVal) return;
  const newExistList = existUploadMap.get(newVal);
  const newFileView = uploadViewsMap.get(newVal);
  let curPolling = pollingMap.get(newVal);

  let isNewSession = false;
  if (!newFileView) {
    isNewSession = true;
    uploadViewsMap.set(newVal, []);
  }

  if (!newExistList) {
    existUploadMap.set(newVal, []);
  }

  if (!curPolling) {
    pollingMap.set(newVal, getPollingProcess(newVal));
    console.log('new polling');
  }

  existUploadList = existUploadMap.get(newVal);
  uploadFilesView.value = uploadViewsMap.get(newVal);
  curPolling = pollingMap.get(newVal);
  // 调用接口获取最新上传列表
  const [_, response] = await api.getUploadFiles(newVal);
  console.log('watch');
  if (!_ && response) {
    const { documents } = response.result;
    existUploadList.length = 0;
    documents
      .filter((item) => item.type !== UploadStatus.RESOLVEFAIL)
      .forEach((item) => {
        existUploadList.push(item);
        if (item.status !== UploadStatus.USED) {
          isNewSession ? uploadFilesView.value.push(item as any) : null;
        }
      });
    // isNewSession ? curPolling.startPolling() : null;
    uploadFilesView.value.sort((pre, cur) => {
      return cur.created_at - pre.created_at;
    });
  }
});

// 上传是否超出容量
const isExceedSize = (files): boolean => {
  for (let file of files) {
    if (file.size / 1024 / 1024 > 64) return true;
  }
  return false;
};

// 上传是否符合类型
const isUploadTypeError = (files): boolean => {
  for (let file of files) {
    const fileType = file.name?.split('.').pop();
    if (!acceptTypeList.includes(fileType)) return true;
  }
  return false;
};

// 上传是否存在同名文件
const isUploadFileExist = (files): boolean => {
  for (let file of files) {
    const isInBackendList = existUploadList
      .map((item) => item.name)
      .includes(file.name);
    const isInUploadViews = uploadFilesView.value
      .map((item) => item.name)
      .includes(file.name);
    if (isInBackendList || isInUploadViews) {
      return true;
    }
  }
  return false;
};

// 是否可以上传
const isAllowToUpload = (files): boolean => {
  const curLen = uploadFilesView.value.length;
  const filesLen = files.length;
  let isAllow = true;
  // 文件数量超额 / 文件大小超额
  if (curLen + filesLen > MAXUPLOADLEN || isExceedSize(files)) {
    errorMsg(i18n.global.t('upload.error_size_msg'));
    isAllow = false;
  } else if (isUploadTypeError(files)) {
    errorMsg(i18n.global.t('upload.error_type_msg'));
    isAllow = false;
  } else if (isUploadFileExist(files)) {
    errorMsg(i18n.global.t('upload.error_name_msg'));
    isAllow = false;
  } else {
    isAllow = true;
  }
  return isAllow;
};

// 构造上传数据
const generateUploadData = (files) => {
  let formData = new FormData();
  for (let file of files) {
    formData.append('documents', file);
  }
  return formData;
};

// 更新上传列表视图
const updateUploadView = (files, batch): void => {
  for (let file of files) {
    const { name, size, type } = file;
    uploadFilesView.value.unshift({
      name,
      type,
      size: size,
      status: UploadStatus.UPLOADING,
      id: undefined,
      batch,
    });
  }
  uploadBatch++;
};

const sizeFormator = (size: number) => {
  if (size > 1024 * 1024) {
    return `${(size / 1024 / 1024).toFixed(2)}GB`;
  }
  if (size > 1024) {
    return `${(size / 1024).toFixed(2)}MB`;
  }
  return `${size.toFixed(2)}KB`;
};

const getPollingProcess = (sessionId) => {
  let timer;
  let currentCount = 0;
  const maxErrorCount = 200;
  const process = async () => {
    console.log('getPollingProcess process' );
    const pollingExistUploadList = existUploadMap.get(sessionId) || [];
    const pollingUploadFilesView = isSameSession(
      sessionId,
      currentSelectedSession.value,
    )
      ? uploadFilesView.value
      : uploadViewsMap.get(sessionId);
    const [_, response] = await api.getUploadFiles(sessionId);
    if (!_ && response) {
      const { documents } = response.result;
      let isStopPolling = true;
      // 更新existUploadList列表
      pollingExistUploadList.length = 0;
      documents
        .filter((item) => item.status !== UploadStatus.RESOLVEFAIL)
        .forEach((item) => {
          pollingExistUploadList.push(item);
        });
      // 更新上传的可见列表
      pollingUploadFilesView?.forEach((item) => {
        if (item.status !== UploadStatus.UPLOADFAIL) {
          const foundDocument = documents.find(
            (document) => document.name === item.name,
          );
          if (foundDocument) {
            const { id, name, type, size, status } = foundDocument;
            item.id = id;
            item.name = name;
            item.type = type;
            item.size = sizeFormator(size);
            item.status = status;
          } else {
            item.status = UploadStatus.RESOLVEFAIL;
          }
        }
      });
      // 若所有文件解析成功 则停止轮询
      documents.forEach((document) => {
        if (document.status === UploadStatus.RESOLVING) {
          isStopPolling = false;
        }
      });
      isStopPolling && stopPolling();
    } else {
      // 错误次数大于最大值 停止轮询
      currentCount++;
      if (currentCount > maxErrorCount) {
        stopPolling();
        currentCount = 0;
      }
    }
  };
  const startPolling = (): void => {
    // 若已开启轮询则不会重复开启
    if (timer) {
      return;
    }
    timer = setInterval(process, 1000);
  };
  const stopPolling = (): void => {
    clearInterval(timer);
    timer = null;
  };
  console.log('getPollingProcess');
  return { startPolling, stopPolling };
};

const isSameSession = (sessionId, curSessionId): boolean => {
  return sessionId === curSessionId;
};

// 上传文件(用户操作可能分批次)
const updateFilesInSession = async (
  formData,
  curUploadBatch,
  sessionId,
): Promise<void> => {
  const [_, response] = await api.uploadFiles(formData, sessionId);
  const requestUploadFilesView = isSameSession(
    sessionId,
    currentSelectedSession.value,
  )
    ? uploadFilesView.value
    : uploadViewsMap.get(sessionId);
  if (!_ && response) {
    const { documents } = response.result;
    // 再次更新视图 更新上传状态
    requestUploadFilesView.forEach((item) => {
      if (item.batch === curUploadBatch) {
        const matchedItem = documents.find(
          (element) => element.name === item.name,
        );
        if (matchedItem) {
          const { id, type, size, name } = matchedItem;
          item.id = id;
          item.name = name;
          item.size = size;
          item.type = type;
          item.status = UploadStatus.RESOLVING;
        } else {
          item.status = UploadStatus.UPLOADFAIL;
        }
      }
    });

    // 轮询状态api 更新解析状态 existUploadList列表
    let curPollingProcess = pollingMap.get(sessionId);
    if (!curPollingProcess) {
      pollingMap.set(sessionId, getPollingProcess(sessionId));
      curPollingProcess = pollingMap.get(sessionId);
    }
    curPollingProcess.startPolling();
  } else {
    requestUploadFilesView.forEach((item) => {
      if (item.batch === curUploadBatch) {
        item.status = UploadStatus.UPLOADFAIL;
      }
    });
  }
};

// 点击上传选中文件时
const onFileChange = (event) => {
  const files = event.target.files;
  const curUploadBatch = uploadBatch;
  // 清空上传id
  uploadButton.value.type = 'text';
  uploadButton.value.type = 'file';
  // 首先判断数量、大小、类型是否符合要求
  if (!isAllowToUpload(files)) {
    return;
  }
  // 生成需要上传的文件
  const formData = generateUploadData(files);

  // 更新视图列表
  updateUploadView(files, curUploadBatch);

  // 上传api请求
  updateFilesInSession(formData, curUploadBatch, currentSelectedSession.value);
};

const emitUpload = (event): void => {
  event.stopPropagation();
  const emitEvent = new MouseEvent('click', {
    bubbles: true,
  });
  uploadButton.value.dispatchEvent(emitEvent);
};

const handleDelete = (file): void => {
  // 删除列表中的删除项
  uploadFilesView.value = uploadFilesView.value.filter(
    (item: UploadFileCard) => item.name !== file.name,
  );
  existUploadList = existUploadList.filter(
    (item: UploadFileCard) => item.name !== file.name,
  );
  uploadViewsMap.set(currentSelectedSession.value, uploadFilesView.value);
  existUploadMap.set(currentSelectedSession.value, existUploadList);
};

const clearSuggestion = (index: number): void => {
  if ('search_suggestions' in conversationList.value[index]) {
    conversationList.value[index].search_suggestions = undefined;
  }
};

onMounted(() => {
  // 数据初始化
  AppForm.value = props.createAppForm;
  if (!inputRef.value) return;
  inputRef.value.focus();
});

watch(selectMode, (newValue, oldValue) => {
  user_selected_app.value = [];
  let first = true;
  if (selectMode.value.length !== 0) {
    if (selectMode.value[0] === 'auto') {
      user_selected_app.value.push('auto');
    } else {
      selectMode.value.forEach((item) => {
        const plugin = {
          plugin_name: item,
        };
        user_selected_app.value.push(plugin.plugin_name);
      });
    }
  }
  nextTick(() => {
    const totalW = (document.querySelector('.recognitionMode') as HTMLElement)
      .offsetWidth;
    const selectPreW = (document.querySelector('.el-select') as HTMLElement)
      .offsetWidth;
    const allTags = document.querySelectorAll(
      '.recognitionMode .el-select-tags-wrapper .el-tag--info',
    );
    document.querySelector('.recognitionMode .el-select-tags-wrapper')
      ? ((
          document.querySelector(
            '.recognitionMode .el-select-tags-wrapper',
          ) as HTMLElement
        ).style.display = 'flex')
      : '';
    const allTagsWidth = document.querySelector(
      '.recognitionMode .el-select-tags-wrapper',
    )
      ? (
          document.querySelector(
            '.recognitionMode .el-select-tags-wrapper',
          ) as HTMLElement
        ).offsetWidth
      : '';
    const nTag = allTags[allTags.length - 1] as HTMLElement;
    const isNExist = true;
    if (selectPreW >= totalW && newValue.length > oldValue.length && isNExist) {
      return;
    }
    if (totalW > allTagsWidth + 100) {
      (
        document.querySelector('.recognitionMode .el-select') as HTMLElement
      ).style.width = `${allTagsWidth + 70}px`;
    } else {
      (
        document.querySelector('.recognitionMode .el-select') as HTMLElement
      ).style.width = `${totalW}px`;
    }
    if (allTags.length > 3) {
      const lastTag = allTags[allTags.length - 3] as HTMLElement;
      const selectDomW = (document.querySelector('.el-select') as HTMLElement)
        .offsetWidth;
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
const selectQuestion = (val: any) => {
  dialogueInput.value = val;
};
/**
 * 暂停和重新生成问答
 */
const handlePauseAndReGenerate = (cid?: number) => {
  // 停止生成handlePauseAndReGenerate
  pausedStream(cid);
};

const getappMode = (appId: string) => {
  api
    .querySingleAppData({
      id: appId as string,
    })
    .then((res) => {
      const appInfo = res?.[1]?.result;
      if (appInfo) {
        Form.value = {
          icon: appInfo?.icon,
          name: appInfo?.name,
          description: appInfo?.description,
          links: appInfo?.links?.map((item) => item.url),
          recommendedQuestions: appInfo?.recommendedQuestions,
          dialogRounds: appInfo?.dialogRounds,
          permission: {
            visibility: appInfo?.permission?.visibility,
            authorizedUsers: appInfo?.permission?.authorizedUsers,
          },
        };
      }
    });
};

watch(
  () => user_selected_app,
  (val) => {
    if (user_selected_app.value[0] && !isCreateApp.value) {
      getappMode(user_selected_app.value[0]);
    }
    if (!isCreateApp.value) {
      Form.value = props.createAppForm;
    }
  },
  {
    immediate: true,
    deep: true,
  },
);

watch(
  () => isCreateApp,
  (val) => {
    if (isCreateApp.value === true) {
      AppForm.value = props.createAppForm;
    }
  },
  {
    immediate: true,
    deep: true,
  },
);
</script>

<template>
  <div class="dialogue-rightContainer">
    <!-- 会话区域 -->
    <div style="height: 100%" class="dialogue-conversation">
      <div
        class="dialogue-conversation-main"
        ref="dialogueRef"
        v-if="!isCreateApp"
      >
        <DialoguePanel
          v-for="(item, index) in conversationList"
          :cid="item.cid"
          :key="index"
          :groupId="getItem(item, 'groupId')"
          :type="item.belong"
          :inputParams="item.params"
          :content="item.message"
          :echartsObj="getItem(item, 'echartsObj')"
          :recordList="
            item.belong === 'robot' ? item.messageList.getRecordIdList() : ''
          "
          :isCommentList="
            item.belong === 'robot' ? item.messageList.getCommentList() : ''
          "
          :messageArray="
            item.belong === 'robot' ? item.messageList : ''
          "
          :is-finish="getItem(item, 'isFinish')"
          :test="getItem(item, 'test')"
          :metadata="getItem(item, 'metadata')"
          :flowdata="getItem(item, 'flowdata')"
          :created-at="item.createdAt"
          :current-selected="item.currentInd"
          :need-regernerate="item.cid === conversationList.slice(-1)[0].cid"
          :user-selected-app="user_selected_app"
          :search_suggestions="getItem(item, 'search_suggestions')"
          :paramsList="getItem(item, 'paramsList')"
          :modeOptions="modeOptions"
          @handleReport="handleReport"
          @handleSendMessage="handleSendMessage"
          @clearSuggestion="clearSuggestion(index)"
        />
        <div
          v-if="
            conversationList.length === 0 &&
            (app.selectedAppId === '' || !app.selectedAppId)
          "
        >
          <InitalPanel @selectQuestion="selectQuestion" />
        </div>
        <div
          class="dialogue-interPreview-main"
          v-if="conversationList.length === 0 && app.selectedAppId !== ''"
        >
          <InterPreview
            :createAppForm="Form"
            @selectQuestion="selectQuestion"
          />
        </div>
      </div>
      <div class="createApp-demo"></div>
      <div class="dialogue-conversation-bottom">
        <!-- 问题换一换 -->
        <div
          v-if="isAnswerGenerating && !isCreateApp"
          class="dialogue-panel__stop"
          @click="handlePauseAndReGenerate(Number(conversationList.length))"
        >
          <img
            v-if="themeStore.theme === 'dark'"
            src="@/assets/svgs/dark_stop_answer.svg"
            alt=""
          />
          <img v-else src="@/assets/svgs/light_stop_answer.svg" alt="" />
          <div class="dialogue-panel__stop-answer">
            {{ $t('feedback.stop') }}
          </div>
        </div>
        <div class="dialogue-conversation-bottom-selectGroup">
            <div class="modalSelectGroup">
              <el-dropdown trigger="click">
                <span class="el-dropdown-link" v-if="selectedModal.label">
                  <img :src="selectedModal.icon" alt="" />
                  {{ selectedModal.label }}
                  <el-icon>
                    <IconCaretRight/>
                  </el-icon>
                </span>
                <span class="el-dropdown-link" v-else>
                  请选择模型
                  <el-icon>
                    <IconCaretRight/>
                  </el-icon>
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
                      v-for="(item, index) in modeOptions"
                      :key="index"
                      @click="handleChangeMode(item)">
                      <img
                        :src="item.icon"
                        alt=""
                        style="width: 20px; height: 20px; margin-right: 8px"/>
                      {{ item.label }}
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>        
            </div>
            <MultiSelectTags></MultiSelectTags>
          </div>
        <div class="sendbox-wrapper">
          <!-- 输入框 -->
          <div class="dialogue-conversation-bottom-sendbox">
            <div class="dialogue-conversation-bottom-sendbox__textarea">
              <textarea
                ref="inputRef"
                :disabled="isCreateApp"
                v-model="dialogueInput"
                maxlength="2000"
                :placeholder="$t('main.ask_me_anything')"
                @keydown="handleKeydown"
              />
            </div>
            <!-- 上传 -->
            <div class="dialogue-conversation-bottom-sendbox__upload">
              <el-tooltip
                placement="top"
                :content="$t('upload.upload_tip_text')"
                effect="light"
              >
                <div class="upload-wrapper">
                  <input
                    ref="uploadButton"
                    type="file"
                    multiple
                    :accept="acceptType"
                    @change="onFileChange"
                    src="@/assets/svgs/upload_light.svg"
                  />
                  <img
                    v-if="themeStore.theme === 'dark'"
                    src="@/assets/svgs/upload_light.svg"
                    @click="emitUpload"
                  />
                  <img
                    v-else
                    src="@/assets/svgs/upload_dark.svg"
                    @click="emitUpload"
                  />
                </div>
              </el-tooltip>
            </div>
            <!-- 发送问题 -->
            <div class="dialogue-conversation-bottom-sendbox__icon">
              <img
                v-if="
                  !isAllowToSend ||
                  isAnswerGenerating ||
                  dialogueInput.length <= 0
                "
                src="@/assets/svgs/send_disabled.svg"
                alt=""
              />
              <div v-else class="send-message-btn">
                <img
                  @click="handleSendMessage(undefined, dialogueInput)"
                  src="@/assets/svgs/send_enabled.svg"
                  alt=""
                />
              </div>
            </div>
          </div>
          <transition name="fade">
            <div
              class="dialogue-conversation-bottom__upload-list"
              v-if="uploadFilesView.length > 0"
            >
              <upload-file-group
                :file-list="uploadFilesView"
                @delete-file="handleDelete"
              ></upload-file-group>
            </div>
          </transition>
        </div>
      </div>
      <footer class="copilot-footer">
        <CommonFooter />
      </footer>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.modalSelectGroup{
  width: 140px;
  margin-right: 8px;
  padding: 0 8px;
  margin-bottom: 8px;
  height: 32px;
  background-color: #fff;
  border-radius: 8px;
  display: inline-block;
  span{
    font-size: 18px;
    height: 32px;
  }
}
.dialogue-rightContainer {
  height: 100%;
  width: 100%;
  display: flex;
  min-width: 1028px;
}
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
  margin-bottom: 16px;
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
    // background-image: linear-gradient(180deg, #e7f0fd 1%, #accbee 100%);
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

    .sendbox-wrapper {
      position: relative;
      background-color: var(--o-bg-color-base);
      border-radius: 8px;
      bottom: 0px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      .dialogue-conversation-bottom-sendbox__icon {
        & > img {
          cursor: not-allowed;
        }
        & > .send-message-btn > img {
          cursor: pointer;
        }
      }
    }

    &__upload-list {
      width: 100%;
      height: 88px;
      padding: 0 8px;
      border-radius: 0 0 8px 8px;
      display: flex;
      align-items: center;
      background-color: var(--o-bg-color-light);
      overflow-x: scroll;
    }

    &-sendbox {
      height: 120px;
      padding: 16px;

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
          font-family:
            HarmonyOS_Sans_SC_Regular,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            'Segoe UI',
            Roboto,
            Oxygen,
            Ubuntu,
            Cantarell,
            'Open Sans',
            'Helvetica Neue',
            sans-serif;

          &:focus {
            outline: none;
          }

          &::placeholder {
            color: var(--o-text-color-tertiary);
          }
        }

        textarea::-webkit-input-placeholder {
          font-family: HarmonyOS_Sans_SC_Regular;
        }
      }

      &__upload {
        position: absolute;
        cursor: pointer;
        width: 32px;
        height: 32px;

        .upload-wrapper {
          position: relative;
          top: 3px;

          input {
            width: 32px;
            height: 32px;
            opacity: 0;
          }

          img {
            position: absolute;
            left: 0;
            top: 0;
            background-color: transparent;
          }

          img:hover {
            filter: invert(50%) sepia(66%) saturate(446%) hue-rotate(182deg)
              brightness(100%) contrast(103%);
          }
        }
      }

      &__icon {
        text-align: right;
        & img {
          position: relative;
          bottom: 5px;
        }
      }
    }
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
  margin-bottom: 8px;
  margin-top: 16px;
  border-radius: 8px;

  .mode-select {
    max-width: 100%;
    height: 40px;
    min-width: 160px;
  }
}

.fade-enter-from {
  opacity: 0;
  height: 0;
}

.fade-enter-active {
  transition: all 0.5s ease-in-out;
}

.fade-leave-active {
  transition: all 0.5s ease-in-out;
}

.fade-leave-to {
  opacity: 0;
  height: 0;
}

:deep(.el-input__wrapper) {
  border: none;
  box-shadow: none;
  height: 40px;
  width: 175px;
}

:deep(.el-tag .is-closable .el-tag--info .el-tag--default .el-tag--light) {
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

.copilot-footer {
  margin-top: 16px;
}

.dialogue-interPreview-main {
  width: 100%;
}
</style>

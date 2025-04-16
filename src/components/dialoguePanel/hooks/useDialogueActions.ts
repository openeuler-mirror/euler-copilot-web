import { ref, Ref } from 'vue';
import { errorMsg, successMsg } from 'src/components/Message';
import { writeText } from 'src/utils';
import i18n from 'src/i18n';

export function useDialogueActions(content: Ref<string[] | string | undefined>, currentSelected: Ref<number | undefined>) {
  // 复制文本
  const handleCopy = () => {
    if (!content.value || !Array.isArray(content.value)) {
      errorMsg(i18n.global.t('feedback.copied_failed'));
      return;
    }
    if(currentSelected.value) {
    writeText(content.value[currentSelected.value]);    
    }
    successMsg(i18n.global.t('feedback.copied_successfully'));
  };

  // 赞同/反对逻辑（简化示例）
  const handleFeedback = (type: 'support' | 'against' | 'report') => {
    // 发送反馈到后端
    console.log(type, currentSelected.value);
  };

  return {
    handleCopy,
    handleFeedback,
  };
}
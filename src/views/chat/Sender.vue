<script lang="ts" setup>
import { ref } from 'vue';
import CopilotIconSelected from '@/assets/svgs/routerCopilotSelected.svg';

const props = defineProps<{
  isStreaming: boolean;
}>();

const emits = defineEmits<{
  (e: 'send', q: string): void;
  (e: 'newChat'): void;
}>();

const senderInput = ref('');

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    if (props.isStreaming) return;
    emits('send', senderInput.value);
    senderInput.value = '';
  }
}

function onSendClick() {
  if (props.isStreaming) return;
  emits('send', senderInput.value);
  senderInput.value = '';
}
</script>

<template>
  <div class="sender">
    <div class="create-button" @click="emits('newChat')">
      <img :src="CopilotIconSelected" alt="" />
    </div>
    <div class="chat-sender">
      <textarea
        v-model="senderInput"
        placeholder="在此输入你想了解的内容，输入Shift+Enter换行"
        maxlength="2000"
        @keydown="onKeyDown"
      />
      <img
        v-if="isStreaming"
        src="@/assets/svgs/send_disabled.svg"
        alt=""
        @click="onSendClick"
      />
      <img
        v-else
        src="@/assets/svgs/send_enabled.svg"
        alt=""
        @click="onSendClick"
      />
    </div>
  </div>
</template>

<style style="scss" scoped>
.sender {
  width: 100%;
  display: flex;
  gap: 12px;
  margin-bottom: 10px;

  .create-button {
    width: 56px;
    height: 56px;
    flex-shrink: 0;
    background-color: var(--o-bg-color-base);
    border-radius: 8px;
    cursor: pointer;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

    img {
      width: 40px;
      height: 40px;
      margin: 8px;
    }
  }

  .chat-sender {
    width: 100%;
    height: 56px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    background-color: var(--o-bg-color-base);
    position: relative;
    padding-right: 60px;

    textarea {
      padding-top: 18px;
      padding-left: 12px;
      height: 100%;
      border-radius: 8px;
      width: 100%;
      border: none;
      outline: none;
      color: var(--o-text-color-primary);
      font-size: 16px;
      background-color: var(--o-bg-color-base);
      overflow: auto;
      scrollbar-width: none;
      -ms-overflow-style: none;

      font-family:
        HarmonyOS_Sans_SC_Medium,
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
    }

    img {
      width: 40px;
      height: 40px;
      position: absolute;
      right: 10px;
      top: 8px;
      cursor: pointer;
    }
  }
}
</style>

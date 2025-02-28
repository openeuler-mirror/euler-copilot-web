<template>
  <InterPreview :create-app-form="createAppForm" createApp=true />
  <div class="sendbox-wrapper">
    <div class="dialogue-conversation-bottom-sendbox">
      <div class="dialogue-conversation-bottom-sendbox__textarea">
        <textarea ref="inputRef" maxlength="2000" :placeholder="$t('main.ask_me_anything')" />
      </div>
      <div class="dialogue-conversation-bottom-sendbox__upload">
          <div class="upload-wrapper">
            <input ref="uploadButton" type="file" multiple src="@/assets/svgs/upload_light.svg" />
            <img v-if="themeStore.theme === 'dark'" src="@/assets/svgs/upload_light.svg" />
            <img v-else src="@/assets/svgs/upload_dark.svg" />
          </div>
      </div>
      <div class="dialogue-conversation-bottom-sendbox__icon">
        <img src="@/assets/images/send_disable.png" alt="" />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue';
import InterPreview from 'src/views/dialogue/components/InterPreview.vue';
import { useChangeThemeStore } from 'src/store';
const themeStore = useChangeThemeStore();
interface InterPreProps {
  createAppForm: any;
}
const props = withDefaults(defineProps<InterPreProps>(), {});
const interPreviewInfo = ref();
watch(
  () => props.createAppForm,
  (newValue, oldValue) => {
    interPreviewInfo.value = props.createAppForm;
  },
  {
    immediate: true,
    deep: true,
  },
);
</script>
<style lang="scss" scoped>
.sendbox-wrapper {
  position: relative;
  background-color: var(--o-bg-color-base);
  border-radius: 8px;
  bottom: 0px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin: 12px 104px;
}

.dialogue-conversation-bottom-sendbox {
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

      &:focus {
        outline: none;
      }

      &::placeholder {
        color: var(--o-text-color-tertiary);
      }
    }

    textarea::-webkit-input-placeholder {
      font-family: HarmonyOS_Sans_SC_Medium;
    }
  }

  &__upload {
    position: absolute;
    cursor: pointer;
    width: 32px;
    height: 32px;

    .upload-wrapper {
      position: relative;

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
    }
  }

  &__icon {
    text-align: right;
  }
}
</style>

<script lang="ts" setup>
import Welcome from './Welcome.vue';
import Operations from './Operations.vue';
import CommonFooter from '@/components/commonFooter/CommonFooter.vue';
import Bubble from '@/components/bubble/index.vue';
import userAvatar from '@/assets/svgs/dark_user.svg';
import robotAvatar from '@/assets/svgs/robot.svg';
import { computed, ref, onBeforeMount, onBeforeUnmount } from 'vue';

const userInput = ref('');

const handleKeydown = (evt: any): any => {
  if (evt.key === 'Enter' && !evt.shiftKey) {
    evt.preventDefault();
    if (userInput.value !== '') {
    }
  }
};

const headerStyles = computed(() => {
  if (window.eulercopilot.process.platform === 'win32') {
    return { paddingRight: '145px' };
  } else if (window.eulercopilot.process.platform === 'linux') {
    return { paddingRight: '120px' };
  } else if (window.eulercopilot.process.platform === 'darwin') {
    return { paddingLeft: 'calc(50% - 60px)' };
  }
});

function storageListener(e: StorageEvent) {
  if (e.key === 'theme') {
    document.body.setAttribute('theme', e.newValue || 'light');
  }
}

onBeforeMount(() => {
  const theme =
    localStorage.getItem('theme') ||
    window.eulercopilot.process.env.EULERCOPILOT_THEME ||
    'light';
  // TODO 第二个窗口body属性会丢失，建议优化处理方式
  document.body.setAttribute('theme', theme);
  window.addEventListener('storage', storageListener);
});

onBeforeUnmount(() => {
  window.removeEventListener('storage', storageListener);
});
</script>

<template>
  <div class="chat">
    <header class="chat-header" :style="headerStyles">
      <div class="chat-header-logo">
        <img
          src="@/assets/svgs/euler_copilot_logo.svg"
          alt="euler_copilot_logo"
        />
        <h4>EulerCopilot</h4>
      </div>
      <div class="chat-header-operation">
        <Operations></Operations>
      </div>
    </header>

    <!-- TODO：待完成 -->
    <div class="chat-container">
      <!-- <Welcome class="welcome" /> -->
      <div class="chat-container-bubble">
        <Bubble
          :avatar="userAvatar"
          content="hello"
          :styles="{
            content: {
              backgroundImage:
                'linear-gradient(to right, rgba(109, 117, 250, 0.2), rgba(90, 179, 255, 0.2))',
            },
          }"
        />
        <Bubble
          :avatar="robotAvatar"
          :styles="{
            content: {
              padding: '24px 24px 16px 24px',
            },
          }"
          content="hello! How can i assist you today Docker or openeuler related tasks? Mock Mock Mock MockMock MockMock MockMock MockMock MockMock Mock"
        >
          <template #footer>
            <div class="bubble-footer">
              <div class="action-toolbar">
                <div class="left">tokens:132↑| 9‌↓| 1743141974.70 1 /1</div>
                <div class="button-group">
                  <el-tooltip
                    placement="top"
                    :content="$t('feedback.copy')"
                    effect="light"
                  >
                    <img src="@/assets/svgs/dark_copy.svg" />
                  </el-tooltip>
                </div>
              </div>
            </div>
          </template>
        </Bubble>
      </div>

      <div class="chat-container-bottom">
        <div class="create-button">
          <img src="@/assets/svgs/create.svg" alt="" />
        </div>
        <div class="chat-sender">
          <textarea
            v-model="userInput"
            placeholder="在此输入你想了解的内容，输入Shift+Enter换行"
            maxlength="2000"
          />
          <img src="@/assets/svgs/send_enabled.svg" alt="" />
        </div>
      </div>

      <CommonFooter />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.chat {
  width: 100%;
  height: 100%;
  background-image: var(--o-bg-image);
  background-size: cover;
  background-position: center;
  color: var(--o-text-color-primary);
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 48px;
  padding: 0 24px;
  background-color: var(--o-bg-color-base);
  box-shadow: 2px 0 8px 0 rgba(29, 35, 41, 0.1);
  -webkit-app-region: drag;

  &-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
  }
  &-operation {
    -webkit-app-region: no-drag;
  }
}

.chat-container {
  height: calc(100% - 40px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 16px;

  .welcome {
    margin-top: 200px;
  }

  &-bubble {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 24px;
    flex: 1;

    .bubble-footer {
      margin-top: 20px;
      .action-toolbar {
        border-top: 1px dashed var(--o-border-color-light);
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 0 0 0;

        img {
          width: 24px;
          height: 24px;
        }

        .left {
          font-size: 12px;
          line-height: 18px;
          color: var(--o-text-color-tertiary);
        }

        .button-group {
          height: 24px;
          display: flex;
          align-items: center;
        }
      }
    }
  }

  &-bottom {
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
}
</style>

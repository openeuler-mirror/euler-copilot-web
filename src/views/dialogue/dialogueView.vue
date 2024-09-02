<script lang="ts" setup>
import { useRouter, useRoute } from 'vue-router';
import { onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { onHtmlEventDispatch } from 'src/utils';
import { useHistorySessionStore, useSessionStore, useAccountStore, useChangeThemeStore } from 'src/store';
import DialogueSession from './components/DialogueSession.vue';
import DialogueTool from './components/DialogueTool.vue';
import CommonFooter from 'src/components/commonFooter/CommonFooter.vue';
import EulerDialog from 'src/components/EulerDialog.vue';
import { marked } from 'marked';
import { ARGEEMENT_VERSION } from 'src/conf/version';
import { onBeforeMount,reactive } from 'vue';
import { errorMsg, successMsg } from 'src/components/Message';
import { api } from 'src/apis';
import { refreshToken, stopGeneraterion } from 'src/apis/paths';
// 挂载全局事件
window.onHtmlEventDispatch = onHtmlEventDispatch;
const router = useRouter();
const route = useRoute();
const { getUserInfo, logout, updateAgreement } = useAccountStore();
const { userinfo } = storeToRefs(useAccountStore());
const { getHistorySession } = useHistorySessionStore();
const { historySession } = storeToRefs(useHistorySessionStore());
const { conversationList } = storeToRefs(useSessionStore());
const themeStore = useChangeThemeStore();
const dialogVisible = ref(false);
const apikeyVisible = ref(false);
const apikey = ref();
const hidden = ref(false);
const revoke = ref(true);
const modeOptions = reactive([
  {
    label: '自动识别',
    value: 'auto',
    disabled: false,
  },
]);

const isDark = ref(sessionStorage.getItem('theme') === 'dark');
const loginDialogVisible = ref(false);

/**
 * 初始化
 */

const initCopilot = async (): Promise<void> => {
  if(sessionStorage.getItem('theme')){
    themeStore.theme = sessionStorage.getItem('theme');
  }
  else {
    sessionStorage.setItem('theme', 'dark');
  }
  const currRoute = router.currentRoute;
  if (currRoute.value.path === '/') {
    const isLogin = await getUserInfo();
    if (isLogin) {
      userinfo.value.status = true;
      await getHistorySession();
      await handleAgreement(userinfo.value.revsionNumber);
      await getModeOptions();
      await stopGeneraterion();
    }else{
      if(sessionStorage.getItem('csrftk')){
        const store = useAccountStore(); 
        // 开始refreshtoken
        await store.refreshAccessToken().then(() => {
          getUserInfo();
          getHistorySession();
          getModeOptions();
          stopGeneraterion();
        })
      }else{
        userinfo.value.status = false;
        loginDialogVisible.value = true;
      }
    }
    return;
  }
};

const setPlugins = async() => {
  const [_, res] = await api.getRecognitionMode();
    if (!_ && res) {
      res.result.forEach(item => {
        const opt = {
          label: item.plugin_name,
          value: item.plugin_name,
          disabled: false
        };
        modeOptions.value.push(opt);
      });
    }
}

const logoutHandler = () => {
  logout();
  historySession.value = [];
  conversationList.value = [];
  loginDialogVisible.value = true;
};

// 协议内容
const agreement = ref<string>('');
// 协议版本
const agreementVersion = ref<string>(ARGEEMENT_VERSION);

/**
 * 读取协议
 */
const readAgreement = async () => {
  const response = await import('src/conf/agreement.md?raw');
  agreement.value = marked.parse(response.default) as string;
};

/**
 * 处理服务协议是否显示
 * @param CheckedVersion
 */
const handleAgreement = async (CheckedVersion: string | null) => {
  if (agreementVersion.value === CheckedVersion) {
    return;
  }
  await readAgreement();
  dialogVisible.value = true;
};

/**ss
 *
 */
const handleSubmit = async () => {
  await updateAgreement(agreementVersion.value);
  dialogVisible.value = false;
};

const changeTheme = () => {
  isDark.value = !isDark.value;
  isDark.value ? document.body.setAttribute('theme', 'dark') :
    document.body.setAttribute('theme', 'light');
  const theme = isDark.value ? 'dark' : 'light';
  sessionStorage.setItem('theme',theme);
  themeStore.theme = theme;
  themeStore.$patch({theme: theme});
};

const createApi = async() => {
  console.log('createSuccess');
  apikey.value = '23232adasjdadsadkasdsakkjkj23';
  revoke.value = false;
  let action = 'create'
  await api.getApiKey();
  await api.changeApiKey({action});
}

const updateApi = async() => {
  console.log('updateApi');
  apikey.value = '23232adasjdadsadkasdsakkjkj23';
  let action = 'update'
  await api.changeApiKey({action});
  revoke.value = false;
}

const revokeApi = async() => {
  console.log('revokeApi');
  let action = 'revoke'
  await api.changeApiKey({action});
  revoke.value = true;
  apikey.value = false;
  hidden.value = false;
}

const handleDialogClose = () => {
  apikey.value = false;
  hidden.value = true;
  apikeyVisible.value = false;
}

onMounted(() => {
  if (sessionStorage.getItem('theme')) {
    document.body.setAttribute('theme', sessionStorage.getItem('theme'));
  }
});

watch(
  () => route.path,
  () => {
    initCopilot();
  },
  {
    immediate: true,
  }
);


// onBeforeMount(() => {
//   initCopilot();
// });

watch(() => userinfo.value.status, () => {
  if(!userinfo.value.status){
    // loginDialogVisible.value = true;
  }
  }
);

const ruleForm = reactive({
  passwd: '',
  account: '',
});

const userLoginHandler = async () => {
  const passwd = ruleForm.passwd;
  const account = ruleForm.account;
  const store = useAccountStore();
  const res = await store.userLogin(passwd,account);
    if (res) {
      successMsg('登陆成功');
      // loginDialogVisible.value = false;
      router.push('/');
      await getHistorySession();
      await getModeOptions();
    }else{
      errorMsg('登录失败，请重新登陆');
    }
};

const getModeOptions = async() => {
  await api.getRecognitionMode().then(data => {
        const [_,res] = data;
        res.result.forEach(item => {
        const opt = {
          label: item.plugin_name,
          value: item.plugin_name,
          disabled: false
        };
        const a = modeOptions.find((item) => {return item.label === opt.label})
        if(!a){
          modeOptions.push(opt);
        }
      });
      });
}

</script>

<template>
  <div class="dialogue" id="dialogId">
    <header class="dialogue-header">
      <span>
        <img src="src/assets/svgs/euler_copilot_logo.svg" />
        <h4>EulerCopilot</h4>
      </span>
      <div class="header-right">
        <div class="mode">
          <span v-if="isDark" @click="changeTheme">
            <img src="src/assets/svgs/sun.svg" alt="">
          </span>
          <span v-else @click="changeTheme">
            <img id='moon-icon' src="src/assets/svgs/moon.svg" alt="">
          </span>
        </div>

        <el-popover popper-class="popper-class">
          <template #reference>
            <img class="avatar" src="src/assets/svgs/user.svg" />
          </template>
          <el-button class="exit-button" @click="logoutHandler">退出登录</el-button>
        </el-popover>
      </div>
    </header>
    <div class="dialogue-container">
      <div class="dialogue-container-main">
        <DialogueSession :modeOptions="modeOptions" :login="!loginDialogVisible" />
      </div>
    </div>
    <footer class="dialogue-footer">
      <CommonFooter />
    </footer>
    <EulerDialog :visible="dialogVisible" :content="agreement" agreement-name="《服务协议》" @submit="handleSubmit">
    </EulerDialog>
  </div>
  <el-dialog 
    class="apikey" 
    v-model="apikeyVisible" 
    title="提示"
    width="50%" 
    align-center
    :before-close='handleDialogClose'
    >
    <div class="apikey_view">
      <el-alert v-if='apikey' class='apikey_view_alert' type="info" :show-icon='true' :closable='false'>此API
        KEY只展示一次，请复制后妥善保存</el-alert>
      <div class='apikey_view_main'>
        <div class='main'>
          <div class='main_view' v-if="!apikey&&hidden">
            <span>******************************</span>
          </div>
          <div class='main_view' v-else-if='!apikey'>
            <img v-if="themeStore.theme === 'dark'" src="src/assets/svgs/dark_null.svg" />
            <img v-else src="src/assets/svgs/light_null.svg" alt="">
            <span>暂无可用的apikey</span>
          </div>
          <div class='main_view' v-else>
            <div class='main_view_span'>
              <div>qdqwuidwqyeqiueywueyqwuieywqiuqyeq</div>
            </div>
          </div>
          <div v-if='apikey'>
            <el-button type='primary'>复制</el-button>
            <el-button @click='revokeApi'>撤销</el-button>
          </div>
          <div v-else-if='!apikey&&!revoke'>
            <el-button type='primary' @click='updateApi'>刷新</el-button>
            <el-button @click='revokeApi'>撤销</el-button>
          </div>
          <div v-else>
            <el-button type='primary' @click='createApi'>新建apikey</el-button>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<style lang="scss">
.el-dialog__body {
  overflow: hidden;
}

.apikey {
  &_view {

    // height: 400px;
    &_alert {
      margin-bottom: 8px;
    }

    &_main {
      // background-color: pink;
      // height: 336px;
      .main {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 4%;
        height: 300px;
        &_view {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: 32px;
          &_span{
            height: 80px;  
            margin: 0px;
            div{
              margin: 0px;
              width:300px;
              font-size: 20px;
              word-wrap: break-word;
            }
          }
        }

        img {
          width: 180px;
        }

        span {
          font-size: 12px;
        }
        div{
          button{
            margin-top: 32px;
          }
        }
      }
    }
  }
}

.popper-class {
  padding: 3px 0 !important;

  .exit-button {
    margin: 0px;
    width: 100%;
    border-radius: 0;
    border-style: none;
  }
}

#sun-icon{
  // background-color: pink;
  &:hover{
    filter: invert(51%) sepia(95%) saturate(146%) hue-rotate(168deg) brightness(94%) contrast(83%);
  }
  &:active{
    filter: invert(50%) sepia(31%) saturate(458%) hue-rotate(168deg) brightness(101%) contrast(87%);
  }
}

#moon-icon{
  &:hover{
    filter: invert(51%) sepia(95%) saturate(146%) hue-rotate(168deg) brightness(94%) contrast(83%);
  }
  &:active{
    filter: invert(50%) sepia(31%) saturate(458%) hue-rotate(168deg) brightness(101%) contrast(87%);
  }
}
</style>
<style lang="scss" scoped>
.dialogue {
  height: 100vh;
  width: 100vw;
  // min-height: 768px;
  // min-width: 1388px;
  overflow: scroll;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-image: var(--o-bg-image);
  background-size: cover;
  &-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 48px;
    padding: 0 24px;
    background-color: var(--o-bg-color-base);
    span {
      align-items: center;
      display: flex;
      align-content: center;
      vertical-align: top;
      font-size: 16px;
      height: 48px;
      img {
        width: 24px;
        height: 48px;
        border-radius: 50%;
      }

      h4 {
        font-size: 18px;
        margin-left: 5px;
        color: var(--o-text-color-primary);
      }
    }

    .avatar {
      width: 24px;
      height: 48px;
      border-radius: 50%;
      cursor: pointer;

      &:hover {
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
    }

    .header-right {
      display: flex;

      .mode {
        margin-right: 18px;
      }
    }
  }

  &-container {
    display: flex;
    padding: 16px 24px 16px 24px;
    height: calc(100% - 60px);
    justify-content: space-between;

    &-main {
      display: flex;
      flex: 1;
    }
  }
  &-footer{
    margin-bottom: 12px;
  }
}
</style>

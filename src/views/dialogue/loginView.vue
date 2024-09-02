<script lang="ts" setup>
import { ref } from 'vue';
import CommonFooter from 'src/components/commonFooter/CommonFooter.vue';
import { reactive } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { useAccountStore } from 'src/store';
const { userLogin } = useAccountStore();
import { errorMsg } from 'src/components/Message';
import { useRouter } from 'vue-router'
const router = useRouter();

const ruleFormRef = ref<FormInstance>()

const validatePass = (rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('Please input the password'))
  } else {
    callback()
  }
}

const ruleForm = reactive({
  passwd: '',
  account: '',
})

const rules = reactive<FormRules<typeof ruleForm>>({
  passwd: [{ validator: validatePass, trigger: 'blur' }]
})

const submitForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return
  formEl.validate((valid) => {
    if (valid) {
      loginHandler()
    } else {
      errorMsg('登录失败');
      return false
    }
  })
}

const loginHandler = async () => {
  const status = await userLogin(ruleForm.passwd,ruleForm.account);
  if(status){
    router.replace('/');
    const store = useAccountStore();
    const res = await store.refreshAccessToken();
  }else{
    errorMsg('登录失败');
  }
}


</script>

<template>
  <div class="dialogue">
    <header class="dialogue-header">
      <span>
        <img src="src/assets/svgs/euler_copilot_logo.svg" />
        <h4>EulerCopilot</h4>
      </span>
    </header>
    <div class="dialogue-container">
      <div class="dialogue-container-main">
        <div class="login">
          <el-form ref="ruleFormRef" style="max-width: 600px" :model="ruleForm" status-icon :rules="rules"
            label-width="auto" class="demo-ruleForm">
            <el-form-item label="User" prop="account">
              <el-input v-model="ruleForm.account" />
            </el-form-item>
            <el-form-item label="Password" prop="passwd">
              <el-input v-model="ruleForm.passwd" type="password" autocomplete="off" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="submitForm(ruleFormRef)">
                login
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>
    <footer class="dialogue-footer">
      <CommonFooter />
    </footer>
  </div>
</template>

<style lang="scss">
.popper-class {
  padding: 3px 0 !important;

  .exit-button {
    width: 100%;
    border-radius: 0;
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

  &-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 40px;
    padding: 0 24px;
    background-color: #fff;

    span {
      display: flex;
      align-content: center;
      vertical-align: top;
      font-size: 16px;

      img {
        width: 24px;
        height: 24px;
        border-radius: 50%;
      }

      h4 {
        margin-left: 5px;
      }
    }

    .avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      cursor: pointer;

      &:hover {
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
    }
  }

  &-container {
    display: flex;
    padding: 10px 24px 10px 24px;
    height: calc(100% - 60px);
    justify-content: space-between;

    &-main {
      display: flex;
      flex: 1;
    }
  }
}
</style>

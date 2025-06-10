<template>
    <el-form ref="ruleFormRef" label-position="left" label-width="auto" :model="ruleForm" :rules="rules"
        class="online-ruleForm" style="max-width: 600px">
        <el-form-item label="后端服务链接" prop="url" label-position="left">
            <el-input placeholder="请输入" v-model="ruleForm.url" @blur="checkUrlValid" />
        </el-form-item>
    </el-form>
    <div class="submit-btn">
        <el-button type="primary" @click="handleConfirm(ruleFormRef)">确定</el-button>
    </div>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'

interface RuleForm {
    url: string;
}

const ruleForm = reactive<RuleForm>({
    url: '',
})
const ruleFormRef = ref<FormInstance>()

const rules = reactive<FormRules<RuleForm>>({
    url: [
        { required: true, message: '请输入后端服务链接', trigger: 'blur' },
        { type: 'url', message: '请输入有效的URL', trigger: ['blur', 'change'] },
    ],
})

const urlStatus = ref<'idle' | 'checking' | 'valid' | 'invalid' | 'error'>('idle')

const checkUrlValid = async () => {
    if (!ruleForm.url) return;
    urlStatus.value = 'checking'
    try {
        const response = await fetch(ruleForm.url, { method: 'HEAD', mode: 'cors' })
        if (response.status === 404) {
            urlStatus.value = 'invalid'
            console.error('链接返回404，无法访问')
        } else {
            urlStatus.value = 'valid'
            console.log('链接可访问')
        }
    } catch (e) {
        urlStatus.value = 'error'
        console.error('网络错误或CORS/CSP限制，无法访问链接')
    }
}

const handleConfirm = async (formEl: FormInstance | undefined) => {
    if (!formEl) return;
    await formEl.validate((valid, fields) => {
        if (!valid) {
            console.error('表单验证失败:', fields);
            return;
        }
        console.log('表单验证成功:', ruleForm);
    })

    // 这里可以添加处理逻辑，比如保存链接或发送请求
    console.log('后端服务链接:', ruleForm.url);
    // 关闭当前页面或执行其他操作
}
</script>
<style lang="scss" scoped>
.online-ruleForm {
    margin: 0 48px 0 40px;
}
.submit-btn {
    width: 100vw;
    display: flex;
    justify-content: center;
    position: absolute;
    bottom: 24px;
    button {
        padding: 8px 25px;
    }
}
</style>

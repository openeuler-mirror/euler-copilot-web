<template>
    <el-form ref="ruleFormRef" label-position="left" label-width="auto" :model="ruleForm" :rules="rules"
        class="model-ruleForm" style="max-width: 600px">
        <div class="model-title">
            大模型
            <img :src="successIcon" alt="success" width="16" height="16" />
        </div>
        <el-form-item label="URL" prop="url" label-position="left">
            <el-input placeholder="请输入" v-model="ruleForm.url" />
        </el-form-item>
        <el-form-item label="模型名称" prop="modelName" label-position="left">
            <el-input placeholder="请输入" v-model="ruleForm.modelName" />
        </el-form-item>
        <el-form-item label="API_Key" prop="apiKey" label-position="left">
            <el-input placeholder="请输入" v-model="ruleForm.apiKey" />
        </el-form-item>
    </el-form>
    <el-form ref="embeddingRuleFormRef" label-position="left" label-width="auto" :model="embeddingRuleForm" :rules="rules"
    class="model-ruleForm" style="max-width: 600px">
        <div class="model-title">
            Embedding模型
            <img :src="successIcon" alt="success" width="16" height="16" />
        </div>
        <el-form-item label="URL" prop="url" label-position="left">
            <el-input placeholder="请输入" v-model="embeddingRuleForm.url">
                <template #suffix>
                    <el-icon class="el-input__icon" @click="copyText(ruleForm)" >
                        <img :src="copyIcon" alt="copy" width="16" height="16" />
                    </el-icon>
                </template>
            </el-input>
        </el-form-item>
            <el-form-item label="模型名称" prop="modelName" label-position="left">
                <el-input placeholder="请输入" v-model="embeddingRuleForm.modelName" />
            </el-form-item>
            <el-form-item label="API_Key" prop="apiKey" label-position="left">
                <el-input placeholder="请输入" v-model="embeddingRuleForm.apiKey" />
            </el-form-item>
    </el-form>
    <div class="submit-btn">
        <el-button type="primary" @click="handleConfirm(ruleFormRef)">确定</el-button>
    </div>
</template>
<script lang="ts" setup>
import { reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import copyIcon from './assets/svgs/copy_icon.svg'
import successIcon from './assets/svgs/success.svg'

interface RuleForm {
    url: string;
    modelName: string;
    apiKey: string;
}

const ruleForm = reactive<RuleForm>({
    url: '',
    modelName: '',
    apiKey: '',
})
const embeddingRuleForm = reactive<RuleForm>({
    url: '',
    modelName: '',
    apiKey: '',
})

const ruleFormRef = ref<FormInstance>()

const embeddingRuleFormRef = ref<FormInstance>()


const rules = reactive<FormRules<RuleForm>>({
    url: [
        { required: true, message: '请输入后端服务链接', trigger: 'blur' },
    ],
    modelName: [
        { required: true, message: '请输入模型名称', trigger: 'blur' },
    ],
    apiKey: [
        { required: true, message: '请输入API_Key', trigger: 'blur' },
    ],
})

const copyText = (ruleForm: RuleForm) => {
    embeddingRuleForm.url = ruleForm.url
    embeddingRuleForm.modelName = ruleForm.modelName
    embeddingRuleForm.apiKey = ruleForm.apiKey
    console.log(embeddingRuleForm)
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
.model-ruleForm {
    margin: 0 48px 0 40px;
    .model-title{
        font-weight: 700;
        font-size: 16px;
        line-height: 24px;
        margin: 32px 0 16px 8px;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .el-input__icon{
        cursor: pointer;
    }
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
.el-form-item.is-error .el-input__wrapper{
    background-color: rgb(247,193,193);
}
</style>

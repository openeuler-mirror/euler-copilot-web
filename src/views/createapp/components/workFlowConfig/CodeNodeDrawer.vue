<template>
  <div class="code-node-drawer">
    <el-drawer
      v-model="drawerVisible"
      :show-close="false"
      :modal="true"
      modal-class="transparent-modal"
      class="flowDrawer"
      size="70%"
      @close="closeDrawer"
    >
      <template #header>
        <div class="drawer-header">
          <div class="header-title">
            <img class="node-icon" :src="getSrcIcon({ callId: 'Code' })" />
            <span>{{ $t('flow.step_configuration') }} - {{ nodeName }}</span>
          </div>
        </div>
      </template>

      <template #default>
        <div class="drawer-body">
          <el-collapse v-model="activeName" class="o-hpc-collapse code-content">
            
            <!-- 基本信息 -->
            <el-collapse-item name="basic" class="basic-panel">
              <template #title>
                <el-icon class="el-collapse-item__arrow" :class="{ 'is-active': activeName.includes('basic') }">
                  <IconCaretRight />
                </el-icon>
                <span>{{ $t('flow.node_config.basic_info') }}</span>
              </template>
              <div class="basic-content">
                <el-form :model="nodeConfig" label-position="left" label-width="120px">
                  <el-form-item :label="$t('flow.node_config.node_name')" required>
                    <el-input
                      v-model="nodeConfig.name"
                      :placeholder="$t('flow.node_config.node_name_placeholder')"
                      maxlength="50"
                      clearable
                    />
                  </el-form-item>
                  <el-form-item :label="$t('flow.node_config.security_level')">
                    <el-select v-model="nodeConfig.securityLevel" :placeholder="$t('flow.node_config.security_level_placeholder')">
                      <el-option :label="$t('flow.node_config.security_level_low')" value="low" />
                      <el-option :label="$t('flow.node_config.security_level_high')" value="high" />
                    </el-select>
                  </el-form-item>
                </el-form>
              </div>
            </el-collapse-item>

            <!-- 变量管理 -->
            <el-collapse-item name="variables" class="variables-panel">
              <template #title>
                <el-icon class="el-collapse-item__arrow" :class="{ 'is-active': activeName.includes('variables') }">
                  <IconCaretRight />
                </el-icon>
                <span>{{ $t('flow.node_config.variable_management') }}</span>
              </template>
              <div class="variables-content">
                <el-tabs v-model="variableTab" class="variable-tabs">
                  <!-- 输入变量 -->
                  <el-tab-pane :label="$t('flow.node_config.input_variables')" name="input">
                    <div class="variable-section">
                      <div class="section-header">
                        <span>{{ $t('flow.node_config.input_variables_tip') }}</span>
                        <el-button type="primary" size="small" @click="addInputVariable">
                          <el-icon><Plus /></el-icon>
                          {{ $t('flow.node_config.add_variable') }}
                        </el-button>
                      </div>
                      
                      <div class="variable-list">
                        <div 
                          v-for="(variable, index) in inputVariables" 
                          :key="'input-' + index"
                          class="variable-item"
                        >
                          <VariableChooser
                            v-model:variable-name="variable.variableName"
                            v-model="variable.variableReference"
                            v-model:selected-variable="variable.selectedVariable"
                            :supported-scopes="['conversation', 'system', 'env']"
                            :flow-id="flowId"
                            :current-step-id="nodeId"
                            :show-variable-name="true"
                            :show-variable-reference="true"
                            :show-actions="true"
                            :show-variable-info="true"
                            output-format="wrapped"
                            :placeholder="$t('flow.node_config.variable_placeholder')"
                            @remove="removeInputVariable(index)"
                            @variable-selected="(selectedVar, reference) => handleInputVariableSelected(selectedVar, index)"
                          />
                        </div>
                        
                        <div v-if="inputVariables.length === 0" class="empty-variables">
                          <p>{{ $t('flow.node_config.no_input_variables') }}</p>
                          <p class="tip">{{ $t('flow.node_config.input_variables_tip') }}</p>
                        </div>
                      </div>
                    </div>
                  </el-tab-pane>

                  <!-- 输出变量 -->
                  <el-tab-pane :label="$t('flow.node_config.output_variables')" name="output">
                    <div class="variable-section">
                      <div class="section-header">
                        <span>{{ $t('flow.node_config.output_variables_tip') }}</span>
                        <el-button type="primary" size="small" @click="addOutputVariable">
                          <el-icon><Plus /></el-icon>
                          {{ $t('flow.node_config.add_variable') }}
                        </el-button>
                      </div>
                      
                      <div class="variable-list">
                        <div 
                          v-for="(variable, index) in outputVariables" 
                          :key="'output-' + index"
                          class="variable-item"
                        >
                          <div class="variable-header">
                            <el-input
                              v-model="variable.name"
                              :placeholder="$t('flow.node_config.node_name')"
                              class="variable-name"
                              @change="validateVariableName(variable, 'output')"
                            />
                            <el-select
                              v-model="variable.type"
                              :placeholder="$t('flow.node_config.select_type')"
                              class="variable-type"
                            >
                              <el-option :label="$t('flow.node_config.type_string')" value="string" />
                              <el-option :label="$t('flow.node_config.type_number')" value="number" />
                              <el-option :label="$t('flow.node_config.type_boolean')" value="boolean" />
                              <el-option :label="$t('flow.node_config.type_list')" value="array" />
                              <el-option :label="$t('flow.node_config.type_object')" value="object" />
                            </el-select>
                            <el-button 
                              type="danger" 
                              size="small" 
                              @click="removeOutputVariable(index)"
                              class="remove-btn"
                            >
                              <el-icon><Delete /></el-icon>
                            </el-button>
                          </div>
                        </div>
                        
                        <div v-if="outputVariables.length === 0" class="empty-variables">
                          <p>{{ $t('flow.node_config.no_output_variables') }}</p>
                          <p class="tip">{{ $t('flow.node_config.output_variables_tip_code') }}</p>
                        </div>
                      </div>
                    </div>
                  </el-tab-pane>
                </el-tabs>
              </div>
            </el-collapse-item>

            <!-- 执行配置 -->
            <el-collapse-item name="execution" class="execution-panel">
              <template #title>
                <el-icon class="el-collapse-item__arrow" :class="{ 'is-active': activeName.includes('execution') }">
                  <IconCaretRight />
                </el-icon>
                <span>{{ $t('flow.node_config.execution_config') }}</span>
              </template>
              <div class="execution-content">
                <el-form :model="nodeConfig" label-position="left" label-width="120px">
                  <el-form-item :label="$t('flow.node_config.timeout_seconds')">
                    <el-input-number
                      v-model="nodeConfig.timeoutSeconds"
                      :min="5"
                      :max="300"
                      :step="5"
                    />
                    <span class="unit-text">{{ $t('flow.node_config.seconds') }}</span>
                  </el-form-item>
                  <el-form-item :label="$t('flow.node_config.memory_limit')">
                    <el-input-number
                      v-model="nodeConfig.memoryLimitMb"
                      :min="64"
                      :max="2048"
                      :step="64"
                    />
                    <span class="unit-text">{{ $t('flow.node_config.mb') }}</span>
                  </el-form-item>
                  <el-form-item :label="$t('flow.node_config.cpu_limit')">
                    <el-input-number
                      v-model="nodeConfig.cpuLimit"
                      :min="0.1"
                      :max="4.0"
                      :step="0.1"
                      :precision="1"
                    />
                    <span class="unit-text">{{ $t('flow.node_config.cores') }}</span>
                  </el-form-item>
                </el-form>
              </div>
            </el-collapse-item>

            <!-- 代码编辑 -->
            <el-collapse-item name="code" class="code-panel">
              <template #title>
                <el-icon class="el-collapse-item__arrow" :class="{ 'is-active': activeName.includes('code') }">
                  <IconCaretRight />
                </el-icon>
                <span>{{ $t('flow.node_config.code_editor') }}</span>
              </template>
              <div class="code-content">
                <!-- Monaco 代码编辑器 -->
                <CodeMonacoEditor
                  ref="codeEditorRef"
                  v-model="nodeConfig.code"
                  v-model:language="nodeConfig.codeType"
                  :min-height="200"
                  :max-height="600"
                  :disabled="false"
                  :custom-template="generateTemplateByLanguage(nodeConfig.codeType)"
                  @language-change="handleLanguageChange"
                />
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>
      </template>

      <template #footer>
        <div class="drawer-footer">
          <el-button @click="closeDrawer">{{ $t('common.cancel') }}</el-button>
          <el-button type="primary" @click="saveNode" :loading="saving">
            {{ $t('common.confirm') }}
          </el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { IconCaretRight } from '@computing/opendesign-icons'
import { Plus, Delete } from '@element-plus/icons-vue'
import { getSrcIcon } from '../types'
import CodeMonacoEditor from '@/components/CodeMonacoEditor.vue'
import VariableChooser from '@/components/VariableChooser.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface Variable {
  variableName?: string      // 自定义变量名
  variableReference?: string // 变量引用字符串
  selectedVariable?: {       // 选中的变量信息
    name: string
    var_type: string
    scope: string
    value: string
    description?: string
  }
  name?: string             // 兼容旧格式
  type?: string            // 兼容旧格式  
  description?: string     // 兼容旧格式
}

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  nodeData: {
    type: Object,
    default: () => ({}),
  },
  nodeId: {
    type: String,
    default: '',
  },
  flowId: {
    type: String,
    default: '',
  },
})

const emits = defineEmits(['update:visible', 'saveNode'])

// 响应式数据
const drawerVisible = ref(false)
const activeName = ref(['basic', 'code', 'variables'])
const variableTab = ref('input')
const saving = ref(false)

// 节点配置
const nodeConfig = ref({
  name: '',
  description: '',
  code: '',
  codeType: 'python',
  securityLevel: 'low',
  timeoutSeconds: 30,
  memoryLimitMb: 128,
  cpuLimit: 0.5,
})

// 变量配置
const inputVariables = ref<Variable[]>([])
const outputVariables = ref<Variable[]>([])

// 添加新的响应式数据
const codeEditorRef = ref()

// 计算属性
const nodeName = computed(() => nodeConfig.value.name || '代码执行')

// 根据变量类型和编程语言生成默认值
const getDefaultValueByType = (type: string, language: string = 'python'): string => {
  switch (type) {
    case 'string':
      return '""'
    case 'number':
      return '0'
    case 'boolean':
      return language === 'python' ? 'True' : (language === 'javascript' ? 'true' : 'true')
    case 'array':
      return '[]'
    case 'object':
      return '{}'
    default:
      return '""'
  }
}

// 根据变量类型和编程语言生成输入变量的默认值
const getInputDefaultValueByType = (type: string, language: string = 'python'): string => {
  switch (type) {
    case 'string':
      return language === 'python' ? "''" : (language === 'javascript' ? "''" : '""')
    case 'number':
      return '0'
    case 'boolean':
      return language === 'python' ? 'False' : (language === 'javascript' ? 'false' : 'false')
    case 'array':
      return '[]'
    case 'object':
      return '{}'
    default:
      return language === 'python' ? "''" : (language === 'javascript' ? "''" : '""')
  }
}

// 动态生成return语句的计算属性 - Python
const pythonReturnStatement = computed((): string => {
  if (outputVariables.value.length === 0) {
    return 'return {"result": ""}'
  }
  
  const returnObj: Record<string, string> = outputVariables.value.reduce((obj: Record<string, string>, variable: Variable) => {
    if (variable.name?.trim()) {
      obj[variable.name] = getDefaultValueByType(variable.type || 'string', 'python')
    }
    return obj
  }, {})
  
  const returnKeys = Object.keys(returnObj)
  if (returnKeys.length === 0) {
    return 'return {"result": ""}'
  }
  
  const returnLines = returnKeys.map((key: string) => 
    `        "${key}": ${returnObj[key]}`
  ).join(',\n')
  
  return `return {\n${returnLines}\n    }`
})

// 动态生成return语句的计算属性 - JavaScript
const javascriptReturnStatement = computed((): string => {
  if (outputVariables.value.length === 0) {
    return 'return {"result": ""};'
  }
  
  const returnObj: Record<string, string> = outputVariables.value.reduce((obj: Record<string, string>, variable: Variable) => {
    if (variable.name?.trim()) {
      obj[variable.name] = getDefaultValueByType(variable.type || 'string', 'javascript')
    }
    return obj
  }, {})
  
  const returnKeys = Object.keys(returnObj)
  if (returnKeys.length === 0) {
    return 'return {"result": ""};'
  }
  
  const returnLines = returnKeys.map((key: string) => 
    `        "${key}": ${returnObj[key]}`
  ).join(',\n')
  
  return `return {\n${returnLines}\n    };`
})

// 动态生成输出语句的计算属性 - Bash
const bashOutputStatement = computed((): string => {
  if (outputVariables.value.length === 0) {
    return '{\n    "result": ""\n}'
  }
  
  const returnObj: Record<string, string> = outputVariables.value.reduce((obj: Record<string, string>, variable: Variable) => {
    if (variable.name?.trim()) {
      obj[variable.name] = getDefaultValueByType(variable.type || 'string', 'bash')
    }
    return obj
  }, {})
  
  const returnKeys = Object.keys(returnObj)
  if (returnKeys.length === 0) {
    return '{\n    "result": ""\n}'
  }
  
  const returnLines = returnKeys.map((key: string) => 
    `    "${key}": ${returnObj[key]}`
  ).join(',\n')
  
  return `{\n${returnLines}\n}`
})

// 动态生成完整的Python代码模板
const generatePythonTemplate = (): string => {
  const validInputVars = inputVariables.value.filter(v => v.variableName?.trim() && v.selectedVariable)
  
  // 生成函数参数列表
  const functionParams = validInputVars.length > 0 
    ? validInputVars
        .map((v: Variable) => {
          const varType = v.selectedVariable?.var_type || 'string'
          const defaultValue = getInputDefaultValueByType(varType, 'python')
          return `${v.variableName}=${defaultValue}`
        })
        .join(', ')
    : '**kwargs'

  // 生成参数文档
  const paramDocs = validInputVars.length > 0 
    ? validInputVars
        .map((v: Variable) => {
          const varType = v.selectedVariable?.var_type || 'string'
          return `        ${v.variableName} (${varType}): ${v.selectedVariable?.description || '输入参数'}`
        })
        .join('\n')
    : '        **kwargs: 输入变量字典'

  return `def main(${functionParams}):
    """
    代码执行主函数
    
    Args:
${paramDocs}
        
    Returns:
        dict: 输出变量字典
    """
    # 在这里编写您的 Python 代码
    
    ${pythonReturnStatement.value}`
}

// 动态生成完整的JavaScript代码模板
const generateJavaScriptTemplate = (): string => {
  const validInputVars = inputVariables.value.filter(v => v.variableName?.trim() && v.selectedVariable)
  
  // 生成函数参数列表
  const functionParams = validInputVars.length > 0 
    ? validInputVars
        .map((v: Variable) => {
          const varType = v.selectedVariable?.var_type || 'string'
          const defaultValue = getInputDefaultValueByType(varType, 'javascript')
          return `${v.variableName} = ${defaultValue}`
        })
        .join(', ')
    : 'variables = {}'

  // 生成参数文档
  const paramDocs = validInputVars.length > 0 
    ? validInputVars
        .map((v: Variable) => {
          const varType = v.selectedVariable?.var_type || 'string'
          const jsType = varType === 'boolean' ? 'boolean' : 
                        varType === 'number' ? 'number' : 
                        varType === 'array' ? 'Array' : 
                        varType === 'object' ? 'Object' : 'string'
          return `     * @param {${jsType}} ${v.variableName} - ${v.selectedVariable?.description || '输入参数'}`
        })
        .join('\n')
    : '     * @param {Object} variables - 输入变量对象'

  return `function main(${functionParams}) {
    /**
     * 代码执行主函数
     * 
${paramDocs}
     * @returns {Object} 输出变量对象
     */
    
    // 在这里编写您的 JavaScript 代码
    
    ${javascriptReturnStatement.value}
}`
}

// 将驼峰命名转换为大写下划线格式
const convertToEnvVarName = (varName: string): string => {
  return varName.replace(/([A-Z])/g, '_$1').toUpperCase()
}

// 动态生成完整的Bash代码模板
const generateBashTemplate = (): string => {
  const validInputVars = inputVariables.value.filter(v => v.variableName?.trim() && v.selectedVariable)
  
  const inputCodeLines = validInputVars.length > 0 
    ? '\n' + validInputVars
        .map((v: Variable) => {
          const varType = v.selectedVariable?.var_type || 'string'
          const defaultValue = getInputDefaultValueByType(varType, 'bash')
          const envVarName = convertToEnvVarName(v.variableName!)
          return `    local ${v.variableName}="\${INPUT_${envVarName}:-${defaultValue}}"`
        })
        .join('\n')
    : '\n    # 示例：local value="\${INPUT_VARIABLE_NAME:-default_value}"'

  return `#!/bin/bash

# 代码执行主函数
# 输入变量通过环境变量传递：INPUT_VARIABLE_NAME
# 输出变量以JSON格式打印到stdout

main() {
    # 获取输入变量${inputCodeLines}
    
    # 在这里编写您的 Bash 代码
    
    # 输出JSON格式结果
    cat << EOF
${bashOutputStatement.value}
EOF
}

# 调用主函数
main`
}

// 验证Python代码中的return语句格式
const validatePythonReturnStatement = (code: string): { isValid: boolean; error?: string } => {
  try {
    // 移除注释和字符串，简化代码结构
    const cleanCode = code
      .split('\n')
      .map(line => {
        // 移除单行注释
        const commentIndex = line.indexOf('#')
        if (commentIndex !== -1) {
          line = line.substring(0, commentIndex)
        }
        return line.trim()
      })
      .filter(Boolean)
      .join(' ')  // 使用空格连接而不是换行符
    
    // 查找return语句 - 修改正则表达式以正确处理多行return语句
    const returnMatch = cleanCode.match(/return\s+(.+)$/s)
    if (!returnMatch) {
      return { isValid: false, error: '代码中必须包含return语句' }
    }
    
    const returnExpression = returnMatch[1].trim()
    
    // 检查return语句是否以{开始
    if (!returnExpression.startsWith('{')) {
      return { isValid: false, error: 'return语句必须返回一个字典（以 { 开始）' }
    }
    
    // 简单的括号匹配检查
    let braceCount = 0
    let inString = false
    let stringChar = ''
    
    for (let i = 0; i < returnExpression.length; i++) {
      const char = returnExpression[i]
      
      if (!inString && (char === '"' || char === "'")) {
        inString = true
        stringChar = char
      } else if (inString && char === stringChar && returnExpression[i-1] !== '\\') {
        inString = false
        stringChar = ''
      } else if (!inString) {
        if (char === '{') {
          braceCount++
        } else if (char === '}') {
          braceCount--
        }
      }
    }
    
    if (braceCount !== 0) {
      return { isValid: false, error: 'return语句中的大括号不匹配，请检查字典格式' }
    }
    
    return { isValid: true }
  } catch (error) {
    return { isValid: false, error: '代码格式错误，请检查语法' }
  }
}

// 初始化默认输出变量
const initializeDefaultOutputVariable = () => {
  if (outputVariables.value.length === 0) {
    outputVariables.value.push({
      name: 'result',
      type: 'string'
    })
  }
}

// 根据语言生成对应的模板
const generateTemplateByLanguage = (language: string): string => {
  switch (language) {
    case 'python':
      return generatePythonTemplate()
    case 'javascript':
      return generateJavaScriptTemplate()
    case 'shell':
      return generateBashTemplate()
    default:
      return generatePythonTemplate()
  }
}

// 检查是否是默认模板结构
const isDefaultTemplate = (code: string, language: string): boolean => {
  if (!code) return true
  
  switch (language) {
    case 'python':
      return code.includes('def main(**kwargs):') && code.includes('return {')
    case 'javascript':
      return code.includes('function main(variables = {})') && code.includes('return {')
    case 'shell':
      return code.includes('#!/bin/bash') && code.includes('main() {') && code.includes('cat << EOF')
    default:
      return false
  }
}

// 代码模板现在在Monaco Editor组件中定义

// 方法
const loadNodeData = (data: any) => {  
  nodeConfig.value = {
    name: data.name || '代码执行',
    description: data.description || '',
    // 从parameters中读取Code节点的配置属性
    code: data.parameters?.code || data.code || '',
    codeType: data.parameters?.codeType || data.codeType || 'python',
    securityLevel: data.parameters?.securityLevel || data.securityLevel || 'low',
    timeoutSeconds: data.parameters?.timeoutSeconds || data.timeoutSeconds || 30,
    memoryLimitMb: data.parameters?.memoryLimitMb || data.memoryLimitMb || 128,
    cpuLimit: data.parameters?.cpuLimit || data.cpuLimit || 0.5,
  }

  // 处理输入变量：只从input_parameters加载用户手动添加的变量
  const input_parameters = data.parameters?.input_parameters || data.input_parameters || {}
  if (Object.keys(input_parameters).length > 0) {
    inputVariables.value = Object.entries(input_parameters).map(([key, value]: [string, any]) => ({
      variableName: key,
      variableReference: value.reference || '',
      selectedVariable: {
        name: key,
        var_type: value.type || 'string',
        scope: 'conversation',
        value: value.value || '',
        description: value.description || ''
      }
    }))
  } else {
    // 默认为空，用户需要手动添加
    inputVariables.value = []
  }

  // 处理输出变量：只从output_parameters加载用户手动添加的变量
  const output_parameters = data.parameters?.output_parameters || data.output_parameters || {}
  if (Object.keys(output_parameters).length > 0) {
    outputVariables.value = Object.entries(output_parameters).map(([key, value]: [string, any]) => ({
      name: key,
      type: value.type || 'string',
      description: value.description || ''
    }))
  } else {
    // 默认为空，用户需要手动添加
    outputVariables.value = []
  }
  
  // 确保有默认的输出变量（只有当用户没有定义时才添加默认的result）
  initializeDefaultOutputVariable()
  
  // 如果没有代码内容，使用对应语言的生成模板
  if (!nodeConfig.value.code) {
    nodeConfig.value.code = generateTemplateByLanguage(nodeConfig.value.codeType)
  }
}

const handleLanguageChange = (language: string) => {
  // 当语言改变时，如果代码为空，使用动态生成的模板
  if (!nodeConfig.value.code || nodeConfig.value.code.trim() === '') {
    nodeConfig.value.code = generateTemplateByLanguage(language)
  }
}

const addInputVariable = () => {
  inputVariables.value.push({
    variableName: '',
    variableReference: '',
    selectedVariable: undefined
  })
}

const removeInputVariable = (index: number) => {
  inputVariables.value.splice(index, 1)
}

// 处理输入变量选择
const handleInputVariableSelected = (selectedVar: any, index: number) => {
  if (inputVariables.value[index]) {
    inputVariables.value[index].selectedVariable = selectedVar
  }
}

// 清理方法已移除，因为变量是由用户手动创建的，不需要清理

const addOutputVariable = () => {
  outputVariables.value.push({
    name: '',
    type: 'string'
  })
}

const removeOutputVariable = (index: number) => {
  outputVariables.value.splice(index, 1)
  
  // 确保至少保留一个默认输出变量
  if (outputVariables.value.length === 0) {
    initializeDefaultOutputVariable()
  }
}

const validateVariableName = (variable: Variable, type: string) => {
  if (!variable.name) return
  
  // 验证变量名格式
  const namePattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/
  if (!namePattern.test(variable.name)) {
    ElMessage.warning('变量名只能包含字母、数字和下划线，且不能以数字开头')
    return
  }
  
  // 基本的变量名验证已在上面完成
  
  // 检查重名
  const variables = type === 'input' ? inputVariables.value : outputVariables.value
  const duplicates = variables.filter(v => v.name === variable.name)
  if (duplicates.length > 1) {
    ElMessage.warning(`${type === 'input' ? '输入' : '输出'}变量名"${variable.name}"重复`)
  }
}

const closeDrawer = () => {
  drawerVisible.value = false
}

const saveNode = async () => {
  // 验证必填字段
  if (!nodeConfig.value.name.trim()) {
    ElMessage.error('请输入节点名称')
    return
  }

  if (!nodeConfig.value.code.trim()) {
    ElMessage.error('请输入代码内容')
    return
  }

  // 验证Python代码的return语句格式
  if (nodeConfig.value.codeType === 'python') {
    const validation = validatePythonReturnStatement(nodeConfig.value.code)
    if (!validation.isValid) {
      ElMessage.error(`代码格式错误：${validation.error}`)
      return
    }
  }

  // 验证变量名称
  const allVariables = [...inputVariables.value, ...outputVariables.value]
  for (const variable of allVariables) {
    if (variable.name && !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(variable.name)) {
      ElMessage.error(`变量名"${variable.name}"格式不正确`)
      return
    }
  }

  // 验证输出变量不能为空
  if (outputVariables.value.length === 0 || !outputVariables.value.some(v => v.name?.trim())) {
    ElMessage.error('至少需要定义一个输出变量')
    return
  }

  saving.value = true
  try {
    // 构建输入参数对象 - 只包含用户手动添加的输入变量
    const input_parameters: Record<string, any> = {}
    inputVariables.value
      .filter(v => v.variableName?.trim() && v.selectedVariable?.name)
      .forEach(variable => {
        input_parameters[variable.variableName!] = {
          type: variable.selectedVariable?.var_type || 'string',
          value: variable.selectedVariable?.value || '',
          description: variable.selectedVariable?.description || '',
          reference: variable.variableReference || ''
        }
      })

    // 构建输出参数对象 - 只包含用户手动添加的输出变量  
    const output_parameters: Record<string, any> = {}
    outputVariables.value
      .filter(v => v.name?.trim())
      .forEach(variable => {
        output_parameters[variable.name!] = {
          type: variable.type || 'string',
          description: variable.description || ''
        }
      })

    // 构建保存数据 - 所有配置都放在parameters中
    const saveData = {
      name: nodeConfig.value.name,
      description: nodeConfig.value.description,
      callId: 'Code',
      
      // 所有参数都放在parameters中
      parameters: {
        input_parameters,
        output_parameters,
        // 代码节点特有的配置属性
        code: nodeConfig.value.code,
        codeType: nodeConfig.value.codeType,
        securityLevel: nodeConfig.value.securityLevel,
        timeoutSeconds: nodeConfig.value.timeoutSeconds,
        memoryLimitMb: nodeConfig.value.memoryLimitMb,
        cpuLimit: nodeConfig.value.cpuLimit,
      }
    }

    emits('saveNode', saveData, props.nodeId)
    ElMessage.success('代码节点保存成功')
    closeDrawer()
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败，请重试')
  } finally {
    saving.value = false
  }
}

// 监听器
watch(() => props.visible, (newVal) => {
  drawerVisible.value = newVal
}, { immediate: true })

watch(drawerVisible, (newVal) => {
  if (!newVal) {
    emits('update:visible', false)
  }
})

// 监听nodeData变化
watch(() => props.nodeData, (newData: any) => {
  if (newData) {
    loadNodeData(newData)
  }
}, { immediate: true, deep: true })

// 监听outputVariables变化，同步更新代码模板
watch(outputVariables, () => {
  const currentCode = nodeConfig.value.code
  const currentLanguage = nodeConfig.value.codeType
  
  // 检查是否是默认模板结构
  if (isDefaultTemplate(currentCode, currentLanguage)) {
    // 更新代码模板
    const newTemplate = generateTemplateByLanguage(currentLanguage)
    nodeConfig.value.code = newTemplate
    
    // 如果Monaco Editor已初始化，更新其内容
    if (codeEditorRef.value) {
      codeEditorRef.value.setValue(newTemplate)
    }
  }
}, { deep: true })

// 监听inputVariables变化，同步更新代码模板
watch(inputVariables, () => {
  const currentCode = nodeConfig.value.code
  const currentLanguage = nodeConfig.value.codeType
  
  // 检查是否是默认模板结构
  if (isDefaultTemplate(currentCode, currentLanguage)) {
    const newTemplate = generateTemplateByLanguage(currentLanguage)
    nodeConfig.value.code = newTemplate
    
    if (codeEditorRef.value) {
      codeEditorRef.value.setValue(newTemplate)
    }
  }
  }, { deep: true })
</script>

<style lang="scss" scoped>
.code-node-drawer {
  :deep(.el-drawer) {
    border-radius: 8px 0 0 8px;
    background: var(--el-bg-color);
    
    body[theme='dark'] & {
      background: #1f2329;
    }
  }

  :deep(.el-drawer__header) {
    padding: 24px 24px 16px !important;
    margin-bottom: 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
    background: var(--el-bg-color);
    
    body[theme='dark'] & {
      background: #1f2329;
      border-bottom-color: var(--el-border-color);
    }
  }

  :deep(.el-drawer__body) {
    padding: 0;
  }

  :deep(.el-drawer__footer) {
    padding: 16px 24px;
    border-top: 1px solid var(--el-border-color-lighter);
    background: var(--el-bg-color);
    
    body[theme='dark'] & {
      background: #1f2329;
      border-top-color: var(--el-border-color);
    }
  }

  .drawer-header {
    .header-title {
      display: flex;
      align-items: center;
      font-size: 16px;
      font-weight: 500;
      color: var(--el-text-color-primary);
      
      body[theme='dark'] & {
        color: #e4e8ee;
      };

      .node-icon {
        width: 24px;
        height: 24px;
        margin-right: 8px;
      }
    }
  }

  .drawer-body {
    height: 100%;
    overflow-y: auto;
    background: var(--el-bg-color);
    
    body[theme='dark'] & {
      background: #1f2329;
    };

    .code-content {
      :deep(.el-collapse-item__header) {
        padding: 16px 24px;
        font-weight: 500;
        background: var(--el-fill-color-extra-light);
        border-bottom: 1px solid var(--el-border-color-lighter);
        color: var(--el-text-color-primary);
        
        body[theme='dark'] & {
          background: var(--o-bash-bg, #2a2f37);
          border-bottom-color: var(--el-border-color);
          color: #e4e8ee;
        }
      }

      :deep(.el-collapse-item__wrap) {
        border-bottom: none;
      }

      :deep(.el-collapse-item__content) {
        padding: 20px 24px;
        background: var(--el-bg-color);
        
        body[theme='dark'] & {
          background: #1f2329;
        }
      }
    }
  }

  .basic-content,
  .execution-content {
    :deep(.el-form-item) {
      margin-bottom: 16px;
    }

    .unit-text {
      margin-left: 8px;
      color: var(--el-text-color-secondary);
      font-size: 12px;
      
      body[theme='dark'] & {
        color: #d3dce9;
      }
    }
  }

  .code-content {
    // Monaco Editor样式由组件内部处理
    :deep(.code-monaco-editor) {
      margin: 0;
      border-radius: 6px;
      width: 100%;
      
      .editor-container {
        width: 100%;
        min-height: 200px;
        
        .monaco-editor {
          width: 100% !important;
          height: 100% !important;
        }
      }
      
      // 确保工具栏在暗色主题下正确显示
      .editor-toolbar {
        background: var(--el-fill-color-extra-light);
        
        body[theme='dark'] & {
          background: var(--o-bash-bg, #2a2f37);
        }
        
        .toolbar-left {
          .language-selector {
            label {
              color: var(--el-text-color-primary);
              
              body[theme='dark'] & {
                color: #e4e8ee;
              }
            }
          }
          
          .toolbar-actions {
            :deep(.el-button) {
              color: var(--el-text-color-primary) !important;
              font-size: 13px !important;
              font-weight: 500 !important;
              padding: 6px 12px !important;
              border-radius: 4px !important;
              transition: all 0.2s ease !important;
              border: 1px solid transparent !important;
              background: transparent !important;
              
              body[theme='dark'] & {
                color: #e4e8ee !important;
              }
              
              span {
                color: var(--el-text-color-primary) !important;
                
                body[theme='dark'] & {
                  color: #e4e8ee !important;
                }
              }
              
              &:hover {
                color: var(--el-color-primary) !important;
                background: var(--el-color-primary-light-9) !important;
                border-color: var(--el-color-primary-light-7) !important;
                transform: translateY(-1px) !important;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
                
                body[theme='dark'] & {
                  background: var(--flow-node-default-over-color, #25303e) !important;
                  border-color: var(--flow-node-boder-default-over, #314265) !important;
                  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3) !important;
                }
                
                span {
                  color: var(--el-color-primary) !important;
                }
              }
              
              &:active {
                transform: translateY(0) !important;
                background: var(--el-color-primary-light-8) !important;
                
                body[theme='dark'] & {
                  background: var(--flow-node-default-over-color, #25303e) !important;
                }
              }
              
              &:focus {
                outline: none !important;
                border-color: var(--el-color-primary) !important;
                box-shadow: 0 0 0 2px var(--el-color-primary-light-8) !important;
                
                body[theme='dark'] & {
                  box-shadow: 0 0 0 2px var(--flow-node-boder-default-over, #314265) !important;
                }
              }
            }
          }
        }
      }
    }
  }

  .variables-content {
    .variable-tabs {
      :deep(.el-tab-pane) {
        padding-top: 16px;
      }
    }

    .variable-section {
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        padding-bottom: 8px;
        border-bottom: 1px solid var(--el-border-color-lighter);
        
        body[theme='dark'] & {
          border-bottom-color: var(--el-border-color);
        }

        span {
          font-weight: 500;
          color: var(--el-text-color-primary);
          
          body[theme='dark'] & {
            color: #e4e8ee;
          }
        }
      }

      .variable-list {
        .variable-item {
          margin-bottom: 16px;
          padding: 16px;
          background: var(--el-fill-color-extra-light);
          border-radius: 6px;
          border: 1px solid var(--el-border-color-lighter);
          
          body[theme='dark'] & {
            background: var(--o-bash-bg, #2a2f37);
            border-color: var(--el-border-color);
          };

          .variable-header {
            display: flex;
            gap: 12px;
            margin-bottom: 8px;

            .variable-name {
              flex: 2;
            }

            .variable-type {
              flex: 1;
            }

            .remove-btn {
              flex-shrink: 0;
            }
          }

          .variable-description {
            width: 100%;
          }

          
        }

        .empty-variables {
          text-align: center;
          padding: 40px 20px;
          color: var(--el-text-color-secondary);
          
          body[theme='dark'] & {
            color: #d3dce9;
          }

          p {
            margin: 0;
          }

          .tip {
            font-size: 12px;
            margin-top: 8px;
            color: var(--el-text-color-placeholder);
            
            body[theme='dark'] & {
              color: #8d98aa;
            }
          }
        }
      }
    }
  }

  .drawer-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
}

// 透明遮罩样式
:deep(.transparent-modal) {
  background-color: transparent !important;
}
</style> 
<template>
  <div class="configYaml">
    <el-drawer
      v-model="visible"
      :show-close="false"
      :wrapperClosable="false"
      :modal="true"
      class="flowDrawer"
      :before-close="closeDrawer"
    >
      <template #header>
        <div class="drawerHeader">
          {{ $t('flow.step_configuration') }}-{{ yamlNodeName }}
        </div>
      </template>
      <template #default>
        <div class="drawerBody">
          <div v-if="yamlNodeId === 'Choice'" class="yamlChoiceContainer">
            <div>
              <el-button :icon="IconPlusCircle" @click="handleAddChoice">
                {{ $t('yaml.add_conditional_branches') }}
              </el-button>
            </div>
            <div
              v-for="(item, index) in choicesList"
              :key="index"
              class="yamlChoiceItem"
            >
              <div class="yamlChoiceItemTitle">
                <div v-if="item.is_default">
                  {{ $t('yaml.else') }}
                </div>
                <div v-else>
                  <div v-if="index === 0">
                    {{ $t('yaml.if') }}
                  </div>
                  <div v-else>
                    {{ $t('yaml.else_if') }}
                  </div>
                </div>
                <el-icon
                  v-if="!item.is_default && choicesList.length > 2"
                  class="delIcon"
                  @click="handleDelChoice(index, item)"
                >
                  <IconMinimize />
                </el-icon>
              </div>
              <div class="yamlChoiceItemContent">
                <!-- conditions数量大于1的时候才会显示逻辑运算符 -->
                <div
                  v-if="item.conditions.length > 1"
                  class="yamlChoiceItemLogic"
                >
                  <el-select
                    v-model="item.logic"
                    class="yamlChoiceItemLogicSelect"
                  >
                    <template #label>
                      {{ logicObj[item.logic] }}
                    </template>
                    <el-option
                      :label="logicObj['and']"
                      value="and"
                      key="and"
                    ></el-option>
                    <el-option
                      :label="logicObj['or']"
                      value="or"
                      key="or"
                    ></el-option>
                  </el-select>
                </div>
                <div class="yamlConditionContainer">
                  <div
                    v-for="(condition, cIndex) in item.conditions"
                    :key="cIndex"
                    class="yamlConditionItem"
                  >
                    <!-- 左边选择条件 -->
                    <el-select
                      v-model="condition.operate"
                      class="yamlConditionOperateSelect"
                      :placeholder="
                        i18n.global.t('yaml.please_select_condition')
                      "
                      @change="
                        (value) => onSelectOperateOption(value, index, cIndex)
                      "
                    >
                      <template #label>
                        {{ opertionListMap.get(condition.operate)?.str }}
                        {{ opertionListMap.get(condition.operate)?.label }}
                      </template>
                      <el-option
                        v-for="item in paramoperateList[index][cIndex]"
                        :label="
                          opertionListMap.get(item.operate)?.str +
                          ' ' +
                          opertionListMap.get(item.operate)?.label
                        "
                        :value="item.operate"
                        :key="item.operate"
                      >
                        {{ opertionListMap.get(item.operate)?.str }}
                        {{ opertionListMap.get(item.operate)?.label }}
                      </el-option>
                    </el-select>
                    <!-- 左值 -->
                    <div class="yamlConditionValue">
                      <el-select
                        v-model="condition.left.name"
                        :placeholder="i18n.global.t('yaml.please_select')"
                        class="yamlConditionLeft"
                        :style="
                          item.conditions.length > 1
                            ? { minWidth: '345px' }
                            : { minWidth: '460px' }
                        "
                        @change="
                          (value) => onSelectOption(value, index, cIndex)
                        "
                      >
                        <!-- leftOptions -->
                        <div
                          class="option-container"
                          v-for="item in leftOptions"
                          :key="item.stepId"
                        >
                          <el-option
                            class="leftOption"
                            v-if="item.visible"
                            :label="item.paramPath"
                            :value="item.paramPath"
                            :style="{
                              paddingLeft: item?.isGroup ? '' : '40px',
                            }"
                          >
                            <template #default>
                              <template v-if="item.isGroup">
                                {{ item.name }}
                                <div class="arrowIcon">
                                  <el-icon
                                    v-if="!item.childVisible"
                                    @click.stop="
                                      handleGroupClick(item, true, cIndex)
                                    "
                                  >
                                    <IconCaretDown />
                                  </el-icon>
                                  <el-icon
                                    v-else
                                    @click.stop="handleGroupClick(item, false)"
                                  >
                                    <IconCaretUp />
                                  </el-icon>
                                </div>
                              </template>
                              <template v-else>
                                <div>
                                  {{ item.name }}
                                  <span class="paramType">
                                    {{ item.paramType }}
                                  </span>
                                </div>
                              </template>
                            </template>
                          </el-option>
                        </div>
                      </el-select>
                      <!-- 右值：输入或引用参数值 -->
                      <div class="yamlConditionRight">
                        <span class="yamlConditionRightType">
                          {{ condition.right.type ?? '' }}
                        </span>
                        <el-input
                          v-model="condition.right.name"
                          :placeholder="i18n.global.t('yaml.parameter_value')"
                          class="yamlConditionRightSelect"
                          :value="condition.right.name || ''"
                          @change="
                            (value) =>
                              onSelectInputOption(value, index, cIndex, 'input')
                          "
                        >
                          <template #append>
                            <el-select
                              class="rightSelect"
                              v-model="condition.right.value"
                              placeholder="Select"
                              @change="
                                (value) =>
                                  onSelectInputOption(
                                    value,
                                    index,
                                    cIndex,
                                    'select',
                                  )
                              "
                              :popper-options="{
                                modifiers: [
                                  {
                                    name: 'offset',
                                    options: { offset: [-150, 10] },
                                  },
                                ],
                              }"
                            >
                              <div
                                class="option-container"
                                v-for="item in leftOptions"
                                :key="item.stepId"
                              >
                                <el-option
                                  class="leftOption"
                                  v-if="item.visible"
                                  :label="item.paramPath"
                                  :value="item.paramPath"
                                  :style="{
                                    paddingLeft: item?.isGroup ? '' : '40px',
                                  }"
                                >
                                  <template #default>
                                    <template v-if="item.isGroup">
                                      {{ item.name }}
                                      <div class="arrowIcon">
                                        <el-icon
                                          v-if="!item.childVisible"
                                          @click.stop="
                                            handleGroupClick(item, true)
                                          "
                                        >
                                          <IconCaretDown />
                                        </el-icon>
                                        <el-icon
                                          v-else
                                          @click.stop="
                                            handleGroupClick(item, false)
                                          "
                                        >
                                          <IconCaretUp />
                                        </el-icon>
                                      </div>
                                    </template>
                                    <template v-else>
                                      <div>
                                        {{ item.name }}
                                        <span class="paramType">
                                          {{ item.paramType }}
                                        </span>
                                      </div>
                                    </template>
                                  </template>
                                </el-option>
                              </div>
                            </el-select>
                          </template>
                        </el-input>
                      </div>
                    </div>
                    <el-icon
                      v-if="cIndex > 0 && typeof cIndex === 'number'"
                      class="delIcon"
                      @click="handleDelCondition(index, cIndex)"
                    >
                      <IconMinimize />
                    </el-icon>
                  </div>
                </div>
              </div>
              <div v-if="!item.is_default" class="addCondition">
                <el-button
                  text
                  :icon="IconPlusCircle"
                  @click="handleAddCondition(index)"
                >
                  {{ $t('yaml.add') }}
                </el-button>
              </div>
            </div>
          </div>
          <el-collapse
            v-else
            v-model="activeName"
            class="o-hpc-collapse yamlContent"
          >
            <el-collapse-item
              title="Consistency"
              :key="item.title"
              :name="item.title"
              v-for="(item, index) in yamlExpress"
            >
              <template #title>
                <el-icon
                  class="el-collapse-item__arrow"
                  :class="{ 'is-active': activeName.includes(item.title) }"
                >
                  <IconCaretRight />
                </el-icon>
                <span>{{ $t(item.title) }}</span>
              </template>
              <div class="yamlMonacoEditor" v-if="item.type && index === 1">
                <MonacoEditor
                  :yamlContent="item.yamlCode"
                  placeholder="Code goes here..."
                  :handleQueryYamlValue="handleChange"
                  :readOnly="item.disabled"
                />
              </div>
              <div v-else-if="item.type && index === 2">
                <YamlContentOutput :yamlOutPutContent="item.yamlCode" />
              </div>
              <MirrorText
                v-else-if="item.type && !index"
                ref="textarea"
                class="outputYaml"
                v-model:updateVal="item.yamlCode"
                :yamlCode="item.yamlCode"
                :disabled="item.disabled"
              ></MirrorText>
              <div class="baseInfo" v-else>
                <el-form
                  ref="workFlowForm"
                  class=""
                  :model="yamlExpress[0]"
                  :rules="yamlBaseInfoRule"
                  label-position="left"
                >
                  <el-form-item
                    prop="name"
                    :label="$t('semantic.interface_name')"
                  >
                    <el-input
                      v-model="yamlExpress[0].name"
                      :placeholder="$t('semantic.pleaseEnter')"
                      maxlength="20"
                      class="o-validate-input"
                      clearable
                    ></el-input>
                  </el-form-item>
                  <el-form-item
                    prop="description"
                    :label="$t('semantic.interface_introduction')"
                  >
                    <el-input
                      type="textarea"
                      show-word-limit
                      maxlength="150"
                      v-model="yamlExpress[0].description"
                      :placeholder="$t('semantic.pleaseEnter')"
                      class="workFlowDesc o-validate-input"
                      clearable
                    ></el-input>
                  </el-form-item>
                </el-form>
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>
      </template>
      <template #footer>
        <div class="drawerFooter">
          <el-button @click="closeDrawer">{{ $t('main.close') }}</el-button>
          <el-button
            :disabled="infoDisabled"
            type="primary"
            @click="updateNodeYaml"
          >
            {{ $t('semantic.submit') }}
          </el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>
<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue';
import MirrorText from '../codeMirror/mirrorTextArea.vue';
import {
  IconCaretDown,
  IconCaretRight,
  IconCaretUp,
  IconMinimize,
  IconPlusCircle,
} from '@computing/opendesign-icons';
import yaml from 'js-yaml';
import { ElMessage } from 'element-plus';
import MonacoEditor from 'src/components/monaco/MonacoEditor.vue';
import YamlContentOutput from 'src/components/yamloutput/yamlContentOutput.jsx';
import i18n from 'src/i18n';
import { api } from 'src/apis';
import { useRoute } from 'vue-router';
import { opertionListMap } from '../types';
const route = useRoute();
const visible = ref(true);
const yamlInputCode = ref();
const yamlOutputCode = ref();
const yamlNodeName = ref();
const yamlNodeId = ref();
const choicesList = ref<
  Array<{
    is_default: boolean;
    branch_id: string;
    conditions: any[];
    logic: string;
  }>
>([]);
const infoDisabled = ref(true);
const yamlExpress = ref([
  {
    title: 'semantic.baseMessage',
    type: '',
    name: '',
    description: '',
  },
  {
    title: 'app.inputContent',
    type: 'yamlEdit',
    yamlCode: '',
    disabled: false,
  },
  {
    title: 'app.outputContent',
    type: 'yamlEdit',
    yamlCode: '',
    disabled: true,
  },
]);
const yamlBaseInfoRule = ref({
  name: [
    {
      required: true,
      message: i18n.global.t('flow.enterWorkflowName'),
      trigger: 'blur',
    },
  ],
  description: [
    {
      required: true,
      message: i18n.global.t('flow.enterWorkflowDesc'),
      trigger: 'blur',
    },
  ],
});
const activeName = ref([
  yamlExpress.value[0].title,
  yamlExpress.value[1].title,
  yamlExpress.value[2].title,
]);
interface Props {
  yamlContent?: string;
  nodeName?: string;
  nodeDesc?: string;
  nodeId?: string;
  nodeYamlId?: string;
  appId?: string | number;
  flowId?: string;
  getEdges?: any[];
  removeEdges?: (edgeIds: string[]) => void;
}

const props = defineProps<Props>();
const emits = defineEmits(['closeDrawer', 'saveNode']);

const logicObj = {
  and: i18n.global.t('yaml.and'),
  or: i18n.global.t('yaml.or'),
};

const leftOptions = ref<any[]>([]);
const paramoperateList = ref<any[][]>([]);

const handleGroupClick = (item: any, isVisible: boolean, cIndex: number) => {
  item.childVisible = isVisible;
  leftOptions.value.forEach((option) => {
    if (option.stepId === item.stepId) {
      option.visible = isVisible;
    }
  });
};

// 左值选择操作
const onSelectOption = (option: any, index: number, cIndex: number) => {
  const curOption = leftOptions.value.find((op) => {
    return op.paramPath === option;
  });
  // 清空操作符
  choicesList.value[index].conditions[cIndex].operate = null;
  // 清空右值
  choicesList.value[index].conditions[cIndex].right = {
    step_id: null,
    type: null,
    value: null,
    name: null,
  };
  // 重新赋值左值
  let value = curOption.stepId + curOption.pathName;
  choicesList.value[index].conditions[cIndex].left = {
    step_id: curOption.stepId,
    type: curOption.paramType,
    value: value,
    name: curOption.paramPath,
  };
  api
    .queryParameterOperate({ ParamType: curOption.paramType })
    .then((res) => {
      if (paramoperateList.value[index].length < cIndex) {
        paramoperateList.value[index][cIndex] = res?.[1]?.result;
      } else {
        paramoperateList.value[index].push(res?.[1]?.result);
      }
    })
    .catch((err) => [console.error(err)]);
};

// 操作符选择操作
const onSelectOperateOption = (option: any, index: number, cIndex: number) => {
  choicesList.value[index].conditions[cIndex].operate = option;
  const curBindType = paramoperateList.value[index][cIndex].find((op) => {
    return op.operate === option;
  })?.bind_type;
  // 切换当前绑定类型
  choicesList.value[index].conditions[cIndex].right.type = curBindType;
  // 清空右值
  choicesList.value[index].conditions[cIndex].right.value = null;
  choicesList.value[index].conditions[cIndex].right.name = null;
};

// 右值选择操作
const onSelectInputOption = (
  option: any,
  index: number,
  cIndex: number,
  type: string,
) => {
  const targetType = choicesList.value[index].conditions[cIndex].right.type;
  let isValid = true;
  const curOption = leftOptions.value.find((op) => {
    return op.paramPath === option;
  });
  // 类型检查逻辑，两种情况：1输入，2选择
  if (type === 'input') {
    switch (targetType) {
      case 'number':
        isValid = !isNaN(Number(option));
        break;
      case 'boolean':
        isValid =
          option === 'true' ||
          option === 'false' ||
          option === true ||
          option === false;
        break;
      case 'list':
        if (typeof option === 'string') {
          try {
            const parsed = JSON.parse(option);
            isValid = Array.isArray(parsed);
          } catch {
            isValid = false;
          }
        }
        break;
      case 'dict':
        if (typeof option === 'string') {
          try {
            const parsed = JSON.parse(option);
            isValid =
              typeof parsed === 'object' &&
              parsed !== null &&
              !Array.isArray(parsed);
          } catch {
            isValid = false;
          }
        }
        break;
      case 'string':
      default:
        isValid = typeof option === 'string';
        break;
    }
  } else {
    isValid = curOption.paramType === targetType;
  }

  if (isValid) {
    choicesList.value[index].conditions[cIndex].right.name = option;
  } else {
    ElMessage.error(i18n.global.t('yaml.input_type_error'));
    return;
  }

  // 赋值右值信息-选择的情况
  if (curOption?.stepId) {
    choicesList.value[index].conditions[cIndex].right.step_id =
      curOption?.stepId ?? null;
    let value = curOption?.stepId + curOption?.pathName;
    choicesList.value[index].conditions[cIndex].right.value = value ?? null;
  } else {
    // 输入的情况
    choicesList.value[index].conditions[cIndex].right.value = option;
  }
};

watch(
  () => [props.yamlContent, props.nodeName, props.nodeDesc, props.nodeId],
  () => {
    // 这里初始化左边条件选择
    yamlInputCode.value = yaml.dump(props.yamlContent.input_parameters);
    yamlOutputCode.value = yaml.dump(props.yamlContent.output_parameters);
    yamlNodeName.value = props.nodeName;
    yamlNodeId.value = props.nodeId;
    choicesList.value = JSON.parse(
      JSON.stringify(props.yamlContent?.input_parameters?.choices || []),
    ).reverse();
    yamlExpress.value[0].name = props.nodeName;
    yamlExpress.value[0].description = props.nodeDesc;
    yamlExpress.value[1].yamlCode = yaml.dump(
      props.yamlContent.input_parameters,
    );
    yamlExpress.value[2].yamlCode = props.yamlContent.output_parameters;

    // 获取需要处理的 choices（倒序、过滤掉 is_default 为 true 的、只保留有条件的）
    const processedChoices = props.yamlContent.input_parameters.choices
      .slice()
      .reverse()
      .filter((choice) => !choice.is_default && choice.conditions.length > 0);

    // 初始化 paramoperateList.value，为每个需要处理的 choice 预先创建一个空数组
    //    这样后续异步回调中就能通过索引安全地访问和 push
    paramoperateList.value = processedChoices.map(() => []);

    // 如果input_parameters有值，则初始化 左值,paramoperateList选择项添加
    processedChoices.forEach((item, index) => {
      if (!item.is_default) {
        if (item.conditions.length > 0) {
          item.conditions.forEach((conditionItem, conditionIndex) => {
            let paramType = conditionItem.left.type;
            if (paramType) {
              api
                .queryParameterOperate({ ParamType: paramType })
                .then((res) => {
                  paramoperateList.value[index].push(res?.[1]?.result);
                })
                .catch((err) => [console.error(err)]);
            }
          });
        }
      }
    });
  },
  { deep: true, immediate: true },
);
watch(
  () => [yamlExpress.value[0].name, yamlExpress.value[0].description],
  () => {
    if (yamlExpress.value[0].name && yamlExpress.value[0].description) {
      infoDisabled.value = false;
    } else {
      infoDisabled.value = true;
    }
  },
  { deep: true, immediate: true },
);

const handleChange = (payload) => {
  yamlExpress.value[1].yamlCode = payload;
};

const closeDrawer = () => {
  emits('closeDrawer');
};
// 完成yaml更新
const updateNodeYaml = () => {
  let transResult;
  let choiceHasEmpty = false;
  try {
    if (yamlNodeId.value === 'Choice') {
      choicesList.value.forEach((item) => {
        if (!item.is_default) {
          item.conditions.forEach((condition) => {
            if (
              !condition.left.value ||
              !condition.right.value ||
              !condition.operate
            ) {
              choiceHasEmpty = true;
              return;
            }
          });
        }
      });
    }
    if (yamlNodeId.value === 'Choice' && choiceHasEmpty) {
      ElMessage.error(i18n.global.t('yaml.please_improve_the_conditions'));
      return;
    }
    transResult =
      yamlNodeId.value === 'Choice'
        ? JSON.parse(JSON.stringify(choicesList.value.reverse()))
        : yaml.load(yamlExpress.value[1].yamlCode ?? '');
    // 调用接口并更新--根据id包含更新后的yamlCode, name, desc
    emits(
      'saveNode',
      transResult,
      props.nodeYamlId,
      yamlExpress.value[0].name || '',
      yamlExpress.value[0].description || '',
    );
    closeDrawer();
  } catch (err) {
    ElMessage.error(i18n.global.t('semantic.checkFormat'));
  }
};

const handleAddChoice = () => {
  // 处理 pop() 可能返回 undefined 的情况
  const last =
    choicesList.value.length > 0 ? choicesList.value.pop() : undefined;
  choicesList.value.push({
    is_default: false,
    branch_id: crypto.randomUUID(),
    conditions: [
      {
        operate: '',
        left: { value: '', type: '' },
        right: { value: '', type: 'str.' },
      },
    ],
    logic: 'and',
  });
  if (last !== undefined) {
    choicesList.value.push(last);
  }
  // 新增之后需要push空
  paramoperateList.value.push([]);
};
const handleDelChoice = (index: number, branchItem: any) => {
  // 添加类型注解
  if (choicesList.value.length <= 1) {
    ElMessage.error(i18n.global.t('semantic.choiceMin'));
    return;
  }

  // 删除当前分支的边
  if (props.getEdges) {
    props.getEdges?.forEach((item) => {
      if (item.branchId === branchItem.branch_id && props.removeEdges) {
        props.removeEdges([item.id]);
      }
    });
  }

  choicesList.value.splice(index, 1);
};
const handleAddCondition = (index: number) => {
  // 添加类型注解和边界检查
  if (index >= 0 && index < choicesList.value.length) {
    choicesList.value[index].conditions.push({
      operate: '',
      left: { value: '', type: '' },
      right: { value: '', type: 'str.' },
    });
  }
};
const handleDelCondition = (index: number, cIndex: number) => {
  // 添加类型注解和边界检查
  if (
    index >= 0 &&
    index < choicesList.value.length &&
    choicesList.value[index].conditions.length <= 1
  ) {
    ElMessage.error(i18n.global.t('semantic.conditionMin'));
    return;
  }
  if (
    index >= 0 &&
    index < choicesList.value.length &&
    cIndex >= 0 &&
    cIndex < choicesList.value[index].conditions.length
  ) {
    choicesList.value[index].conditions.splice(cIndex, 1);
  }
};

onMounted(() => {
  // 1、页面加载时，获取Choice节点内参数
  api
    .queryParameter({
      appId: route.query?.appId as string,
      flowId: props.flowId,
      stepId: props.nodeYamlId,
    })
    .then((res) => {
      if (Array.isArray(res[1]?.result)) {
        res[1]?.result?.forEach((item) => {
          leftOptions.value.push({
            stepId: item.stepId,
            name: item.name,
            paramPath: item.name,
            isGroup: true,
            visible: true,
            childVisible: false,
            paramType: item.paramsNode.paramType,
            pathName: `/${item.name}`,
          });
          if (item?.paramsNode?.subParams) {
            item?.paramsNode?.subParams.forEach((param) => {
              leftOptions.value.push({
                ...param,
                name: param.paramName,
                stepId: item.stepId,
                visible: false,
                paramPath: `${item.name}${param.paramPath.replace(/\//, '.')}`,
                pathName: param.paramPath,
              });
            });
          }
        });
      }
    })
    .catch((err) => {
      console.error('Error fetching parameters:', err);
      leftOptions.value = [];
    });
});
</script>

<style lang="scss" scoped>
:deep(.el-collapse-item__arrow .is-active) {
  top: 0px !important;
}
:deep(.el-collapse-item) {
  margin-top: 0px;
}
:deep(.el-drawer__header) {
  padding: 24px 24px 16px !important;
  margin-bottom: 0px;
}
.yamlMonacoEditor {
  height: 400px;
}
:deep(.el-drawer__body) {
  padding: 0px 24px 16px !important;
  .drawerBody {
    height: 100%;
    .yamlContent {
      .el-collapse-item__header {
        padding: 0;
        height: 22px;
        line-height: 22px;
        margin-bottom: 8px;
        font-size: 14px;
        display: flex;
        gap: 4px;
        span {
          color: var(--o-text-color-primary);
        }
      }
      .el-collapse-item__content {
        margin-left: 20px;
        .cm-editor {
          .cm-lineNumbers {
            .cm-gutterElement {
              min-width: 31px;
              padding-left: 0 0 0 9px;
              text-align: center;
            }
          }
          .cm-foldGutter {
            padding-left: 0;
          }
        }
        .baseInfo {
          .el-form {
            margin-top: 0px;
          }
          .el-form-item {
            display: flex;
            gap: 24px;
            .el-form-item__label {
              margin-left: -8px;
              padding-right: 0px;
            }
            .el-form-item__content {
              flex: 1;
              .el-textarea__inner {
                height: 56px;
              }
            }
          }
        }
      }
    }
    textarea {
      width: 100%;
      height: 100%;
    }
    .yamlChoiceContainer {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 500px;

      .yamlChoiceItem {
        background-color: var(--o-bg-color-light);
        padding: 16px;
        border-radius: 4px;
        .yamlChoiceItemTitle {
          font-weight: 500;
          font-size: 14px;
          color: var(--o-text-color-primary);
          line-height: 24px;
          display: flex;
          justify-content: space-between;
        }
        .yamlChoiceItemContent {
          display: flex;
          align-items: center;
          gap: 8px;
          .yamlChoiceItemLogic {
            .yamlChoiceItemLogicSelect {
              max-width: 100px;
            }
          }
          .yamlConditionContainer {
            display: flex;
            flex-direction: column;
            gap: 8px;
            .yamlConditionItem {
              display: flex;
              align-items: center;
              gap: 8px;
              width: 100%;
              .el-select__wrapper {
                padding: 0 8px;
              }
              .yamlConditionOperateSelect {
                max-width: 100px;
              }
              .yamlConditionValue {
                display: flex;
                flex-direction: column;
                gap: 8px;
                position: relative;
                .yamlConditionLeft {
                }
                .yamlConditionRight {
                  display: flex;
                  .yamlConditionRightType {
                    text-align: center;
                    display: inline-block;
                    width: 87px;
                    height: 32px;
                    padding: 8px;
                    border: 1px solid var(--o-border-color-lighter);
                    border-radius: 4px 0 0 4px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                  }
                  .yamlConditionRightSelect {
                    .el-input__wrapper {
                      border-radius: 0;
                    }
                    .rightSelect {
                      width: 50px !important;
                      .el-select__selection {
                        display: none;
                      }
                      .el-select__wrapper {
                        width: 50px;
                      }
                    }
                  }
                }
              }
            }
          }
        }
        .addCondition {
          margin-left: 110px;
          margin-top: 16px;
        }
      }
    }
  }
}
.leftOption {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  .arrowIcon {
    .el-icon {
      cursor: pointer;
    }
  }
  .paramType {
    background-color: var(--o-border-color-base);
    color: var(--o-text-color-tertiary);
    padding: 0 8px;
    line-height: 16px;
    font-size: 12px;
    border-radius: 2px;
    margin-left: 4px;
  }
}

.option-container {
  min-width: 200px;
  .el-popper .is-disabled,
  .el-popper .is-disabled,
  .el-select-dropdown__item.is-disabled,
  .el-select-dropdown__item.is-disabled:hover {
    background-color: var(--o-select-dropdown-bg-color) !important;
    color: var(--o-text-color-primary) !important;
  }
}

.submenu {
  position: absolute;
  top: 38px;
  left: 280px;
  background-color: var(--o-bg-color-light);
  border: 1px solid var(--o-border-color-lighter);
  border-radius: 4px;
  padding: 8px;
  min-width: 200px;
  z-index: 9000;
}
.delIcon {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 1px solid var(--o-border-color-lighter);
  padding: 4px;
  color: var(--o-text-color-tertiary);
  cursor: pointer;
  &:hover {
    color: #6395fd;
    border-color: #6395fd;
  }
}
.monacoEditorMask {
  .view-lines {
    position: relative;
  }
  .view-lines {
    pointer-events: none;
  }
  .view-lines::after {
    content: '';
    display: block;
    position: absolute;
    width: 100%;
    height: 100%;
    background: #c3cedf;
    opacity: 0.3;
    pointer-events: none;
  }
}
.flowDrawer.el-drawer {
  padding: 0px;
  background-color: var(--o-bg-color-base);
  top: 48px;
  width: 700px !important;
  height: calc(100% - 48px);
  .el-drawer__header {
    font-weight: 700;
    padding: 24px 24px 8px !important;
    margin-bottom: 0px;
    .drawerHeader {
      width: 100%;
      height: 24px;
      line-height: 24px;
      font-weight: 700;
      font-size: 16px;
      color: var(--o-text-color-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
  .el-drawer__footer {
    box-shadow: 0px -4px 10px 0px rgba(0, 0, 0, 0.1);
    padding: 0px 24px;
    height: 48px;
    line-height: 47px;
  }
}
</style>

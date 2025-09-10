<script setup lang="ts">
import { ref, watch } from 'vue';
import FlowCode from './FlowCode.vue';
import ParamsModel from './ParamsModel.vue';
import { StatusInfoTitle } from '@/views/createapp/components/types';
import { getCookie } from '@/apis/tools';
import { useSessionStore } from '@/store';
import i18n from 'src/i18n';
const { t } = i18n.global;

const { sendQuestion } = useSessionStore();
const props = withDefaults(
  defineProps<{
    flowdata: any;
    // isWorkFlowDebug用于判断是否是工作流的
    isWorkFlowDebug: boolean | undefined;
  }>(),
  {},
);
const contents = ref();
const exData = ref(<any>[]);
const exParam = ref(<any>[]);
const paramIndex = ref(0);
const taskId = ref();
const totalTime = ref(0);
const paramsModelVisible = ref(false);
if (props.flowdata) {
  contents.value = [props.flowdata];

  if (props.flowdata.data[0]) {
    for (const item of props.flowdata.data[0]) {
      if (item && item?.data.exData) {
        if (item.data.exData.reason) {
        } else if (item.data.exData.message) {
          exParam.value.push(item.data.exData);
        }
      }
      if (item && item?.data.exParam) {
        exParam.value.push(item.data.exParam);
      }
    }
  }
}

const activeNames = ref([contents.value[0].id]);
const secondCollapseActiveName = ref<number[]>([]);
function getRiskType(risk) {
  const mapping = {
    low: 'warning',
  };
  return mapping[risk] || 'warning';
}

const doFlow = async (type) => {
  if (taskId) {
    exData.value.pop();
    taskId.value = null;
    let content = '';
    await sendQuestion(
      undefined,
      content,
      undefined,
      undefined,
      undefined,
      undefined,
      { params: type },
      null,
      'wait',
    );
  }
};

const showParams = (index) => {
  paramsModelVisible.value = true;
  paramIndex.value = index;
};
const doParams = async (params) => {
  let description = params.description;
  delete params.description;
  let newParams = { content: params, description: description };
  if (taskId) {
    taskId.value = null;
    let content = '';
    await sendQuestion(
      undefined,
      content,
      undefined,
      undefined,
      undefined,
      undefined,
      newParams,
      null,
      'params',
    );
    exParam.value[paramIndex.value].status = true;
  }
};

watch(
  () => props,
  () => {
    if (props.isWorkFlowDebug) {
      totalTime.value = 0; // 清空
      // 将每阶段节点耗时累加
      props.flowdata?.data[0].forEach((item) => {
        totalTime.value += item.costTime || 0;
      });
    }
    if (props.flowdata?.taskId) {
      if (props.flowdata?.data.exParam) {
        exParam.value.push(props.flowdata?.data.exParam);
      } else {
        exData.value.push(props.flowdata?.data.exData);
      }
      taskId.value = props.flowdata?.taskId;
    } else {
      let newContentList = props.flowdata?.data;
      for (const newContent of newContentList) {
        if (!(newContent instanceof Array)) {
          continue;
        }
        for (const item of newContent) {
          let input = item.data.input;
          const isDuplicate = contents.value[0].data[0].some(
            (it) => it.id === item.id,
          );
          if (!isDuplicate && input) {
            contents.value[0].data[0].push(item);
          }
        }
      }
    }
  },
  { deep: true, immediate: true },
);
</script>

<template>
  <div
    class="demo-collapse"
    :class="{
      'border-blue': ['running', 'waiting'].includes(props.flowdata.status),
      'border-green': props.flowdata.status === 'success',
      'border-red': props.flowdata.status === 'error',
      'border-grey': props.flowdata.status === 'cancelled',
    }"
  >
    <section>
      <el-collapse v-model="activeNames" class="o-hpc-collapse" accordion>
        <el-collapse-item
          v-for="item in contents"
          class="title"
          :key="item.id"
          :name="item.id"
        >
          <template #title>
            <div class="loading">
              <img
                v-if="['running', 'waiting'].includes(props.flowdata.status)"
                src="@/assets/images/loading.png"
                alt=""
                class="loading-animeIcon"
              />
              <div class="loading-icon-box">
                <el-icon
                  class="loading-title-icon"
                  v-if="props.flowdata.status === 'success'"
                >
                  <IconSuccess />
                </el-icon>
              </div>
              <img
                v-if="props.flowdata.status === 'cancelled'"
                src="@/assets/svgs/warning.svg"
                alt=""
              />
              <div class="loading-icon-box">
                <el-icon
                  class="loading-title-icon"
                  v-if="props.flowdata.status === 'error'"
                >
                  <IconError />
                </el-icon>
              </div>
              <div v-if="!props.isWorkFlowDebug" class="loading-text">
                {{ props.flowdata.title }}
              </div>
              <div v-else class="loading-text">
                <div class="textTitle">
                  {{ $t(`flow.${StatusInfoTitle[props.flowdata.status]}`) }}
                </div>
                <div
                  v-if="
                    props.flowdata.status === 'success' ||
                    props.flowdata.status === 'error'
                  "
                  :class="`${props.flowdata.status}Bg`"
                  class="totalTime"
                >
                  {{ totalTime?.toFixed(3) }}s
                </div>
              </div>
              <div class="loading-progress">{{ props.flowdata.progress }}</div>
            </div>
          </template>
          <template #icon="{ isActive }">
            <el-icon
              class="el-collapse-item__arrow"
              :class="{ 'is-active': activeNames.includes(item.id) }"
            >
              <img
                src="@/assets/images/flow_arrow.png"
                alt=""
                class="o-collapse-icon"
              />
            </el-icon>
          </template>
          <template v-for="(p, $index) in item.data" :key="p.id">
            <div v-if="!Array.isArray(p)" class="o-collapse-content">
              {{ p }}
            </div>
            <el-collapse
              v-else
              v-model="secondCollapseActiveName"
              class="o-nest-collapse"
            >
              <el-collapse-item
                class="o-collapse-item normal"
                v-for="secItem in p"
                :key="secItem.id"
                :title="secItem.title"
                :name="secItem.id"
              >
                <template #title>
                  <div class="loading">
                    <img
                      v-if="['running', 'waiting'].includes(secItem.status)"
                      src="@/assets/images/loading.png"
                      alt=""
                      class="loading-animeIcon"
                    />
                    <div class="loading-icon-box">
                      <el-icon
                        class="loading-icon"
                        v-if="secItem.status === 'success'"
                      >
                        <IconSuccess />
                      </el-icon>
                    </div>
                    <div class="loading-icon-box">
                      <el-icon
                        class="loading-icon"
                        v-if="secItem.status === 'error'"
                      >
                        <IconError />
                      </el-icon>
                    </div>
                    <span class="title">{{ secItem.title }}</span>
                    <div v-if="secItem.costTime" class="time">
                      <span :class="`${secItem.status}Bg`">
                        {{ secItem.costTime.toFixed(3) }}s
                      </span>
                    </div>
                  </div>
                </template>
                <template #icon="{ isActive }">
                  <el-icon
                    class="el-collapse-item__arrow"
                    :class="{ 'is-active': activeNames.includes(item.id) }"
                  >
                    <img
                      src="@/assets/images/flow_arrow.png"
                      alt=""
                      class="o-collapse-icon"
                    />
                  </el-icon>
                </template>
                <div
                  v-for="(desc, index) in secItem.data"
                  :key="index"
                  class="o-collapse-content"
                >
                  <div class="code-bar">
                    <FlowCode :code="desc" :title="index" :disabled="true" />
                  </div>
                </div>
              </el-collapse-item>
            </el-collapse>
          </template>
        </el-collapse-item>
      </el-collapse>
      <div style="margin: 0px 16px;">
        <el-alert
          class="wait-div"
          v-for="(item, index) in exData"
          :key="index"
          :title="t('flow.flow_risk')"
          :type="getRiskType(item?.risk)"
          :description="item?.reason"
          show-icon
          :closable="false"
          style="background: #FBF6E5;"
        />
        <div class="flow-button" v-if="taskId && exData">
          <el-button @click="doFlow(false)">
            {{ t('common.cancel') }}
          </el-button>
          <el-button type="primary" @click="doFlow(true)">
            {{ t('common.confirm') }}
          </el-button>
        </div>
      </div>
      <div class="flow-paramas">
        <el-text v-for="(item, index) in exParam" :key="index">
          {{ item.message }}
          <span v-if="taskId && exParam && !item?.status">
            <el-button @click="showParams(index)" text>
              {{ t('flow.parameterConfiguration') }}
            </el-button>
          </span>
        </el-text>
      </div>
      <ParamsModel
        v-model:visible="paramsModelVisible"
        :item="exParam[0]"
        :title="$t('flow.parameterConfiguration')"
        @do-params="doParams"
      />
    </section>
  </div>
</template>
<style lang="scss" scoped>
:deep(.el-collapse-item__content) {
  margin: 0px 16px 0px 0px !important;
}
</style>

<style lang="scss" scope>
.flow-paramas {
  display: grid;
  margin: 8px;
}
.wait-div {
  margin-top: 16px;
}
.flow-button {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
.el-collapse-item:last-child {
  margin-bottom: 0px;
}
.demo-collapse.border-blue .title .el-collapse-item__header:first-child {
  background: var(--flow-running-bg);
  border-radius: 0px !important;
}
.demo-collapse.border-red .title .el-collapse-item__header:first-child {
  background-color: rgb(247, 193, 193);
  border-radius: 0px !important;
}
.demo-collapse.border-green .title .el-collapse-item__header:first-child {
  background-color: rgb(194, 231, 199);
  border-radius: 0px !important;
}
.demo-collapse.border-grey .title .el-collapse-item__header:first-child {
  background-color: rgb(208, 211, 216);
  border-radius: 0px !important;
}
.o-collapse-icon {
  align-self: center;
  padding: 0px;
  margin-left: 0px;
  margin-right: 8px;
}

.o-collapse-content:hover {
  background-color: var(--o-bg-color-light);
}
.normal {
  border-bottom: 1px dashed var(--o-border-color-lighter) !important;
  .el-collapse-item__header {
    padding-left: 8px;
    height: 40px;
    line-height: 40px;
    font-size: 14px;
    color: #303133;
    cursor: pointer;
  }
  .el-collapse-item__header::after {
    background-color: var(--o-bg-color-light2) !important;
  }
}
.o-nest-collapse {
  .el-collapse-item:last-child {
    border-bottom: none !important;
  }
}
.title {
  .el-collapse-item__wrap {
    background-color: var(--o-bg-color-light2);
  }
  .el-collapse-item__header {
    padding-left: 8px;
    height: 40px;
    line-height: 40px;
    font-size: 14px;
    color: var(--o-text-color-primary);
    cursor: pointer;
    position: relative;
  }
  .el-collapse-item + .el-collapse-item {
    margin-top: 0px;
  }
  .el-collapse-item__arrow.is-active {
    transform: rotate(90deg);
  }
}
.el-collapse-item__arrow.is-active {
  transform: rotate(90deg);
}
.el-collapse-item__arrow {
  margin: 0px;
}
.loading-progress {
  margin-right: 8px;
  padding-right: 8px;
}
.loading-icon-box {
  align-content: center;
  .loading-icon {
    width: 21px;
    height: auto;
    display: block;
    svg {
      width: 14px;
      height: 14px;
    }
  }
  .loading-title-icon {
    width: 24px;
    height: 24px;
    display: block;
    margin-right: 12px;
    svg {
      width: 21px;
      height: 21px;
    }
  }
}

.border-grey {
  border: 1px solid #d0d3d8;
}

.border-red {
  border: 1px solid #f7c1c1;
}

.border-green {
  border: 1px solid #c2e7c7;
}

.border-blue {
  border: 1px solid transparent;
  border-radius: 4px;
  background: linear-gradient(white, white) padding-box,
    linear-gradient(180deg, #6c77fa, #6db9f9) border-box;
}
.demo-collapse {
  margin-bottom: 16px;
  width: 100%;
  height: auto;
  border-radius: 4px !important;
  :deep(.el-collapse-item__wragop) {
    margin-top: 12px !important;
    margin-bottom: 2px !important;
  }
  :deep(.el-collapse-item__content) {
    margin: 0px 16px 16px 0px !important;
  }
}
.loading {
  display: flex;
  height: auto;
  width: 100%;
  background-color: linear-gradient(
    127.95deg,
    rgba(109, 227, 250, 0.2) -1.967%,
    rgba(90, 179, 255, 0.2) 98.202%
  );
  border-radius: 8px;
  border-top-left-radius: 0px;
  margin-left: 8px;
  flex-wrap: nowrap; /* 水平排列 */
  @keyframes rotate-img {
    from {
      transform: rotate(0);
    }

    to {
      transform: rotate(360deg);
    }
  }

  &-animeIcon {
    margin-right: 8px;
    width: 21px;
    height: 21px;
    align-items: center;
    align-self: center;
    animation: rotate-img 1s infinite linear;
  }

  &-icon {
    align-items: center;
    align-self: center;
    width: 24px;
    height: 24px;
    margin-right: 8px;
  }

  &-text {
    font-size: 16px;
    width: 100%;
    display: flex;
    align-items: center;
    align-self: center;
    justify-content: space-between;
    color: var(--o-text-color-primary);
  }
  .time {
    padding: 0px 12px;
    margin-left: auto;
    span {
      padding: 0px 4px;
      border-radius: 4px;
      min-width: 44px;
      width: fit-content;
      border-radius: 4px;
      font-size: 12px;
    }
  }
}
.totalTime {
  min-width: 54px;
  width: fit-content;
  padding: 0px 8px;
  height: 16px;
  line-height: 16px;
  font-size: 12px;
  border-radius: 4px;
}
.totalTime.errorBg {
  background-color: rgba(227, 32, 32, 0.2);
}
.totalTime.cancelledBg {
  background-color: rgba(208, 211, 216, 0.2);
}
</style>

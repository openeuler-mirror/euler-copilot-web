<script setup lang="ts">
import { ref, watch } from 'vue';
import FlowCode from './FlowCode.vue';
import { StatusInfoTitle } from '@/views/createapp/components/types';

const props = withDefaults(
  defineProps<{
    flowdata: any;
    // isWorkFlowDebug用于判断是否是工作流的
    isWorkFlowDebug: boolean | undefined;
  }>(),
  {},
);
const contents = ref();
const totalTime = ref(0);
if (props.flowdata) {
  contents.value = [props.flowdata];
}

const activeNames = ref([contents.value[0].id]);
const secondCollapseActiveName = ref<number[]>([]);

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
  },
  { deep: true, immediate: true },
);
</script>

<template>
  <div
    class="demo-collapse"
    :class="{
      'border-blue': props.flowdata.status === 'running',
      'border-green': props.flowdata.status === 'success',
      'border-red': props.flowdata.status === 'error',
    }"
  >
    <section>
      <el-collapse v-model="activeNames" class="o-hpc-collapse">
        <el-collapse-item
          v-for="item in contents"
          class="title"
          :key="item.id"
          :name="item.id"
        >
          <template #title>
            <div class="loading">
              <img
                v-if="props.flowdata.status === 'running'"
                src="@/assets/images/loading.png"
                alt=""
                class="loading-animeIcon"
              />
              <img
                v-if="props.flowdata.status === 'success'"
                src="@/assets/images/flow_success.png"
                alt=""
                class="loading-icon"
              />
              <img
                v-if="props.flowdata.status === 'error'"
                src="@/assets/images/flow_fail.png"
                alt=""
                class="loading-icon"
              />
              <div v-if="!props.isWorkFlowDebug" class="loading-text">
                {{ props.flowdata.title }}
              </div>
              <div v-else class="loading-text">
                <div class="textTitle">
                  {{ StatusInfoTitle[props.flowdata.status] }}
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
          <template
            v-for="(p, $index) in item.data"
            :key="$index"
            class="6645ds"
          >
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
                :name="secItem.id"
              >
                <template #title>
                  <div class="loading">
                    <img
                      v-if="secItem.status === 'running'"
                      src="@/assets/images/loading.png"
                      alt=""
                      class="loading-animeIcon"
                    />
                    <img
                      v-if="secItem.status === 'success'"
                      src="@/assets/images/flow_success.png"
                      alt=""
                      class="loading-icon"
                    />
                    <img
                      v-if="secItem.status === 'error'"
                      src="@/assets/images/flow_fail.png"
                      alt=""
                      class="loading-icon"
                    />
                    <span class="title">{{ secItem.title }}</span>
                    <div v-if="secItem.costTime"
                      class="time"
                      >
                    <span :class="`${secItem.status}Bg`"
                    >
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
    </section>
  </div>
</template>
<style lang="scss" scoped>
:deep(.el-collapse-item__content){
  margin: 0px 16px 0px 0px !important;
}
</style>

<style lang="scss">

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
    top: 3px;
    padding-left: 3px;
  }
}
.el-collapse-item__arrow.is-active {
  transform: rotate(90deg);
  top: 3px;
  padding-left: 3px;
}
.el-collapse-item__arrow {
  margin: 0px;
}
.loading-progress {
  margin-right: 8px;
  padding-right: 8px;
}

.border-red {
  border: 1px solid red;
}

.border-green {
  border: 1px solid green;
}

.border-blue {
  border: 1px solid rgba(109, 117, 250, 0.2);
}
.demo-collapse {
  margin-bottom: 24px;
  width: 100%;
  height: auto;
  border-radius: 0px 0px 4px 4px;
  border: 1px solid var(--o-border-color-base);
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
    width: 24px;
    height: 24px;
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
    span{
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
  padding: 0px 8px;
  margin-left: auto;
}
::v-deep(.demo-collapse) {
        border-radius: 4px;
        .title.el-collapse-item {
          .loading-text {
            display: flex;
            text-align: left;
            align-items: center;
            .textTitle {
              flex: 1;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
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
          }
        }
        .normal.el-collapse-item {
          border-bottom: 1px dashed #dfe5ef;
          .el-collapse-item__header {
            background-color: var(--o-bg-color-base) !important;
            color: var(--o-text-color-primary);
            padding-right: 0px;
            .o-collapse-icon {
              width: 16px;
              height: 16px;
            }
            .title {
              flex: 1;
              text-align: left;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            &::after {
              background-color: transparent;
            }
          }
          &:last-child {
            border-bottom: 1px solid transparent !important;
          }
        }
      }
</style>

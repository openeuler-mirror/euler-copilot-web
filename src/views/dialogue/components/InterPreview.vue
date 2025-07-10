<template>
  <div class="interPreviewBox">
    <div v-if="interPreviewInfo?.name?.length" class="preTop">
      <div class="preTopContent">
        <img src="@/assets/svgs/myApp.svg" class="preTitleIcon" />
        <div class="preMainAppName">
          {{ interPreviewInfo.name }}
        </div>
      </div>
      <div
        v-if="interPreviewInfo.mcps && interPreviewInfo.mcps.length"
        class="mcp-list"
      >
        MCP服务
        <img
          class="mcp-item"
          v-for="mcp in interPreviewInfo.mcps"
          :key="mcp.mcpserviceId"
          :src="mcp.icon"
          alt=""
        />
      </div>
    </div>
    <div class="preMain">
      <div class="preMainContanter">
        <div class="preMainImg" v-if="interPreviewInfo?.name?.length">
          <img
            :src="interPreviewInfo.icon"
            class="preMainAvator"
            v-if="interPreviewInfo.icon.length"
          />
          <div v-else class="defaultIconNoCamera"></div>
        </div>
        <div
          class="preMainContent"
          v-if="
            interPreviewInfo.name.length ||
            interPreviewInfo.description.length ||
            connectLinkList.length
          "
        >
          <div class="preMainContentTitle" v-if="interPreviewInfo.name.length">
            <div class="greetDes">
              <div class="greetDesContent">
                {{ $t('main.describe1') }}
                <p class="greetDesAppName greetDesContent">
                  {{ interPreviewInfo.name }}
                </p>
                {{ $t('main.describe2') }}
              </div>
            </div>
          </div>
          <div
            class="preMainContentDes"
            v-if="interPreviewInfo.description.length"
          >
            {{ interPreviewInfo.description }}
          </div>
          <div class="preMainContentLink" v-if="connectLinkList.length">
            <el-badge :value="connectLinkList.length" class="linkBadge">
              <div class="contentLinkTitle">相关链接</div>
            </el-badge>
            <div class="connectBox">
              <div v-for="(connect, index) in connectLinkList" :key="index">
                <div v-if="connect.length" class="connectCard">
                  <div class="connectBoxIndex">{{ index + 1 }}</div>
                  <el-link
                    class="connectBoxContent"
                    v-if="!createApp"
                    type="primary"
                    :href="connect"
                    target="_blank"
                  >
                    <TextMoreTootip :value="connect" :row="1" />
                  </el-link>
                  <el-link class="connectBoxContent" v-else type="primary">
                    <TextMoreTootip :value="connect" :row="1" />
                  </el-link>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="preFooter" v-if="recommendQuestionList.length">
          <div class="preFooterTitle">推荐问题：</div>
          <div class="preFooterContent">
            <div v-for="(ques, idx) in recommendQuestionList" :key="idx">
              <div
                class="preFooterContentQues"
                v-if="ques.length"
                @click="selectQuestions"
              >
                <TextMoreTootip :value="ques" :row="1" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue';
import TextMoreTootip from '@/components/textMoreTootip/index.vue';
interface InterPreProps {
  createAppForm: any;
  createApp: boolean;
}
const props = withDefaults(defineProps<InterPreProps>(), {});
const interPreviewInfo = ref();
const recommendQuestionList = ref<any>([]);
const connectLinkList = ref<any>([]);
const emit = defineEmits(['selectQuestion']);

const selectQuestions = (event) => {
  if (props.createApp) {
    return;
  }
  emit('selectQuestion', event.target.innerText);
};

watch(
  () => props.createAppForm,
  () => {
    interPreviewInfo.value = props.createAppForm;

    if (props.createAppForm.links) {
      connectLinkList.value = props.createAppForm.links.filter(
        (item) => item.length,
      );
    }
    if (props.createAppForm.recommendedQuestions) {
      recommendQuestionList.value =
        props.createAppForm?.recommendedQuestions?.filter(
          (item) => item.length,
        );
    }
  },
  {
    immediate: true,
    deep: true,
  },
);
</script>
<style lang="scss" scoped>
.interPreviewBox {
  display: flex;
  flex: auto;
  width: 100%;
  gap: 32px;
  flex-direction: column;
  .preTop {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    margin-top: 64px;

    .mcp-list {
      position: absolute;
      right: 103px;
      font-size: 12px;
      display: flex;
      align-items: center;
      color: var(--o-text-color-tertiary);

      .mcp-item {
        width: 24px;
        height: 24px;
        margin-left: 8px;
        border-radius: 50%;
      }
    }

    .preTopContent {
      display: flex;
      align-items: center;
      height: 40px;
      padding: 8px;
      border-radius: 20px;
      gap: 8px;
      background: linear-gradient(
        122.39deg,
        rgba(109, 117, 250, 0.2) -20.158%,
        rgba(90, 179, 255, 0.2) 112.459%
      );
      .preTitleIcon {
        width: 32px;
        height: 32px;
      }
      .preMainAppName {
        font-size: 16px;
        margin-right: 8px;
        line-height: 24px;
        color: var(--o-text-color-primary);
        font-weight: 700;
      }
    }
  }

  .preMain {
    display: flex;
    justify-content: center;
    align-items: flex-start;

    .preMainContanter {
      width: calc(100% - 176px);
      max-width: 1000px;
      min-width: 806px;
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 16px;

      .preMainImg {
        width: 46px;
        height: 46px;
        border-radius: 50%;
        position: absolute;
        left: -62px;
        top: 0;
        .preMainAvator {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background-size: contain;
        }
        .defaultIconNoCamera {
          width: 100%;
          height: 100%;
          background: url('@/assets/svgs/dark_user.svg');
          background-size: contain !important;
          &:hover {
            background: url('@/assets/svgs/light_user.svg');
          }
        }
      }

      .preMainContent {
        width: 100%;
        padding: 24px;
        background-color: var(--o-bg-color-base);
        border-radius: 0px 8px 8px;
        .preMainContentTitle {
          display: flex;
          flex-direction: column;
          gap: 8px;
          border-bottom: 1px solid var(--o-time-text);
          .greetDes {
            display: flex;
            margin-bottom: 8px;
            .greetDesContent {
              font-size: 24px;
              font-weight: 700;
              line-height: 32px;
              color: var(--o-text-color-primary);
            }
            .greetDesAppName {
              display: inline-block;
              color: #6c77fa;
            }
          }
          .preAppUser {
            display: flex;
            gap: 16px;
            margin-bottom: 8px;
          }
        }
        .preMainContentDes {
          font-size: 16px;
          line-height: 24px;
          margin-top: 8px;
          color: var(--o-text-color-secondary);
        }
        .preMainContentLink {
          .contentLinkTitle {
            color: var(--o-text-color-primary);
            font-size: 16px;
            line-height: 24px;
            padding-bottom: 8px;
          }
          ::v-deep(.linkBadge) {
            .el-badge__content {
              right: -4px;
              top: 4px;
              width: 16px;
              height: 16px;
              background-color: #e32020 !important;
            }
          }

          .connectBox {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            flex-direction: column;
            .connectCard {
              display: flex;
              height: 32px;
              align-items: center;
              background: rgba(99, 149, 253, 0.1);
              padding: 0 8px 0 4px;
              border-radius: 20px;
              gap: 6px;
              width: fit-content;
              .connectBoxIndex {
                width: 24px;
                height: 24px;
                border-radius: 50%;
                text-align: center;
                line-height: 24px;
                font-size: 14px;
                color: var(--o-text-color-primary);
                background: var(--o-bg-color-base);
              }
              .connectBoxContent {
                display: block;
                font-size: 14px;
                padding-right: 8px;
                cursor: pointer;
                font-weight: 400;
                .vue-text {
                  color: #6395fd;
                }
              }
            }
          }
        }
      }
      .preFooter {
        width: 100%;
        display: flex;
        gap: 8px;
        height: 32px;
        align-items: center;
        .preFooterTitle {
          font-size: 12px;
          line-height: 14px;
          color: var(--o-text-color-secondary);
        }
        .preFooterContent {
          display: flex;
          gap: 8px;
          .preFooterContentQues {
            max-width: 240px;
            border-radius: 8px;
            padding: 8px 16px;
            background-color: var(--o-bg-color-base);
            .vue-text {
              font-size: 12px;
              color: var(--o-question-color);
            }
          }
        }
      }
    }
  }
}

.contentCollect {
  width: 24px;
  height: 24px;
  background-color: var(--o-bg-color-light);
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  svg {
    width: 16px;
    height: 16px;
    path {
      fill: var(--o-text-color-tertiary);
    }
  }
}
</style>

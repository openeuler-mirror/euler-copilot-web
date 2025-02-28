<template>
  <div class="interPreviewBox">
    <div v-if="interPreviewInfo?.name?.length" class="preTop">
      <div class="preTopContent">
        <img src="@/assets/images/preTitleIcon.png" class="preTitleIcon" />
        <div class="preMainAppName">
          {{ interPreviewInfo.name }}
        </div>
      </div>
    </div>
    <div class="preMain">
      <div class="preMainImg" v-if="interPreviewInfo?.name?.length">
        <img :src="interPreviewInfo.icon" class="preMainAvator" v-if="interPreviewInfo.icon.length" />
        <img src="@/assets/images/app_upload.svg" class="preMainAvator" v-else />
      </div>
      <div class="preMainContanter">
        <div
          class="preMainContent"
          v-if="interPreviewInfo.name.length || interPreviewInfo.description.length || connnectLinkList.length"
        >
          <div class="preMainContentTitle" v-if="interPreviewInfo.name.length">
            <div class="greetDes">
              <div class="greetDesContent">你好，我是
              <p class="greetDesAppName greetDesContent">
                {{ interPreviewInfo.name }}
              </p>
              ，很高兴为你服务</div>
            </div>
          </div>
          <div class="preMainContentDes" v-if="interPreviewInfo.description.length">
            {{ interPreviewInfo.description }}
          </div>
          <div class="preMainContentLink" v-if="connnectLinkList.length">
            <el-badge :value="connnectLinkList.length" class="linkBadge">
              <div class="contentLinkTitle">相关链接</div>
            </el-badge>
            <div class="connectBox">
              <div v-for="(connect, index) in connnectLinkList" >
                <div v-if="connect.length" class="connectCard">
                  <div class="connectBoxIndex">{{ index + 1 }}</div>
                  <el-link class="connectBoxContent" v-if="!createApp" type="primary" :href="connect" target="_blank">
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
            <div v-for="ques in recommendQuestionList">
              <div class="preFooterContentQues" v-if="ques.length" @click="selectQuestions">
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
const recommendQuestionList = ref();
const connnectLinkList = ref<any>([]);
const emit = defineEmits(['selectQuestion']);

const selectQuestions = (event) => {
  if(props.createApp){
    return;
  }
  emit('selectQuestion', event.target.innerText);
}

watch(
  () => props.createAppForm,
  (newValue, oldValue) => {
    interPreviewInfo.value = props.createAppForm;
    connnectLinkList.value = props.createAppForm?.links?.filter(item => item.length);
    recommendQuestionList.value = props.createAppForm?.recommendedQuestions?.filter(item => item.length);
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
    margin-top: 12px;
    width: 100%;
    gap: 32px;
    flex-direction: column;
    .preTop {
      width: 100%;
      display: flex;
      justify-content: center;

      .preTopContent {
        display: flex;
        align-items: center;
        height: 40px;
        padding: 8px;
        border-radius: 20px;
        gap: 8px;
        background: linear-gradient(122.39deg, rgba(109, 117, 250, 0.2) -20.158%, rgba(90, 179, 255, 0.2) 112.459%);
        .preTitleIcon {
          width: 32px;
          height: 32px;
        }
        .preMainAppName {
          font-size: 16px;
          line-height: 24px;
          color: var(--o-text-color-primary);
          font-weight: 700;
        }
      }
    }

    .preMain {
      padding-left: 40px;
      display: flex;
      gap: 16px;

      .preMainImg {
        width: 46px;
        height: 46px;
        border-radius: 50%;
        .preMainAvator {
          width: 100%;
          height: 100%;
          border-radius: 50%;
        }
      }
      .preMainContanter {
        width: calc(100% - 166px);
        display: flex;
        flex-direction: column;
        gap: 16px;
        .preMainContent {
          width: 100%;
          padding: 24px;
          background-color: var(--o-bg-color-base);
          .preMainContentTitle {
            display: flex;
            flex-direction: column;
            gap: 8px;
            border-bottom: 1px solid var(--o-time-text);
            .greetDes {
              display: flex;
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
            margin-bottom: 20px;
          }
          .preMainContentLink {
            .contentLinkTitle {
              color: var(--o-text-color-primary);
              font-size: 16px;
              line-height: 24px;
            }
            .linkBadge {
              .el-badge__content {
                right: calc(-10px + var(--el-badge-size) / 2);
                top: 4px;
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
                  color: #6395fd;
                  font-size: 14px;
                  cursor: pointer;
                  font-weight: 400;
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
              max-width: 150px;
              border-radius: 8px;
              padding: 8px 16px;
              background-color: var(--o-bg-color-base);
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

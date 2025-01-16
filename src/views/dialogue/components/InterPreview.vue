<template>
  <div class="interPreviewBox">
    <div v-if="interPreviewInfo.appName.length" class="preTop">
      <div class="preTopContent">
        <img src="@/assets/images/preTitleIcon.png" class="preTitleIcon" />
        <div class="preMainAppName">
          {{ interPreviewInfo.appName }}
        </div>
      </div>
    </div>
    <div class="preMain">
      <div class="preMainImg">
        <img :src="interPreviewInfo.icon" class="preMainAvator" v-if="interPreviewInfo.icon.length" />
      </div>
      <div class="preMainContanter">
        <div
          class="preMainContent"
          v-if="interPreviewInfo.appName.length || interPreviewInfo.appIntroduction.length || connnectLinkList.length"
        >
          <div class="preMainContentTitle" v-if="interPreviewInfo.appName.length">
            <div class="greetDes">
              <div class="greetDesContent">你好，我是</div>
              <div class="greetDesAppName greetDesContent">
                {{ interPreviewInfo.appName }}
              </div>
              <div class="greetDesContent">，很高兴为你服务</div>
            </div>
            <div class="preAppUser">
              <div>@zhang</div>
              <div class="contentCollect"><IconUnfavorite /></div>
            </div>
          </div>
          <div class="preMainContentDes" v-if="interPreviewInfo.appIntroduction.length">
            {{ interPreviewInfo.appIntroduction }}
          </div>
          <div class="preMainContentLink" v-if="connnectLinkList.length">
            <el-badge :value="connnectLinkList.length" class="linkBadge">
              <div class="contentLinkTitle">相关链接</div>
            </el-badge>
            <div class="connectBox">
              <div v-for="(connect, index) in connnectLinkList">
                <div v-if="connect.length" class="connectCard">
                  <div class="connectBoxIndex">{{ index + 1 }}</div>
                  <el-link class="connectBoxContent" type="primary" :href="connect">
                    {{ connect }}
                  </el-link>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="preFooter" v-if="recommendQuestionList.length">
          <div class="preFooterTitle">推荐问题：</div>
          <div class="preFooterContent">
            <div v-for="ques in interPreviewInfo.recommendQuestionList">
              <div class="preFooterContentQues" v-if="ques.length">{{ ques }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import '../../styles/InterPreview.scss';
import { ref, watch } from 'vue';
import { IconUnfavorite } from '@computing/opendesign-icons';

interface InterPreProps {
  createAppForm: any;
}
const props = withDefaults(defineProps<InterPreProps>(), {});
const interPreviewInfo = ref();
const recommendQuestionList = ref();
const connnectLinkList = ref<any>([]);
watch(
  () => props.createAppForm,
  (newValue, oldValue) => {
    interPreviewInfo.value = props.createAppForm;
    connnectLinkList.value = props.createAppForm.connectList.filter(item => item.length);
    recommendQuestionList.value = props.createAppForm.recommendQuestionList.filter(item => item.length);
  },
  {
    immediate: true,
    deep: true,
  },
);
</script>

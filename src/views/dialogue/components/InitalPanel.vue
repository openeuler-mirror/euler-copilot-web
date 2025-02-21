<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { EG_LIST } from '../constants';
import { useChangeThemeStore } from 'src/store';
import 'xterm/css/xterm.css';
import router from 'src/router';
const themeStore = useChangeThemeStore();
import { useRoute } from 'vue-router';
import { api } from 'src/apis';

const route = useRoute();
const appName = ref()

const questions = [
  {
    groupId: 0,
    id: 1,
    question: 'open_euler_community_edition_categories',
  },
  {
    groupId: 0,
    id: 2,
    question: 'lts_release_cycle_and_support',
  },
  {
    groupId: 0,
    id: 3,
    question: 'open_euler_pkgship',
  },
  {
    groupId: 0,
    id: 4,
    question: 'container_cloud_platform_solution',
  },
  {
    groupId: 1,
    id: 5,
    question: 'sec_gear_main_functions',
  },
  {
    groupId: 1,
    id: 6,
    question: 'dde_description',
  },
];

const routerToAppCenter = () => {
  router.push('/app');
};

onMounted(() => {
  if (route.query?.id) {
    api
      .querySingleAppData({
        id: route.query?.id as string,
      })
      .then(res => {
        if(res?.[1]?.result?.name){
          appName.value = res?.[1]?.result?.name
        }
      });
  }
});
</script>

<template>
  <div class="dialogue-panel">
    <div class="inital-panel">
      <div class="introduction">
        {{ $t('main.describe1') }}
        <img src="@/assets/images/logo-euler-copilot.png" alt="" v-if="!appName?.length"/>
        <div class="appNameTitle">{{ appName }}</div>
        {{ $t('main.describe2') }}
      </div>
      <p class="inital-panel-tips"></p>
      <div class="container">
        <div class="eg">
          <p>{{ $t('main.left_describe') }}</p>
          <ul class="eg-list">
            <li class="eg-list-item" v-for="item in EG_LIST" :key="item.key" :style="item.style">
              <img v-if="themeStore.theme === 'dark'" :src="item.iconDark" />
              <img v-else :src="item.icon" alt="" />
              <div class="eg-list-item__text">
                <p>{{ $t('main.' + item.key) }}</p>
                <span class="eg-list-item__text-desc">{{ $t('main.' + item.insertMessage) }}</span>
              </div>
            </li>
          </ul>
          <div class="eg-btn">
            <p @click="routerToAppCenter()">进入应用中心</p>
          </div>
        </div>
        <div class="question">
          <p class="title">{{ $t('main.question') }}</p>
          <ul class="question-list">
            <li class="question-item" v-for="item in questions" :key="item.id">
              <span class="question-number" :class="{ blue: item.id <= 3 }">{{ item.id }}</span>
              {{ $t('question.' + item.question) }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.dialogue-shell {
  width: 100%;
  height: 100%;
}

.sidenav {
  height: 100%;
  /* 100% 全高 */
  width: 0;
  /* 0 宽度 - 使用 JavaScript 更改 */
  position: fixed;
  /* 原地不动 */
  z-index: 9900;
  /* 保持在顶部 */
  top: 0;
  /* 保持在顶部 */
  left: 0;
  background-color: #111;
  /* Black*/
  overflow-x: hidden;
  /* 禁用水平滚动 */
  padding-top: 60px;
  /* 将内容从顶部放置 60px */
  // transition: 0.5s; /* 0.5 秒过渡效果在侧导航中滑动 */
}

/* 导航菜单链接 */
.sidenav a {
  padding: 8px 8px 8px 32px;
  text-decoration: none;
  font-size: 25px;
  color: #818181;
  display: block;
  transition: 0.3s;
}

/* 当您将鼠标悬停在导航链接上时，更改它们的颜色 */
.sidenav a:hover {
  color: #f1f1f1;
}

/* 关闭按钮的位置和样式（右上角） */
.sidenav .closebtn {
  position: absolute;
  top: 0;
  right: 25px;
  font-size: 36px;
  margin-left: 50px;
}

.appNameTitle{
  color: #6c77fa;
  font-size: 24px;
  font-weight: 700;
}

.question-list {
  margin-top: 16px;
  li {
    margin-bottom: 16px;
    span {
      margin-right: 3px;
    }
    .blue {
      color: #5ab3ff;
    }
  }
}

.container {
  display: flex;
  justify-content: center;

  .question {
    // display: block;
    width: 492px;
    height: auto;
    box-shadow: 0px 5.18px 20.72px 0px rgba(221, 225, 240, 0.5);
    background: linear-gradient(270deg, rgb(227, 242, 255), rgb(195, 227, 255) 33.232%, rgb(197, 203, 249) 85.699%);
    // opacity: 0.5;
    border-radius: 8px;
    background-size: 100% 100%;
    margin-left: 12px;
    padding: 24px;
    flex-direction: column;
    justify-content: space-between;

    .title {
      width: 263px;
      font-size: 18px;
      color: var(--o-text-color-primary);
      font-weight: bold;
    }

    .dse {
      margin-top: 12px;
      font-size: 14px;
      color: var(--o-text-color-secondary);
    }
  }
}

.inital-panel {
  // background-color: var(--o-bg-color-base);
  background-color: transparent;
  border-radius: 8px;
  padding-top: 64px;
  display: block;
  width: 1000px;

  @media screen and (max-width: 1368px) and (max-height: 768px) {
    padding: 16px 24px 16px 24px;
  }

  .introduction {
    display: flex;
    height: 36px;
    justify-content: center;
    line-height: 36px;
    font-weight: 500;
    font-size: 28px;
    color: var(--o-text-color-primary);
  }

  &-tips {
    margin-top: 24px;
    color: var(--o-text-color-secondary);
    font-size: 20px;
    line-height: 28px;

    @media screen and (max-width: 1368px) and (max-height: 768px) {
      margin-top: 8px;
    }
  }

  .eg {
    background-color: var(--o-bg-color-base);
    padding: 24px;
    border-radius: 8px;
    width: 492px;
    height: 320px;
    p {
      font-size: 16px;
      color: var(--o-text-color-secondary);
    }
    &-btn {
      display: flex;
      position: relative;
      top: 50px;
      p {
        display: block;
        align-self: center;
        position: absolute;
        width: 120px;
        line-height: 32px;
        border-radius: 100px;
        height: 32px;
        background-image: linear-gradient(to right, #6d75fa, #5ab3ff);
        height: 32px;
        color: white;
        text-align: center;
        font-size: 14px;
      }
    }
  }

  .eg-list {
    display: flex;
    width: auto;
    background-color: var(--o-bg-color-base);
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    margin-top: 8px;
    li {
      cursor: text;
    }
    &-item {
      display: flex;
      align-items: center;
      width: calc(50% - 8px);
      height: 80px;
      background: var(--o-bg-color-base);
      margin-top: 8px;
      overflow: hidden;
      border-radius: 8px;
      @media screen and (max-width: 1368px) {
        width: calc(50% - 4px);
        padding: 10px;
      }

      @media screen and (max-height: 768px) {
        width: calc(50% - 4px);
        padding: 10px;
      }

      &:hover {
        cursor: pointer;
      }

      img {
        width: 37px;
        height: 37px;
        margin: 0 6px 0 8px;
      }

      &__text {
        width: 100%;
        display: flex;
        flex-direction: column;
        font-size: 16px;
        font-weight: 700;
        color: var(--o-text-color-primary);
        line-height: 24px;

        &-desc {
          font-size: 12px;
          color: var(--o-text-color-secondary);
          font-weight: 400;
        }
      }

      p {
        font-size: 16px;
        color: var(--o-text-color-primary);
      }
    }
  }
  .eg-btn{
    cursor: pointer;
  }
}
</style>

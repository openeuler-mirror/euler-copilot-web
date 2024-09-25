<script lang="ts" setup>
import { EG_LIST } from '../constants';
import { useChangeThemeStore } from 'src/store';

const themeStore = useChangeThemeStore();

</script>

<template>
  <div class="dialogue-panel">
    <div class="inital-panel">
      <p class="inital-panel-tips">
      </p>
      <div class='container'>
        <div class="eg">
          <ul class="eg-list">
            <li class="eg-list-item" v-for="item in EG_LIST" :key="item.key" :style="item.style">
              <img v-if="themeStore.theme === 'dark'" :src="item.iconDark" />
              <img v-else :src="item.icon" alt="">
              <div class="eg-list-item__text">
                <p>{{ item.title }}</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.dialogue-panel {
  // padding-right: 25px;
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


.container {
  display: flex;
  justify-content: center;
}

.inital-panel {
  // background-color: var(--o-bg-color-base);
  background-color: transparent;
  border-radius: 8px;
  padding-top: 64px;
  display: block;
  width: 100%;
// 
  @media screen and (max-width: 1368px) and (max-height: 768px) {
    padding: 16px 24px 16px 24px;
  }

  .introduction {
    display: flex;
    height: 24px;
    justify-content: center;
    line-height: 24px;
    font-weight: 500;
    font-size: 14px;
    color: var(--o-text-color-primary);

    img{
      height: 24px;
    }
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
    border-radius: 8px;
    p {
      font-size: 12px;
      color: var(--o-text-color-secondary);
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

    li {
      cursor: text;
    }

    &-item {
      display: flex;
      align-items: center;
      width: calc(50% - 8px);
      font-size: 12px;
      // height: 64px;
      background-color: transparent;
      // margin-top: 20px;
      overflow: hidden;

      @media screen and (max-width: 1368px) {
        width: calc(50% - 4px);
        padding: 10px;
      }

      @media screen and (max-height: 768px) {
        width: calc(50% - 4px);
        padding: 10px;
      }

      img {
        width: 28px;
        height: 28px;
        // align-self: baseline;
        // margin-right: 6px;
      }


      &__text {
        width: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        font-size: 12px;
        color: var(--o-text-color-primary);
        line-height: 24px;

        &-desc {
          font-size: 12px;
          color: var(--o-text-color-secondary);
          font-weight: 400;
        }
      }
    }
  }
}
</style>

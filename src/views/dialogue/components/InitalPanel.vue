<script lang="ts" setup>
import { ref } from 'vue';
import { EG_LIST } from '../constants';
import { useChangeThemeStore } from 'src/store';
import 'xterm/css/xterm.css';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { AttachAddon } from 'xterm-addon-attach';
import { successMsg } from 'src/components/Message';
const themeStore = useChangeThemeStore();
const openShell = () => {
  isTermShow.value = true;
  fnChangeShellBox(true);
  document.getElementById('shellView').style.width = 'calc(100% - 48px)';
  document.getElementById('shellView').style.height = 'calc(100% - 104px)';
  document.getElementById('shellView').style.margin = '64px 24px 40px 24px';
  document.getElementById('shellView').style.borderRadius = '8px';
};

const closeShell = () => {
  isTermShow.value = false;
  fnChangeShellBox(false);
  // document.getElementById("shellView").style.width = "0%";
};

let socket = ref(null);
const terminal = ref(null); //绑定dom组件
const fitAddon = new FitAddon();

let term = ref(null);
let termLoading = ref(false);
let isTermShow = ref(false);
const activePane = ref('shell');
const fnChangeShellBox = isShow => {
  if (isShow) {
    if (!socket.value) {
      termLoading.value = true;
      createWs();
    }
  } else {
    // 关闭连接
    if (socket.value) {
      socket.value.close();
      socket.value = null;
    }
    if (term.value) {
      term.value.dispose();
    }
  }
};

const createWs = () => {
  const hostname = window.location.host;
  socket.value = new WebSocket(`wss://${hostname}/api/shell/ws/0`);
  socket.value.onopen = () => {
    termLoading.value = false;
    // socket.value.send(JSON.stringify({
    //   ctrl: 'resize',
    //   data: {
    //     width: 500,
    //   }
    // }));
  };
  socket.value.onclose = () => {
    // console.log('close');
  };
  socket.value.onerror = e => {
    term.value.write(`\x1b[31m${e}\x1b[m\r\n`);
    termLoading.value = false;
  };
  initTerm();
};

const initTerm = () => {
  term.value = new Terminal({
    fontSize: 14,
    cursorBlink: true,
  });
  const attachAddon = new AttachAddon(socket.value);
  term.value.open(terminal.value);
  fitAddon.activate(term.value); // 自适应尺寸
  attachAddon.activate(term.value);

  setTimeout(() => {
    fitAddon.fit();
  }, 5);
  term.value.focus();
  window.onresize = () => {
    fitAddon.fit();
  };
};
</script>

<template>
  <div class="dialogue-panel">
    <div class="inital-panel">
      <div class="introduction">
        {{ $t('main.describe1') }}
        <img src="@/assets/images/logoText.png" alt="" />
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
        </div>
        <div class="shell">
          <p class="title">{{ $t('main.smart_shell') }}</p>
          <div class="dse">
            {{ $t('main.smart_shell_describe') }}
          </div>
        </div>
        <div id="shellView" class="sidenav">
          <a href="" class="closebtn" @click="closeShell()">x</a>
          <div v-show="isTermShow" class="dialogue-shell">
            <div style="height: 100%; width: 100%" ref="terminal" v-loading="termLoading"></div>
          </div>
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

.container {
  display: flex;
  justify-content: center;

  .shell {
    // display: block;
    width: 264px;
    height: auto;
    // background-color: var(--o-bg-color-base);
    background: var(--o-shell-image) no-repeat;
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

    &-btn {
      display: flex;
      height: 100%;
      position: relative;

      // align-items: center;
      p {
        display: block;
        align-self: center;
        position: absolute;
        width: 96px;
        line-height: 32px;
        border-radius: 100px;
        height: 32px;
        background-image: linear-gradient(to right, #6d75fa, #5ab3ff);
        height: 32px;
        align-self: center;
        // margin: 0px 0px 12px 12px;
        color: white;
        bottom: 0px;

        p {
          text-align: center;
          font-size: 14px;
        }
      }
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
    min-width: 640px;

    p {
      font-size: 16px;
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
      height: 64px;
      background-color: transparent;
      margin-top: 20px;
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
        width: 37px;
        height: 37px;
        // align-self: baseline;
        margin-right: 6px;
      }

      &__text {
        width: 100%;
        display: flex;
        flex-direction: column;
        // margin-left: -12px;
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
}
</style>

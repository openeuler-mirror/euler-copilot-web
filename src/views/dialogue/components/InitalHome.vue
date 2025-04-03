<template>
  <div class="home-container">
    <div class="home-logo">
      <img src="src/assets/svgs/euler_copilot_logo.svg" />
    </div>
    <div class="home-welcome">
      <h1>EulerCopilot 很高兴为你服务</h1>
    </div>
    <div class="home-tip">我是你的智能问答助手，现在就可以向我提问题啦！</div>
  </div>
</template>

<style lang="scss" scoped>
.home-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 17.5vh;
}

.home-logo {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  img {
    width: 96px;
    height: auto;
  }
}

.home-welcome {
  margin-top: 32px;
  color: var(--o-text-color-primary);
}

.home-tip {
  color: var(--o-text-color-secondary);
  margin-top: 24px;
}
</style>

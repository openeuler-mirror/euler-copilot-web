<template>
  <div class="welcome-container">
    <img
      class="logo"
      src="../../assets/svgs/euler_copilot_logo.svg"
      alt="euler_copilot_logo"
    />
    <p class="welcome-main">EulerCopilot，很高兴为您服务</p>
    <p class="welcome-desc">我是你的智能问答助手，现在就可以向我提问啦！</p>
  </div>
</template>

<style lang="scss" scoped>
.welcome-container {
  display: flex;
  flex-direction: column;
  align-items: center;

  .logo {
    width: 96px;
    height: 96px;
  }

  .welcome-main {
    margin-top: 20px;
    font-size: 30px;
  }

  .welcome-desc {
    margin-top: 24px;
  }
}
</style>

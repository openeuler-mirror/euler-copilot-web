<template>
  <KeepAlive>
  <div class="container">
     <iframe id="my-iframe" frameborder="0" sandbox="allow-scripts allow-popups allow-same-origin"  height="100%" src="http://localhost:3002" width="100%" ></iframe>
  </div>
</KeepAlive>
</template>

<style scoped>
.container {
  width: 100%;
  height: calc(100vh - 48px);
  margin: 0;
  padding: 0;
}
</style>

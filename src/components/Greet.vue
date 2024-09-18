<script setup lang="ts">
import { ref, onMounted } from "vue";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

const question = ref("");
const streamData = ref("");
const conversationId = ref("");
let sessionId = ref("");

async function initializeComponent() {
  try {
    sessionId.value = await invoke("refresh_session_id", {
      sessionId: sessionId.value,
    });
    conversationId.value = await invoke("create_conversation");
  } catch (error) {
    console.error("Error initializing component:", error);
  }
}

onMounted(initializeComponent);

async function callReceiveStream() {
  try {
    sessionId.value = await invoke("refresh_session_id", {
      sessionId: sessionId.value,
    })
  } catch (error) {
    console.error("Error refreshing session ID:", error);
  }
  try {
    const result = await invoke("receive_stream", {
      session: sessionId.value,
      question: question.value,
      language: "zh",
      conversation: conversationId.value,
      plugin: ""
    });
    console.log("Stream received successfully:", result);
  } catch (error) {
    console.error("Error receiving stream:", error);
  }
}

async function stop() {
  try {
    await invoke("stop");
    console.log("Stream stopped successfully");
  } catch (error) {
    console.error("Error stopping:", error);
  }
}

interface StreamPayload {
  message: string;
}

listen<StreamPayload>("fetch-stream-data", (event) => {
  streamData.value += event.payload.message;
});
</script>

<template>
  <form class="row" @submit.prevent="callReceiveStream">
    <input id="greet-input" v-model="question" placeholder="Enter your question..." />
    <button type="submit">Greet</button>
  </form>

  <div>
    <button @click="stop">Stop Stream</button>
  </div>

  <div>
    <h3>Stream Data:</h3>
    <p>{{ streamData }}</p>
  </div>
</template>

<script setup>
import useDragAndDrop from './useDnD'

const {  onDrop ,onDragStart} = useDragAndDrop()
</script>

<template>
  <aside>
    <div class="nodes">
      <div class="vue-flow__node-input round-start" :draggable="true" @dragstart="onDragStart($event, 'input')" @click="onDrop($event, 'click')">Input Node</div>

      <div class="vue-flow__node-default round-start" :draggable="true" @dragstart="onDragStart($event, 'default')" @click="onDrop($event, 'click')">Default Node</div>

      <div class="vue-flow__node-output round-start" :draggable="true" @dragstart="onDragStart($event, 'output')" @click="onDrop($event, 'click')">Output Node</div>
    </div>
  </aside>
</template>
<template>
    <div class="dialogue-thought">
      <div class="thought-header" @click="toggleCollapse">
        <!-- <span class="think-label">think</span> -->
        <div class="collapse-control">
          <div
            :class="{ 'is-collapsed': isCollapsed }"
            class="collapse-icon"
          >></div>
          <span class="collapse-text">思考</span>
        </div>
      </div>
      <transition name="collapse">
        <div v-show="!isCollapsed" class="thought-content">
          {{ content }}
        </div>
      </transition>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  
  const props = defineProps({
    content: {
      type: String,
      required: true
    }
  });
  
  const isCollapsed = ref(true);
  
  const toggleCollapse = () => {
    isCollapsed.value = !isCollapsed.value;
  };
  </script>
  
  <style lang="scss" scoped>
  .dialogue-thought {
    position: relative;
    margin: 1rem 0;
    border: 2px dashed #ccc;
    border-radius: 8px;
    
    .thought-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 1rem;
      cursor: pointer;
      background-color: #f8f8f8;
      border-bottom: 1px dashed #ccc;
      
      .think-label {
        font-size: 0.9rem;
        font-weight: bold;
        color: #666;
        position: absolute;
        top: -0.7rem;
        left: 1rem;
        padding: 0 0.5rem;
        // background-color: white;
      }
      
      .collapse-control {
        display: flex;
        align-items: center;
        
        .collapse-icon {
          width: 1.2rem;
          height: 1.2rem;
          transition: transform 0.3s ease;
          
          &.is-collapsed {
            transform: rotate(-90deg);
          }
        }
        
        .collapse-text {
          margin-left: 0.5rem;
          font-size: 0.9rem;
          color: #666;
        }
      }
    }
    
    .thought-content {
      padding: 1rem;
      background-color: #fff;
      border-bottom-left-radius: 6px;
      border-bottom-right-radius: 6px;
    }
  }
  
  .collapse-enter-active,
  .collapse-leave-active {
    transition: max-height 0.3s ease-out;
    overflow: hidden;
  }
  
  .collapse-enter-from,
  .collapse-leave-to {
    max-height: 0;
  }
  
  .collapse-enter-to,
  .collapse-leave-from {
    max-height: 1000px; // Adjust this value based on your content
  }
  </style>
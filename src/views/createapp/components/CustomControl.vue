<template>
  <div class="controlBox">
    <div class="controlSearch"><IconSearch /></div>
    <div class="controlScaleNumber">
      {{ `${Number((zommChangeValue * 100).toFixed(0))}%` }}
    </div>
    <el-dropdown placement="top" @visible-change="handleVisibleChange" popper-class="controlChange" class="controlBtn">
      <span class="el-dropdown-link">
        <IconChevronDown v-if="!dropDownVisible" />
        <IconChevronUp v-else />
      </span>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item
            class="reduce"
            @click="handleSacl(zommChangeValue <= 0.5 ? zommChangeValue : zommChangeValue - 0.1)"
            >缩小</el-dropdown-item
          >
          <el-dropdown-item
            class="amplify"
            @click="handleSacl(zommChangeValue >= 2 ? zommChangeValue : zommChangeValue + 0.1)"
            >放大</el-dropdown-item
          >
          <el-dropdown-item class="adaptive" @click="handleSacl(1)">自适应</el-dropdown-item>
          <el-dropdown-item class="scaleOther scaleHalf" divided @click="handleSacl(0.5)">缩放到50%</el-dropdown-item>
          <el-dropdown-item class="scaleOther" @click="handleSacl(1)">缩放到100%</el-dropdown-item>
          <el-dropdown-item class="scaleOther" @click="handleSacl(1.5)">缩放到150%</el-dropdown-item>
          <el-dropdown-item class="scaleTwice" @click="handleSacl(2)">缩放到200%</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
    <div class="dividerBox"></div>
    <div class="optimize" @click="layoutGraph('LR')">
      <img src="@/assets/images/optimize.png" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue';
import { IconChevronDown, IconChevronUp, IconSearch } from '@computing/opendesign-icons';
import { DefaultViewPortZoom } from './types';
interface ControlProps {
  handleChangeZoom: any;
  flowZoom: number;
  layoutGraph: any;
}
const props = withDefaults(defineProps<ControlProps>(), {});
const zommChangeValue = ref(DefaultViewPortZoom);
const dropDownVisible = ref(false);
const handleSacl = zoomValue => {
  zommChangeValue.value = Number(zoomValue.toFixed(2));
  props.handleChangeZoom(zoomValue);
};
const handleVisibleChange = visible => {
  dropDownVisible.value = visible;
};

watch(
  () => props.flowZoom,
  () => {
    zommChangeValue.value = props.flowZoom;
  },
);
</script>

<style lang="scss">
.controlBox {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 144px;
  position: absolute;
  bottom: 24px;
  left: 24px;
  z-index: 999;
  display: flex;
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0px 4px 8px 0px rgba(0, 0, 0, 0.1);
  background: var(--o-bg-color-base);
  .controlSearch {
    width: 16px;
    height: 16px;
  }
  .el-dropdown-link {
    width: 16px;
    height: 16px;
  }

  .dividerBox {
    width: 1px;
    height: 16px;
    background: var(--o-border-color-light);
  }

  .optimize {
    width: 16px;
    height: 16px;
    cursor: pointer;
    img {
      width: 16px;
      height: 16px;
    }
  }
}

.controlChange {
  width: 120px;
  height: 194px;
  border: unset !important;
  border-radius: 8px !important;
  box-shadow: 0px 4px 8px 0px rgba(0, 0, 0, 0.1) !important;
  background: var(--o-bg-color-base) !important;
  margin-left: -34px;
  margin-bottom: 6px;
  .el-scrollbar__wrap {
    border-radius: 8px;
  }
  .el-dropdown-menu__item {
    height: 24px;
    padding-left: 16px !important;
    min-height: unset !important;
    font-size: 12px;
    line-height: 24px;
    color: var(--o-text-color-secondary);
  }

  .reduce {
    margin-top: 4px;
  }

  .scaleTwice {
    margin-bottom: 4px;
  }

  .scaleHalf {
    margin-top: 4px !important;
  }
  .el-dropdown-menu__item--divided {
    margin: 4px 0 !important;
  }
}

.controlBtn {
  width: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--o-text-color-secondary) !important;

  .el-dropdown-link:focus-visible {
    outline: unset !important;
  }

  .el-dropdown-link,
  .o-dropdown-link {
    display: flex;
    align-items: center;
    cursor: pointer;
    color: var(--o-text-color-secondary) !important;
  }
}
.controlBtn:focus-visible {
  outline: unset !important;
}
</style>

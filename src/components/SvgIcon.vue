<template>
  <div class="custom-svg" v-if="$slots.default">
    <slot name="default"></slot>
  </div>
  <svg
    v-else
    viewBox="0 0 1024 1024"
    xmlns="http://www.w3.org/2000/svg"
    width="200"
    height="200"
    :style="customStyle"
  >
    <defs>
      <path :id="`svg-${uniqueKey}`" :d="path"></path>
    </defs>
    <g>
      <use
        :xlink:href="`#svg-${uniqueKey}`"
        :fill="fill"
        :transform="`rotate(${DIR_MAP.get(dir)} 512 512)`"
      />
    </g>
  </svg>
</template>

<script lang="ts" setup>
type ArrowDir = 'right' | 'down' | 'left' | 'up';

const DIR_MAP: Readonly<Map<ArrowDir, number>> = new Map([
  ['right', 0],
  ['down', 90],
  ['left', 180],
  ['up', 270],
]);

withDefaults(
  defineProps<{
    dir?: ArrowDir;
    fill?: string;
    path?: string;
    customStyle?: string;
    uniqueKey: string | number;
  }>(),
  {
    dir: 'right',
    fill: '#8D98AA',
  },
);
</script>
<style lang="scss" scoped>
.custom-svg {
  svg:hover {
    cursor: pointer;
    use {
      fill: #3291fe;
    }
  }
}
svg:hover {
  cursor: pointer;
  use {
    fill: #3291fe;
  }
}
</style>

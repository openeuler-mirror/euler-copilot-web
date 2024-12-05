<script setup lang="ts">
import { ref } from 'vue';
import { IconCaretRight } from '@computing/opendesign-icons';
const contents = [
  {
    id: 1,
    title: '第一级内容',
    descs: [
      '间距自定义',
      '背景自定义',
      [
        {
          id: 2,
          title: '第二级内容',
          descs: ['第三级内容', '第三级内容', '第三级内容'],
        },
        {
          id: 3,
          title: '第二级内容',
          descs: ['第三级内容', '第三级内容', '第三级内容'],
        },
      ],
    ],
  },
];

const nestTableData = [
  {
    id: 1,
    title: '嵌套表格',
    tableData: [
      {
        date: 'Cell text',
      },
      {
        date: 'Cell text',
      },
      {
        date: 'Cell text',
      },
      {
        date: 'Cell text',
      },
    ],
  },
  {
    id: 2,
    title: '二级嵌套',
    nestData: [
      {
        id: 3,
        title: '二级表格',
        tableData: [
          {
            date: 'Cell text',
          },
          {
            date: 'Cell text',
          },
          {
            date: 'Cell text',
          },
          {
            date: 'Cell text',
          },
        ],
      },
    ],
  },
];

const activeNames = ref([contents[0].id]);
const secondCollapseActiveName = ref<number[]>([]);
const handleChange = (val: number[]) => {
  console.log('第一级', val);
  activeNames.value = val;
};
const handleSecondChange = (val: number[]) => {
  console.log('第二级', val);
  secondCollapseActiveName.value = val;
};

const nestActiveNames = ref<number[]>([]);
const nestSecondNames = ref<number[]>([]);
const handleNestChange = (val: number[]) => {
  console.log('嵌套表格', val);
  nestActiveNames.value = val;
};
const handleSecondNestChange = (val: number[]) => {
  console.log('嵌套表格', val);
  nestSecondNames.value = val;
};
</script>

<template>
  <div class="demo-collapse">
    <section>
      <el-collapse v-model="activeNames" @change="handleChange" class="o-hpc-collapse" :prefix-icon="IconCaretRight">
        <el-collapse-item v-for="item in contents" :key="item.id" :name="item.id">
          <template #title>
            <el-icon class="el-collapse-item__arrow" :class="{ 'is-active': activeNames.includes(item.id) }">
              <IconCaretRight />
            </el-icon>
            <span>{{ item.title }}</span>
          </template>
          <template v-for="(p, $index) in item.descs" :key="$index">
            <div v-if="!Array.isArray(p)" class="o-collapse-content">{{ p }}</div>
            <el-collapse v-else v-model="secondCollapseActiveName" @change="handleSecondChange" class="o-nest-collapse">
              <el-collapse-item v-for="secItem in p" :key="secItem.id" :name="secItem.id">
                <template #title>
                  <el-icon class="el-collapse-item__arrow" :class="{ 'is-active': secondCollapseActiveName.includes(secItem.id) }">
                    <IconCaretRight />
                  </el-icon>
                  <span>{{ secItem.title }}</span>
                </template>
                <div v-for="(desc, index) in secItem.descs" :key="index" class="o-collapse-content">{{ desc }}</div>
              </el-collapse-item>
            </el-collapse>
          </template>
        </el-collapse-item>
      </el-collapse>
    </section>

    <!-- 嵌套表格 -->
    <section>
      <el-collapse v-model="nestActiveNames" @change="handleNestChange">
        <el-collapse-item v-for="item in nestTableData" :key="item.id" :name="item.id">
          <template #title>
            <el-icon class="el-collapse-item__arrow" :class="{ 'is-active': nestActiveNames.includes(item.id) }">
              <IconCaretRight />
            </el-icon>
            <span>{{ item.title }}</span>
          </template>
          <template v-if="item.nestData">
            <el-collapse v-model="nestSecondNames" @change="handleSecondNestChange" class="o-nest-collapse">
              <el-collapse-item v-for="secItem in item.nestData" :key="secItem.id" :name="secItem.id">
                <template #title>
                  <el-icon class="el-collapse-item__arrow" :class="{ 'is-active': nestSecondNames.includes(secItem.id) }">
                    <IconCaretRight />
                  </el-icon>
                  <span>{{ secItem.title }}</span>
                </template>
                <div class="o-collapse-content">
                  <el-table border :data="secItem.tableData">
                    <el-table-column prop="date" label="日期" v-for="i in 8" :key="i"></el-table-column>
                  </el-table>
                </div>
              </el-collapse-item>
            </el-collapse>
          </template>
          <div v-else class="o-collapse-content">
            <el-table border :data="item.tableData">
              <el-table-column prop="date" label="日期" v-for="i in 8" :key="i"></el-table-column>
            </el-table>
          </div>
        </el-collapse-item>
      </el-collapse>
    </section>
  </div>
</template>
<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import { IconCaretRight, IconPlusCircle, IconDelete, IconSearch } from '@computing/opendesign-icons';
import DialogueSession from '../../dialogue/components/DialogueSession.vue';
const activeName = ref([1, 2, 3]);
const activeNames = ref([1, 2, 3]);
const createAppForm = ref({
  icon: '',
  appName: '',
  appIntroduction: '',
  connectList: [],
  recommendQuestionList: [],
  multiSession: 1,
  permissionType: 'all',
  selectedPeople: [],
});
const searchName = ref('');
const permissionTypeList = [
  {
    label: '公开（所有人可见）',
    value: 'all',
  },
  {
    label: '私密（仅自己可见）',
    value: 'only',
  },
  {
    label: '部分人可见',
    value: 'part',
  },
];
const permissionList = ref(['zjq', 'zhouweitong', 'wst', 'shihy', 'ouyangnana', 'testname1', 'testname2']);
const curPersonList = ref([...permissionList.value]);
// 这里后面需要换为变量-以便于中英文切换
const createAppRole = ref({
  icon: [{ required: true, message: '上传图标不能为空', trigger: 'change' }],
  appName: [{ required: true, message: '应用名称不能为空', trigger: 'blur' }],
  appIntroduction: [{ required: true, message: '应用简介不能为空', trigger: 'change' }],
  multiSession: [{ required: true, message: '请选择对话轮次不能为空', trigger: 'change' }],
  permissionType: [{ required: true, message: '权限不能为空', trigger: 'change' }],
});
const createAppFormRef = ref();
const modeOptions = reactive([
  {
    label: t('main.Automatic'),
    value: 'auto',
    disabled: false,
  },
]);
const handleChange = (val: number[]) => {
  activeNames.value = val;
};
const addLink = () => {
  createAppForm.value.connectList.push('');
};
const addRecommond = () => {
  createAppForm.value.recommendQuestionList.push('');
};
const delConnectItem = idx => {
  createAppForm.value.connectList.splice(idx, 1);
};
const delRecommendItem = idx => {
  createAppForm.value.recommendQuestionList.splice(idx, 1);
};
const searchPerson = () => {
  curPersonList.value = permissionList.value.filter(item => item.toLowerCase().includes(searchName.value));
};

const handleAvatarSuccess = (res, file) => {
  createAppForm.value.icon = URL.createObjectURL(file.raw);
};

const httpRequest = res => {
  res.onSuccess();
};
</script>
<template>
  <el-form
    :model="createAppForm"
    ref="createAppFormRef"
    label-width="118px"
    :rules="createAppRole"
    class="createAppContainerMainLeft"
  >
    <el-collapse v-model="activeName" @change="handleChange" class="o-hpc-collapse" :prefix-icon="IconCaretRight">
      <el-collapse-item title="Consistency" :name="1">
        <template #title>
          <span>基本信息</span>
          <el-icon class="el-collapse-item__arrow" :class="{ 'is-active': activeNames.includes(1) }">
            <IconCaretRight />
          </el-icon>
        </template>
        <el-form-item label="图标" prop="icon">
          <div class="uploadArea">
            <el-upload
              class="placeIcon avatar-uploader"
              action="#"
              :show-file-list="false"
              :on-success="handleAvatarSuccess"
              :http-request="httpRequest"
            >
              <img v-if="createAppForm.icon.length" :src="createAppForm.icon" class="avatar" />
              <i v-else class="el-icon-plus avatar-uploader-icon"></i>
            </el-upload>
            <span class="text">上传图标</span>
          </div>
        </el-form-item>
        <el-form-item label="应用名称" prop="appName">
          <el-input
            class="w320"
            maxlength="20"
            v-model="createAppForm.appName"
            clearable
            placeholder="请输入"
          ></el-input>
        </el-form-item>

        <el-form-item label="应用简介" prop="appIntroduction">
          <el-input
            class="w320 h80"
            v-model="createAppForm.appIntroduction"
            maxlength="150"
            place
            clearable
            type="textarea"
            show-word-limit
            placeholder="请输入"
          ></el-input>
        </el-form-item>

        <el-form-item label="相关链接" prop="connectList" class="notRequired">
          <div class="linkLine">
            <el-button :icon="IconPlusCircle" @click="addLink" :disabled="createAppForm.connectList.length > 4">
              添加链接
            </el-button>
            <span class="linkText">最多添加5个链接</span>
          </div>
          <div class="linkArea" v-for="(item, index) in createAppForm.connectList">
            <el-input class="w320" v-model="createAppForm.connectList[index]" placeholder="请输入" clearable></el-input>
            <el-icon class="delIcon" @click="delConnectItem(index)">
              <IconDelete />
            </el-icon>
          </div>
        </el-form-item>

        <el-form-item label="推荐问题" prop="recommendQuestionList" class="notRequired">
          <div class="linkLine">
            <el-button
              :icon="IconPlusCircle"
              @click="addRecommond"
              :disabled="createAppForm.recommendQuestionList.length > 2"
            >
              添加问题
            </el-button>
            <span class="linkText">最多添加3个问题</span>
          </div>
          <div class="linkArea" v-for="(item, index) in createAppForm.recommendQuestionList">
            <el-input
              class="w320"
              v-model="createAppForm.recommendQuestionList[index]"
              placeholder="请输入"
              clearable
            ></el-input>
            <el-icon class="delIcon" @click="delRecommendItem(index)">
              <IconDelete />
            </el-icon>
          </div>
        </el-form-item>
      </el-collapse-item>
      <el-collapse-item title="Consistency" :name="2">
        <template #title>
          <span>多轮对话</span>
          <el-icon class="el-collapse-item__arrow" :class="{ 'is-active': activeNames.includes(2) }">
            <IconCaretRight />
          </el-icon>
        </template>
        <el-form-item label="请选择对话轮次" prop="multiSession">
          <div class="multiSessionItem">
            <el-input-number v-model="createAppForm.multiSession" :step="1" :min="1" :max="10"></el-input-number>
            <span class="sessionUnit">(1 ~ 10)</span>
          </div>
        </el-form-item>
      </el-collapse-item>
      <el-collapse-item title="Consistency" :name="3">
        <template #title>
          <span>权限配置</span>
          <el-icon class="el-collapse-item__arrow" :class="{ 'is-active': activeNames.includes(3) }">
            <IconCaretRight />
          </el-icon>
        </template>
        <el-form-item label="权限" prop="permissionType" class="permissionItem">
          <div class="permissionSelect">
            <el-radio-group v-model="createAppForm.permissionType">
              <el-radio v-for="(item, index) in permissionTypeList" :key="index" :value="item.value">
                {{ item.label }}
              </el-radio>
            </el-radio-group>
          </div>
          <div class="partPermissionPerson" v-if="createAppForm.permissionType === 'part'">
            <el-input
              ref="inputRef"
              v-model="searchName"
              class="o-style-search w320"
              placeholder="搜索用户"
              @input="searchPerson"
              clearable
              :prefix-icon="IconSearch"
            ></el-input>
            <div class="personList">
              <el-checkbox-group v-model="createAppForm.selectedPeople">
                <el-checkbox v-for="(item, index) in curPersonList" :key="index" :label="item">
                  <span class="circle"></span>
                  {{ item }}
                </el-checkbox>
              </el-checkbox-group>
            </div>
          </div>
        </el-form-item>
      </el-collapse-item>
    </el-collapse>
  </el-form>
  <div class="createAppContainerMainBox">
    <div class="previewTitle">界面预览</div>
    <div class="createAppContainerMainRight">
      <DialogueSession :modeOptions="modeOptions" isCreateApp="true" :createAppForm="createAppForm" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import { IconCaretRight, IconPlusCircle, IconDelete, IconSearch } from '@computing/opendesign-icons';
import DialogueSession from '../../dialogue/components/DialogueSession.vue';
import { useRoute } from 'vue-router';
import { api } from 'src/apis';
const activeName = ref([1, 2, 3]);
const activeNames = ref([1, 2, 3]);
const route = useRoute();
const props = withDefaults(defineProps(), {});
const emits = defineEmits(['getFlowList']);

const createAppForm = ref({
  icon: '',
  name: '',
  description: '',
  links: [],
  recommendedQuestions: [],
  dialogRounds: 3,
  permissionType: 'private',
  selectedPeople: [],
});
const flowDataList = ref([]);
const searchName = ref('');
const permissionTypeList = [
  {
    label: '公开（所有人可见）',
    value: 'public',
  },
  {
    label: '私密（仅自己可见）',
    value: 'private',
  },
  {
    label: '部分人可见',
    value: 'protected',
  },
];
const permissionList = ref(['zjq', 'zhouweitong', 'wst', 'shihy', 'ouyangnana', 'testname1', 'testname2']);
const curPersonList = ref([...permissionList.value]);
// 这里后面需要换为变量-以便于中英文切换
const createAppRole = ref({
  name: [{ required: true, message: '应用名称不能为空', trigger: 'blur' }],
  description: [{ required: true, message: '应用简介不能为空', trigger: 'change' }],
  dialogRounds: [{ required: true, message: '对话轮次不能为空', trigger: 'change' }],
  descripermissionTypeption: [{ required: true, message: '权限不能为空', trigger: 'change' }],
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
  createAppForm.value.links.push('');
};
const addRecommond = () => {
  createAppForm.value.recommendedQuestions.push('');
};
const delConnectItem = idx => {
  createAppForm.value.links.splice(idx, 1);
};
const delRecommendItem = idx => {
  createAppForm.value.recommendedQuestions.splice(idx, 1);
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

onMounted(() => {
  if (route.query?.appId) {
    api
      .querySingleAppData({
        id: route.query?.appId as string,
      })
      .then(res => {
        const appInfo = res?.[1]?.result;
        if (appInfo) {
          createAppForm.value = {
            icon: appInfo.icon,
            name: appInfo.name,
            description: appInfo.description,
            links: appInfo.links.map(item => item.url),
            recommendedQuestions: appInfo.recommendedQuestions,
            dialogRounds: appInfo.dialogRounds,
            permission: { visibility: appInfo.permission.visibility },
            permissionType: appInfo.permission.visibility,
          };
          flowDataList.value = appInfo.workflows;
          emits('getFlowList', flowDataList.value);
        }
      });
  }
});

watch(
  () => createAppForm.value,
  async () => {
    if (createAppFormRef.value && props.handleValidateContent) {
      let formBalidate = await createAppFormRef.value.validate();
      if (formBalidate) {
        props.handleValidateContent(!formBalidate);
      }
    }
  },
  { deep: true, immediate: true },
);

defineExpose({
  createAppForm,
  createAppFormRef,
});
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
        <el-form-item label="图标" prop="icon" class="notRequired">
          <div class="uploadArea">
            <el-upload
              class="placeIcon avatar-uploader"
              action="#"
              :show-file-list="false"
              :on-success="handleAvatarSuccess"
              :http-request="httpRequest"
            >
              <img v-if="createAppForm.icon.length" :src="createAppForm.icon" class="avatar" />
              <div v-else class="defaultIcon"></div>
              <div class="uploadIcon"></div>
            </el-upload>
            <span class="text">上传图标</span>
          </div>
        </el-form-item>
        <el-form-item label="应用名称" prop="name">
          <el-input class="w320" maxlength="20" v-model="createAppForm.name" clearable placeholder="请输入"></el-input>
        </el-form-item>

        <el-form-item label="应用简介" prop="description">
          <el-input
            class="w320 h80"
            v-model="createAppForm.description"
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
            <el-button :icon="IconPlusCircle" @click="addLink" :disabled="createAppForm.links.length > 4">
              添加链接
            </el-button>
            <span class="linkText">最多添加5个链接</span>
          </div>
          <div class="linkArea" v-for="(item, index) in createAppForm.links">
            <el-input class="w320" v-model="createAppForm.links[index]" placeholder="请输入" clearable></el-input>
            <el-icon class="delIcon" @click="delConnectItem(index)">
              <IconDelete />
            </el-icon>
          </div>
        </el-form-item>

        <el-form-item label="推荐问题" prop="recommendedQuestions" class="notRequired">
          <div class="linkLine">
            <el-button
              :icon="IconPlusCircle"
              @click="addRecommond"
              :disabled="createAppForm.recommendedQuestions.length > 2"
            >
              添加问题
            </el-button>
            <span class="linkText">最多添加3个问题</span>
          </div>
          <div class="linkArea" v-for="(item, index) in createAppForm.recommendedQuestions">
            <el-input
              class="w320"
              v-model="createAppForm.recommendedQuestions[index]"
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
        <el-form-item label="请选择对话轮次" prop="dialogRounds">
          <div class="multiSessionItem">
            <el-input-number v-model="createAppForm.dialogRounds" :step="1" :min="1" :max="10"></el-input-number>
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
          <div class="partPermissionPerson" v-if="createAppForm.permissionType === 'protected'">
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

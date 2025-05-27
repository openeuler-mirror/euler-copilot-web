<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import {
  IconCaretRight,
  IconPlusCircle,
  IconDelete,
  IconSearch,
} from '@computing/opendesign-icons';
import { useRoute } from 'vue-router';
import { api } from 'src/apis';
import CustomLoading from '../../customLoading/index.vue';
import AppInitalPreview from 'src/views/dialogue/components/AppInitalPreview.vue';
import { ElMessage } from 'element-plus';
import { useChangeThemeStore } from 'src/store';

type AppConfig = {
  icon: string;
  name: string;
  description: string;
  links: string[];
  recommendedQuestions: string[];
  dialogRounds: number;
  permission: {
    visibility: string;
    authorizedUsers: string[];
  };
};

const activeName = ref([1, 2, 3]);
const activeNames = ref([1, 2, 3]);
const themeStore = useChangeThemeStore();
const route = useRoute();
const props = withDefaults(
  defineProps<{
    handleValidateContent: Function;
  }>(),
  {},
);
const emits = defineEmits(['getFlowList', 'getPublishStatus']);
const loading = ref(false);
const createAppForm = ref<AppConfig>({
  icon: '',
  name: '',
  description: '',
  links: [],
  recommendedQuestions: [],
  dialogRounds: 3,
  permission: {
    visibility: 'private',
    authorizedUsers: [],
  },
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
const base64Image: any = ref('');
const permissionList = ref([]);
const curPersonList = ref([]);
const publishStatus = ref(false);

// 这里校验url是否符合规范
const checkLinks = (rule, value, callback) => {
  // 这里校验各个url链接
  let result = true;
  createAppForm.value.links.forEach((item) => {
    if (!checkUrl(item)) {
      result = false;
    }
  });
  if (!result) {
    callback(new Error('填写的url不合法'));
  } else {
    callback();
  }
};

// 这里后面需要换为变量-以便于中英文切换
const createAppRole = ref({
  name: [{ required: true, message: '应用名称不能为空', trigger: 'blur' }],
  description: [
    { required: true, message: '应用简介不能为空', trigger: 'change' },
  ],
  dialogRounds: [
    { required: true, message: '对话轮次不能为空', trigger: 'change' },
  ],
  links: [
    {
      required: true,
      message: '请填写合法的url',
      validator: checkLinks,
      trigger: 'blur',
    },
  ],
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

// 这里是将基本信息展开收起单独提出来，避免滚动条超出右方卡片上方
const changeActiveName = () => {
  const idx = activeNames.value.indexOf(1);
  if (idx > -1) {
    // 如果基本信息collapse存在【展开状态】则删除【收起】
    activeNames.value.splice(idx, 1);
    activeName.value.splice(idx, 1);
  } else {
    // 否则添加【展开】
    activeNames.value.push(1);
    activeName.value.push(1);
  }
};
const addLink = () => {
  createAppForm.value.links.push('');
};
const addRecommond = () => {
  createAppForm.value.recommendedQuestions.push('');
};
const delConnectItem = (idx) => {
  createAppForm.value.links.splice(idx, 1);
};
const delRecommendItem = (idx) => {
  createAppForm.value.recommendedQuestions.splice(idx, 1);
};
const searchPerson = () => {
  curPersonList.value = permissionList.value.filter((item) =>
    item?.userName?.toLowerCase()?.includes(searchName.value),
  );
};
const handleAvatarSuccess = (res, file) => {
  convertToBase64(file.raw);
};

// 转为base64-仅限小图标，后续请改为上传图片接口
const convertToBase64 = (file) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    base64Image.value = e.target?.result;
  };
  reader.readAsDataURL(file);
};

watch(
  () => base64Image.value,
  () => {
    createAppForm.value.icon = base64Image.value;
  },
);

watch(
  () => publishStatus.value,
  () => {
    if (publishStatus.value) {
      emits('getPublishStatus', publishStatus.value);
    }
  },
  { deep: true, immediate: true },
);

const httpRequest = (res) => {
  res.onSuccess();
};

onMounted(() => {
  // 判断是否编辑--是否需要查询回显数据
  if (route.query?.appId) {
    loading.value = true;
    api
      .querySingleAppData({
        id: route.query?.appId as string,
      })
      .then((res) => {
        const appInfo = res?.[1]?.result;
        if (appInfo) {
          createAppForm.value = {
            icon: appInfo.icon,
            name: appInfo.name,
            description: appInfo.description,
            links: appInfo.links.map((item) => item.url),
            recommendedQuestions: appInfo.recommendedQuestions,
            dialogRounds: appInfo.dialogRounds,
            permission: {
              visibility: appInfo.permission.visibility,
              authorizedUsers: appInfo.permission.authorizedUsers,
            },
          };
          publishStatus.value = appInfo.published;
          flowDataList.value = appInfo.workflows;
          emits('getFlowList', flowDataList.value);
        }
        loading.value = false;
      });
  }
  // 获取当前权限配置-部分人可见的部分人列表数据
  api.getPartAppConfgUser().then((res) => {
    if (res[1]?.result) {
      permissionList.value = res[1]?.result?.userInfoList;
      curPersonList.value = res[1]?.result?.userInfoList;
    }
  });
});
// 正则校验url
const checkUrl = (url) => {
  // 这里判断下
  if (url) {
    try {
      new URL(url);
      // 这里设置校验成功
      return true;
    } catch (e) {
      // 设置校验失败
      return false;
    }
  } else {
    return false;
  }
};

watch(
  () => createAppForm.value,
  async () => {
    if (createAppFormRef.value && props.handleValidateContent) {
      const formBalidate = await validateForm();
      props.handleValidateContent(formBalidate);
    }
  },
  { deep: true, immediate: true },
);

// 获取界面配置的校验结果
const validateForm = async () => {
  try {
    const resulst = await createAppFormRef.value.validate();
    return true;
  } catch (error) {
    return false;
  }
};

const handleTextareaEnter = (e: any) => {
  if (e.keyCode == 13) {
    e.returnValue = false;
    return false;
  }
};

const beforeUpload = async (file: ElFile) => {
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    ElMessage({
      message: 'Image size cannot exceed 2MB!',
      type: 'error',
    });
    return false;
  }
  try {
    const reader = new FileReader();
    reader.onerror = (error) => {
      ElMessage({
        message: 'Error reading file!',
        type: 'error',
      });
    };
    // 开始读取文件内容
    await new Promise((resolve, reject) => {
      reader.readAsText(file);
      reader.onloadend = () => resolve(true); // 当读取完成时解决 Promise
      reader.onerror = (error) => reject(error); // 如果出错则拒绝 Promise
    });
    return true;
  } catch (error) {
    console.error('Error during file upload process:', error);
    ElMessage({
      message: 'An error occurred during file upload!',
      type: 'error',
    });
    return false; // 同样，这行在当前的 async 函数中可能没有实际意义
  }
};

defineExpose({
  createAppForm,
  createAppFormRef,
});
</script>
<template>
  <CustomLoading :loading="loading"></CustomLoading>
  <!-- 将基本信息collapse提出 -->
  <div class="appConfig">
    <div class="baseInfoTitle" :class="{ 'activeCollapse': activeNames.includes(1) }" @click="changeActiveName">
      <span>{{ $t('semantic.baseMessage') }}</span>
      <el-icon :class="{ 'is-active': activeNames.includes(1) }" class="el-collapse-item__arrow">
        <IconCaretRight />
      </el-icon>
    </div>
    <el-form
      :model="createAppForm"
      ref="createAppFormRef"
      label-width="118px"
      :rules="createAppRole"
      class="createAppContainerMainLeft"
    >
      <el-collapse
        v-model="activeName"
        @change="handleChange"
        class="o-hpc-collapse"
        :prefix-icon="IconCaretRight"
      >
        <el-collapse-item title="Consistency" :name="1">
          <template #title>
            <span>{{ $t('semantic.baseMessage') }}</span>
            <el-icon
              class="el-collapse-item__arrow"
              :class="{ 'is-active': activeNames.includes(1) }"
            >
              <IconCaretRight />
            </el-icon>
          </template>
          <el-form-item :label="$t('semantic.icon')" prop="icon" class="notRequired">
            <div class="uploadArea">
              <el-upload
                class="placeIcon avatar-uploader"
                action="#"
                :show-file-list="false"
                :on-success="handleAvatarSuccess"
                :before-upload="beforeUpload"
                :http-request="httpRequest"
                :accept="'image/*'"
              >
                <img
                  v-if="createAppForm.icon.length"
                  :src="createAppForm.icon"
                  class="avatar"
                />
                <div v-else class="defaultIcon"></div>
                <div class="uploadIcon"></div>
              </el-upload>
              <span class="text">{{ $t('semantic.interface_upload')}}</span>
            </div>
          </el-form-item>
          <el-form-item :label="$t('app.app_name')" prop="name">
            <el-input
              class="w320"
              maxlength="20"
              v-model="createAppForm.name"
              clearable
              :placeholder="$t('semantic.pleaseEnter')"
            ></el-input>
          </el-form-item>
          <el-form-item :label="$t('app.app_introduction')" prop="description">
            <el-input
              class="w320 h80"
              v-model="createAppForm.description"
              maxlength="150"
              place
              clearable
              type="textarea"
              :placeholder="$t('semantic.pleaseEnter')"
              @keydown.enter="handleTextareaEnter"
            ></el-input>
          </el-form-item>
          <!-- 这里notRequired样式,在局部的通过校验时，控制局部的样式为正常。links为空时通过校验 -->
          <el-form-item :label="$t('app.link')" prop="links" class="notRequired">
            <div class="linkLine">
              <el-button
                :icon="IconPlusCircle"
                @click="addLink"
                :disabled="createAppForm.links.length > 4"
              >
                {{ $t('app.addLink') }}
              </el-button>
              <span class="linkText">{{  $t('app.addFiveLinks') }}</span>
            </div>
            <div class="linkArea" v-for="(item, index) in createAppForm.links">
              <el-input
                class="w320"
                maxlength="200"
                :class="{ validUrl: checkUrl(createAppForm.links[index]) }"
                v-model="createAppForm.links[index]"
                :placeholder="$t('semantic.pleaseEnter')"
                clearable
              ></el-input>
              <el-icon class="delIcon" @click="delConnectItem(index)">
                <IconDelete />
              </el-icon>
            </div>
          </el-form-item>

          <el-form-item
            :label="$t('main.question')"
            prop="recommendedQuestions"
            class="notRequired"
          >
            <div class="linkLine">
              <el-button
                :icon="IconPlusCircle"
                @click="addRecommond"
                :disabled="createAppForm.recommendedQuestions.length > 2"
              >
                {{ $t('main.addQuestion') }}
              </el-button>
              <span class="linkText">{{ $t('main.addFiveQuestions') }}</span>
            </div>
            <div
              class="linkArea"
              v-for="(item, index) in createAppForm.recommendedQuestions"
            >
              <el-input
                class="w320"
                maxlength="30"
                v-model="createAppForm.recommendedQuestions[index]"
                :placeholder="$t('semantic.pleaseEnter')"
                clearable
              ></el-input>
              <el-icon class="delIcon" @click="delRecommendItem(index)">
                <IconDelete />
              </el-icon>
            </div>
          </el-form-item>
        </el-collapse-item>
        <el-collapse-item class="chatsCollapse" title="Consistency" :name="2">
          <template #title>
            <span>{{ $t('app.multi_Dialogue')}}</span>
            <el-icon
              class="el-collapse-item__arrow"
              :class="{ 'is-active': activeNames.includes(2) }"
            >
              <IconCaretRight />
            </el-icon>
          </template>
          <el-form-item :label="$t('app.multi_Dialogue_select')" prop="dialogRounds">
            <div class="multiSessionItem">
              <el-input-number
                v-model="createAppForm.dialogRounds"
                :step="1"
                :value-on-clear="3"
                :min="1"
                :max="10"
              ></el-input-number>
              <span class="sessionUnit">(1 ~ 10)</span>
            </div>
          </el-form-item>
        </el-collapse-item>
        <el-collapse-item title="Consistency" :name="3">
          <template #title>
            <span>{{ $t('app.permissionConfiguration') }}</span>
            <el-icon
              class="el-collapse-item__arrow"
              :class="{ 'is-active': activeNames.includes(3) }"
            >
              <IconCaretRight />
            </el-icon>
          </template>
          <el-form-item :label="$t('app.permission')" prop="permission" class="permissionItem">
            <div class="permissionSelect">
              <el-radio-group v-model="createAppForm.permission.visibility">
                <el-radio
                  v-for="(item, index) in permissionTypeList"
                  :key="index"
                  :value="item.value"
                >
                  {{ item.label }}
                </el-radio>
              </el-radio-group>
            </div>
            <div
              class="partPermissionPerson"
              v-if="createAppForm.permission.visibility === 'protected'"
            >
              <div class="permissionChoice">
                <div class="perimissionChoiceTitle">
                  <div>{{ $t('app.optional') }}</div>
                  <div class="choiceNum">{{ curPersonList.length }}</div>
                </div>
                <el-input
                  ref="inputRef"
                  v-model="searchName"
                  class="o-style-search permissionInputSearch"
                  :placeholder="$t('app.searchUser')"
                  @input="searchPerson"
                  clearable
                  :prefix-icon="IconSearch"
                ></el-input>
                <div class="personList">
                  <el-checkbox-group
                    v-model="createAppForm.permission.authorizedUsers"
                  >
                    <el-checkbox
                      v-for="(item, index) in curPersonList"
                      :key="index"
                      :value="item?.userSub"
                    >
                      <span class="circle"></span>
                      {{ item?.userName }}
                    </el-checkbox>
                  </el-checkbox-group>
                </div>
              </div>
              <div class="permissionChoice">
                <div class="perimissionChoiceTitle">
                  <div>{{ $t('app.selected')}}</div>
                  <div class="choiceNum">
                    {{ createAppForm.permission.authorizedUsers.length }}
                  </div>
                </div>
                <div class="personList">
                  <el-checkbox-group
                    v-model="createAppForm.permission.authorizedUsers"
                  >
                    <el-checkbox
                      v-for="(item, index) in createAppForm.permission
                        .authorizedUsers"
                      :key="index"
                      :value="item"
                    >
                      <span class="circle"></span>
                      {{ item }}
                    </el-checkbox>
                  </el-checkbox-group>
                </div>
              </div>
            </div>
          </el-form-item>
        </el-collapse-item>
      </el-collapse>
    </el-form>
  </div>
  <div class="createAppContainerMainBox">
    <div class="previewTitle">{{ $t("app.ui_preview") }}</div>
    <div class="createAppContainerMainRight" :class="themeStore.theme">
      <AppInitalPreview :createAppForm="createAppForm" />
    </div>
  </div>
</template>
<style lang="scss" scoped>
/* 滚动条轨道样式 */
::-webkit-scrollbar-track {
  background-image: linear-gradient(180deg, #e7f0fd 1%, #daeafc 40%) !important;
  display: none;
}

::-webkit-scrollbar {
  width: 3px;
  height: 3px;
}

/* 滚动条的滑块 */
::-webkit-scrollbar-thumb {
  background-color: var(--o-scrollbar-thumb);
  border-radius: 3px;
}
::-webkit-scrollbar-corner {
  background: transparent;
}
</style>

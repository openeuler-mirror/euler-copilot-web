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
  connectList: [{ required: true, message: '相关链接不能为空', trigger: 'change' }],
  recommendQuestionList: [{ required: true, message: '推荐问题不能为空', trigger: 'change' }],
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
  createAppForm.value.recommendQuestionList.unshift('');
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
  createAppForm.value.icon = URL.createObjectURL(file.raw)
};

const httpRequest = (res)=>{
  res.onSuccess()
}
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
          <span> 基本信息 </span>
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
          <el-input class="w320" maxlength="20" v-model="createAppForm.appName" clearable placeholder="请输入"></el-input>
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

        <el-form-item label="相关链接" prop="connectList">
          <div class="linkLine">
            <el-button :icon="IconPlusCircle" @click="addLink" :disabled="createAppForm.connectList.length > 4"
              >添加链接</el-button
            >
            <span class="linkText">最多添加5个链接</span>
          </div>
          <div class="linkArea" v-for="(item, index) in createAppForm.connectList">
            <el-input class="w320" v-model="createAppForm.connectList[index]" placeholder="请输入" clearable></el-input>
            <el-icon class="delIcon" @click="delConnectItem(index)">
              <IconDelete />
            </el-icon>
          </div>
        </el-form-item>

        <el-form-item label="推荐问题" prop="recommendQuestionList">
          <div class="linkLine">
            <el-button
              :icon="IconPlusCircle"
              @click="addRecommond"
              :disabled="createAppForm.recommendQuestionList.length > 2"
              >添加问题</el-button
            >
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
          <span> 多轮对话 </span>
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
          <span> 权限配置 </span>
          <el-icon class="el-collapse-item__arrow" :class="{ 'is-active': activeNames.includes(3) }">
            <IconCaretRight />
          </el-icon>
        </template>
        <el-form-item label="权限" prop="permissionType" class="permissionItem">
          <div class="permissionSelect">
            <el-radio-group v-model="createAppForm.permissionType">
              <el-radio v-for="(item, index) in permissionTypeList" :key="index" :value="item.value">{{
                item.label
              }}</el-radio>
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
            >
            </el-input>
            <div class="personList">
              <el-checkbox-group v-model="createAppForm.selectedPeople">
                <el-checkbox v-for="(item, index) in curPersonList" :key="index" :label="item">
                  <span class="circle"></span>{{ item }}</el-checkbox
                >
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
<style scoped lang="scss">
.createAppContainerMainLeft {
  margin-top: 0px;
  --o-owndefine-del-hover: #7aa5ff;
  --o-owndefine-del-active: #6395fd;
  overflow-y: auto;
  overflow-x: hidden;
  ::v-deep(.el-collapse) {
    .el-collapse-item__header {
      padding: 0px;
      margin-left: 8px;
      height: 24px;
      line-height: 24px;
      font-size: 16px;
      font-weight: bolder;
      margin-bottom: 8px;
      .el-collapse-item__arrow {
        color: #8d98aa;
        margin-left: 8px;
      }
    }
    .el-collapse-item__content {
      margin-left: 0px;
      .uploadArea {
        color: #8d98aa;
        display: flex;
        flex-direction: column;
        gap: 8px;
        .placeIcon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: 1px solid var(--o-text-color-tertiary);
          cursor: pointer;
        }

        .avatar-uploader .el-upload {
          border: 1px dashed #d9d9d9;
          border-radius: 6px;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          img{
            width: 100%;
            height: 100%;
          border-radius: 50%;
          }
        }
        .avatar-uploader-icon {
          font-size: 28px;
          color: #8c939d;
          width: 178px;
          height: 178px;
          line-height: 178px;
          text-align: center;
        }
        .avatar {
          width: 178px;
          height: 178px;
          display: block;
        }

        .text {
          height: 16px;
          line-height: 16px;
        }
      }
      .el-textarea__inner {
        height: 80px;
      }

      .linkLine {
        height: 32px;
        display: flex;
        align-items: center;
        .linkText {
          margin-left: 8px;
          color: var(--o-text-color-tertiary);
          height: 16px;
          line-height: 16px;
        }
      }
      .linkArea {
        display: flex;
        margin-top: 8px;
        gap: 8px;
        height: 32px;
        width: 100%;
        align-items: center;
        .delIcon,
        svg {
          height: 16px;
          width: 16px;
          color: var(--o-text-color-tertiary);
          &:hover {
            color: var(--o-owndefine-del-hover);
          }
          &:active {
            color: var(--o-owndefine-del-active);
          }
        }
      }
      .permissionItem {
        .el-form-item__label,
        .el-form-item__content {
          padding: 0px;
          min-height: 16px;
        }
        .el-form-item__label {
          height: 16px;
        }
        .el-radio-group {
          display: flex;
          gap: 24px;
          .el-radio {
            margin-right: 0px;
            height: 16px;
          }
        }
        .partPermissionPerson {
          width: 420px;
          height: 252px;
          padding: 16px 0px 0px 16px;
          margin-top: 8px;
          background-color: var(--o-bash-bg);
          .personList {
            max-height: 204px;
            overflow: auto;
            padding-bottom: 12px;
            .el-checkbox-group {
              margin-top: 16px;
              display: flex;
              flex-direction: column;
              gap: 16px;
              .el-checkbox {
                height: 16px;
                display: flex;
                align-items: center;
                .el-checkbox__label {
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  .circle {
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background-color: var(--o-button-color);
                  }
                }
              }
            }
          }
        }
        .o-style-search.el-input {
          .el-input__suffix {
            &::after {
              margin-top: 6px;
            }
          }
        }
      }
      .multiSessionItem {
        display: flex;
        gap: 8px;
        .sessionUnit {
          width: 56px;
          text-align: center;
          color: var(--o-text-color-tertiary);
        }
      }
    }
  }
}
</style>

import { ElMessage } from 'element-plus';

export const infoMsg = (msgInfo: string) => {
  ElMessage({
    type: 'info',
    // showClose:true,
    dangerouslyUseHTMLString: true,
    message: msgInfo,
  });
};

export const successMsg = (msgInfo: string) => {
  ElMessage({
    // customClass:"el-message--success",
    type: 'success',
    // showClose:true,
    // class: 'el-message--success',
    message: msgInfo,
  });
};
export const warningMsg = (msgInfo: string) => {
  ElMessage({
    type: 'warning',
    // showClose:true,
    // class: 'el-message--warning',
    message: msgInfo,
  });
};

export const errorMsg = (msgInfo: string) => {
  ElMessage({
    type: 'error',
    // showClose:true,
    // class: 'el-message--error',
    message: msgInfo,
  });
};

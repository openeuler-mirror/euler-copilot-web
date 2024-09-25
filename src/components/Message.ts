import { ElMessage } from "element-plus";

export const infoMsg = (msgInfo: string) => {
    ElMessage({
        type: "info",
        showClose: true,
        dangerouslyUseHTMLString: true,
        message: msgInfo,
    });
};

export const successMsg = (msgInfo: string) => {
    ElMessage({
        type: "success",
        showClose: true,
        customClass: "el-message--success",
        message: msgInfo,
    });
};

export const warningMsg = (msgInfo: string) => {
    ElMessage({
        type: "warning",
        showClose: true,
        customClass: "el-message--warning",
        message: msgInfo,
    });
};

export const errorMsg = (msgInfo: string) => {
    ElMessage({
        type: "error",
        showClose: true,
        customClass: "el-message--error",
        message: msgInfo,
    });
};


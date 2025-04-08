// Copyright (c) Huawei Technologies Co., Ltd. 2023-2024. All rights reserved.
// licensed under the Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.
import { writeText, readText } from "@tauri-apps/api/clipboard";
import { invoke } from "@tauri-apps/api/tauri";
import { successMsg, errorMsg } from "src/components/Message";

/**
 * 随机整数范围 min <= return < max
 * @param min
 * @param max
 * @returns
 */
export const randomInt = (): number => {
  return window.crypto.getRandomValues(new Uint32Array(1))[0];
};

export type HtmlEvent = "copyPreCode";

/**
 * HTML事件分发
 * @param _t dom节点
 * @param _ty event 类型
 * @param event 事件 e
 * @param type 自定义类型type
 * @param data 自定义属性
 */
export const onHtmlEventDispatch = (
  _t: any,
  _ty: any,
  _event: any,
  type: HtmlEvent,
  data: any
): void => {
  if (type === "copyPreCode") {
    const code = document.getElementById(data);
    if (code) {
      copyText(code.innerText);
    }
  }
};

/**
 * 复制code
 * @param text code内容
 */
export const copyText = async (content: string): Promise<void> => {
  await writeText(content);
  await readText()
    .then(async (text) => {
      if (text === content) {
        successMsg("复制成功");
      } else {
        errorMsg("复制失败");
      }
    })
    .catch((err) => {
      console.error(err);
      errorMsg("复制失败");
    });
};

/**
 * 在终端中运行命令
 */
export const runCommand = async (command: string): Promise<void> => {
  if (command.startsWith("docker run")) {
    const containerName = extractContainerName(command);
    await invoke("open_terminal", { command: command })
      .then(async () => {
        successMsg("已启动命令行终端");
        await pollContainerStatus(containerName);
      })
      .catch((err) => {
        console.error(err);
        errorMsg("命令行终端启动失败");
      });
  } else {
    await invoke("open_terminal", { command: command })
      .then(() => {
        successMsg("已启动命令行终端");
      })
      .catch((err) => {
        console.error(err);
        errorMsg("命令行终端启动失败");
      });
  }
};

const extractContainerName = (command: string): string => {
  const parts = command.split(" ");
  const nameIndex = parts.indexOf("--name");
  return nameIndex !== -1 && nameIndex + 1 < parts.length
    ? parts[nameIndex + 1]
    : "";
};

const pollContainerStatus = async (
  containerName: string,
  maxAttempts = 30,
  interval = 2000
): Promise<void> => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const status = await checkDockerContainerStatus(containerName);
    if (status.includes("Up")) {
      successMsg(`容器 ${containerName} 运行状态: ${status}`);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  errorMsg(`容器 ${containerName} 未能在预期时间内启动`);
};

const checkDockerContainerStatus = async (
  containerName: string
): Promise<string> => {
  if (!containerName) return "";

  const checkCommand = `docker ps -f name=${containerName} --format '{{.Status}}'`;

  try {
    const status = (await invoke("run_command", {
      command: checkCommand,
    })) as string;
    return status.trim();
  } catch (err) {
    console.error(err);
    errorMsg("检查容器状态失败");
    return "";
  }
};

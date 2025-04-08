// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.
import { ipcRenderer, contextBridge } from 'electron';

function validateIPC(channel: string): true | never {
  if (!channel || !channel.startsWith('copilot:')) {
    throw new Error(`Unsupported event IPC channel '${channel}'`);
  }

  return true;
}

const globals = {
  ipcRenderer: {
    invoke(channel: string, ...args: any[]): Promise<any> {
      validateIPC(channel);

      return ipcRenderer.invoke(channel, ...args);
    },
  },

  process: {
    get platform() {
      return process.platform;
    },
    get arch() {
      return process.arch;
    },
    get versions() {
      return process.versions;
    },
    get env() {
      return { ...process.env };
    },
  },
};

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('eulercopilot', globals);
  } catch (error) {
    console.error(error);
  }
} else {
  (window as any).eulercopilot = globals;
}

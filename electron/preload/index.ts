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

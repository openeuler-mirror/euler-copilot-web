// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.
export const electronProcess = window.eulercopilot
  ? window.eulercopilot.process
  : undefined;

// 为了向后兼容，设置window.electronProcess
if (window.eulercopilot && !window.electronProcess) {
  window.electronProcess = window.eulercopilot.process;
}

export const ipcRenderer = window.eulercopilot
  ? window.eulercopilot.ipcRenderer
  : undefined;

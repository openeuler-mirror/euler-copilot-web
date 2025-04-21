// Copyright (c) Huawei Technologies Co., Ltd. 2023-2025. All rights reserved.
// licensed under the Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.
import * as nls from './nls';

export const LANGUAGE_DEFAULT = 'zh_cn';

let _isWindows = false;
let _isMacintosh = false;
let _isLinux = false;
let _isElectron = false;
let _locale: string | undefined = undefined;
let _language: string = LANGUAGE_DEFAULT;

export interface IProcessEnvironment {
  [key: string]: string | undefined;
}

/**
 * This interface is intentionally not identical to node.js
 * process because it also works in sandboxed environments
 * where the process object is implemented differently. We
 * define the properties here that we need for `platform`
 * to work and nothing else.
 */
export interface INodeProcess {
  platform: string;
  arch: string;
  env: IProcessEnvironment;
  versions?: {
    node?: string;
    electron?: string;
    chrome?: string;
  };
  type?: string;
  cwd: () => string;
}

let nodeProcess: INodeProcess | undefined = process;

const isElectronProcess = typeof nodeProcess?.versions?.electron === 'string';

if (typeof nodeProcess === 'object') {
  _isWindows = nodeProcess.platform === 'win32';
  _isMacintosh = nodeProcess.platform === 'darwin';
  _isLinux = nodeProcess.platform === 'linux';
  _isElectron = isElectronProcess;
  _locale = LANGUAGE_DEFAULT;
  _language = LANGUAGE_DEFAULT;
  const rawNlsConfig = nodeProcess.env['EULERCOPILOT_NLS_CONFIG'];
  if (rawNlsConfig) {
    try {
      const nlsConfig: nls.INLSConfiguration = JSON.parse(rawNlsConfig);
      _locale = nlsConfig.userLocale;
      _language = nlsConfig.resolvedLanguage || LANGUAGE_DEFAULT;
    } catch (e) {}
  }
} else {
  console.error('Unable to resolve platform.');
}

export const enum Platform {
  Web,
  Mac,
  Linux,
  Windows,
}
export type PlatformName = 'Web' | 'Windows' | 'Mac' | 'Linux';

let _platform: Platform = Platform.Web;
if (_isMacintosh) {
  _platform = Platform.Mac;
} else if (_isWindows) {
  _platform = Platform.Windows;
} else if (_isLinux) {
  _platform = Platform.Linux;
}

export const isWindows = _isWindows;
export const isMacintosh = _isMacintosh;
export const isLinux = _isLinux;
export const isElectron = _isElectron;
export const platform = _platform;

export const locale = _locale;
export const language = _language;

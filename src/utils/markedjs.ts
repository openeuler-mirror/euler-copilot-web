// Copyright (c) Huawei Technologies Co., Ltd. 2023-2024. All rights reserved.
// licensed under the Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.
import hljs from 'highlight.js';
import { marked } from 'marked';

import { randomInt } from './tools';

/**
 * 保存按钮
 */
const ICON_SVG = `<svg preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24" width="1.2em" height="1.2em" data-v-5d9e4641=""><path fill="currentColor" d="M7 6V3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3v3c0 .552-.45 1-1.007 1H4.007A1.001 1.001 0 0 1 3 21l.003-14c0-.552.45-1 1.007-1H7zM5.003 8L5 20h10V8H5.003zM9 6h8v10h2V4H9v2z"></path></svg>`;

export const doubleDollar = /(?<=\$\$).*?(?=\$\$)/;
export const doubleWell = /(?<=##).*?(?=##)/;
export const link = /\bhttps?:\/\/[\w/.-]+(?<![.,。，])/g;
// #region ----------------------------------------< markedjs 配置 >--------------------------------------
/**
 * markedjs 配置
 */
marked.setOptions({
  gfm: true, // 启动类似于Github样式的Markdown语法
  breaks: false, // 支持Github换行符，必须打开gfm选项
  pedantic: false, // 只解析符合Markdwon定义的，不修正Markdown的错误
  // 高亮的语法规范
  highlight: (code: string, lang: string) =>
    hljs.highlight(code, { language: lang }).value,
});

// #endregion

// #region ----------------------------------------< renderer >--------------------------------------
/**
 * 自定义代码块内容解析
 * @param code 解析后的HTML代码
 * @param language 语言
 * @returns
 */
export const renderCode = (
  code: string,
  language: string | undefined,
): string => {
  const id = `pre-${Date.now()}-${randomInt()}`;
  return `<pre><div class="code-toolbar"><span>${language}</span><i class="pre-copy" onclick="onHtmlEventDispatch(this,'click',event,'copyPreCode','${id}')">${ICON_SVG}</i></div><code id="${id}" class="hljs language-${language}">${code}</code></pre>`;
};

/**
 * 解析网页链接内容
 * @param href
 * @param text
 * @returns
 */
export const renderLink = (href: string, text: string): string => {
  if (href === text) {
    const txt = text.replace(link, '');
    const url = (href.match(link) ?? [])[0];
    return `<a href="${url}" target="_blank">${url}</a>${txt}`;
  }
  return `<a href="${href}" target="_blank">${text}</a>`;
};

/**
 * 自定义渲染
 */
const renderer = {
  code(code: string, infostring: string | undefined): string {
    return renderCode(code, infostring);
  },
  link(href: string, title: string | null | undefined, text: string): string {
    return renderLink(href, text);
  },
};

marked.use({ renderer });
// #endregion
export default marked;

// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.
export interface INLSConfiguration {
  /**
   * Locale as defined in `argv.json` or `app.getLocale()`.
   */
  readonly userLocale: string;

  /**
   * Locale as defined by the OS (e.g. `app.getPreferredSystemLanguages()`).
   */
  readonly osLocale: string;

  /**
   * The actual language of the UI that ends up being used considering `userLocale`
   * and `osLocale`.
   */
  readonly resolvedLanguage: string;
}

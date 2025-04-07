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

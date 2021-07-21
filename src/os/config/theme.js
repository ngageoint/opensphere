goog.module('os.config.theme');
goog.module.declareLegacyNamespace();

/**
 * @enum {string}
 */
const Keys = {
  THEME: 'theme', // NOTE: this is in namespace.js as a cross application core setting. If you change it update there.
  THEMES: 'themes',
  ACCESSIBLE_THEMES: 'accessible_themes',
  ACCESSIBLE_THEME: 'accessible_theme'
};

/**
 * The default theme name.
 * @type {string}
 * @const
 */
const DEFAULT_THEME = 'Default';


/**
 * Default `themes` setting object. This should always be in config, so this is intended to be a fail-safe. If the
 * default theme changes in config, please update this.
 * @type {!Object<string, string>}
 * @const
 */
const DEFAULT_THEMES = {
  'Default': 'overrides_slate_compact'
};

exports = {
  Keys,
  DEFAULT_THEME,
  DEFAULT_THEMES
};

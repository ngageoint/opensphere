goog.module('os.ui.text.TuiEditor');
goog.module.declareLegacyNamespace();

const {APP_ROOT} = goog.require('os');

/**
 * @type {string}
 */
const MODE_KEY = 'tuieditor.mode';

/**
 * @type {string}
 */
const READY = 'tui.editor.ready';

/**
 * The URL to the Javascript library.
 * @type {string}
 */
const SCRIPT_URL = APP_ROOT + 'vendor/os-minified/os-toastui-editor.min.js';

/**
 * @enum {string}
 */
const Mode = {
  WYSIWYG: 'wysiwyg',
  MARKDOWN: 'markdown'
};

exports = {
  MODE_KEY,
  READY,
  SCRIPT_URL,
  Mode
};

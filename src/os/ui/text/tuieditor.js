goog.declareModuleId('os.ui.text.TuiEditor');

import {APP_ROOT} from '../../os.js';
import {getMarkdownIt} from './tuieditormarkdownit.js';
const {assert} = goog.require('goog.asserts');
const {normalizeSpaces, normalizeWhitespace} = goog.require('goog.string');


/**
 * @type {string}
 */
export const MODE_KEY = 'tuieditor.mode';

/**
 * @type {string}
 */
export const READY = 'tui.editor.ready';

/**
 * The URL to the Javascript library.
 * @type {string}
 */
export const SCRIPT_URL = APP_ROOT + 'vendor/os-minified/os-toastui-editor.min.js';

/**
 * @enum {string}
 */
export const Mode = {
  WYSIWYG: 'wysiwyg',
  MARKDOWN: 'markdown'
};

/**
 * @param {string=} opt_markdown
 * @return {string} - markdown parsed to html
 */
export const render = function(opt_markdown) {
  const markdownIt = getMarkdownIt();
  assert(markdownIt != null, 'markdownit is not available!');
  return opt_markdown ? markdownIt.render(opt_markdown) : '';
};

/**
 * Convert markdown text to html free string.
 * @param {string=} opt_markdown
 * @return {string}
 */
export const getUnformatedText = function(opt_markdown) {
  var html = $(render(opt_markdown));
  if (html && html.length) {
    return normalizeSpaces(normalizeWhitespace(/** @type {string} */ (html.text())));
  } else {
    return '';
  }
};

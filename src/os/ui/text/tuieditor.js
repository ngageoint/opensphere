goog.module('os.ui.text.TuiEditor');

const {APP_ROOT} = goog.require('os');
const {assert} = goog.require('goog.asserts');
const {getMarkdownIt} = goog.require('os.ui.text.TuiEditorMarkdownIt');
const {normalizeSpaces, normalizeWhitespace} = goog.require('goog.string');

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

/**
 * @param {string=} opt_markdown
 * @return {string} - markdown parsed to html
 */
const render = function(opt_markdown) {
  const markdownIt = getMarkdownIt();
  assert(markdownIt != null, 'markdownit is not available!');
  return opt_markdown ? markdownIt.render(opt_markdown) : '';
};

/**
 * Convert markdown text to html free string.
 * @param {string=} opt_markdown
 * @return {string}
 */
const getUnformatedText = function(opt_markdown) {
  var html = $(render(opt_markdown));
  if (html && html.length) {
    return normalizeSpaces(normalizeWhitespace(/** @type {string} */ (html.text())));
  } else {
    return '';
  }
};

exports = {
  MODE_KEY,
  READY,
  SCRIPT_URL,
  Mode,
  render,
  getUnformatedText
};

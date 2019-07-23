goog.provide('os.ui.text.TuiEditorMarkdownIt');


/**
 * @type {Markdownit}
 */
os.ui.text.TuiEditorMarkdownIt = markdownit({
  'html': true,
  'breaks': true,
  'quotes': '“”‘’',
  'langPrefix': 'lang-'
});


/**
 *
 * ATTENTION: This is not our code. this is tui-editors addtion to markdownit.
 * This gives us the ability to lazy load the editor, but include the viewer as light as possible
 * If we dont lazy load the editor / viewer, we no longer need this
 *
 * DO NOT CHANGE YOURSELF
 *
 * COPY AND PASTE FROM node_modules/tui-editor/dist/tui-editor-Editor.js
 * Future checkout https://github.com/nhn/tui.editor/blob/master/src/js/markdownItPlugins/markdownitTaskPlugin.js
 */
(function() {
  /**
   * Remove task format text for rendering
   * @param {Object} token Token object
   */
  var removeMarkdownTaskFormatText = function(token) {
    // '[X] ' length is 4
    // FIXED: we don't need first space
    token['content'] = token['content'].slice(4);
    token['children'][0]['content'] = token['children'][0]['content'].slice(4);
  };


  /**
   * Return boolean value whether task list item or not
   * @param {Array} tokens Token object
   * @param {number} index Number of token index
   * @return {boolean}
   */
  var isTaskListItemToken = function(tokens, index) {
    return tokens[index]['type'] === 'inline' && tokens[index - 1]['type'] === 'paragraph_open' &&
          tokens[index - 2]['type'] === 'list_item_open' && (tokens[index]['content'].indexOf('[ ]') === 0 ||
          tokens[index]['content'].indexOf('[x]') === 0 || tokens[index]['content'].indexOf('[X]') === 0);
  };


  /**
   * Return boolean value whether task checked or not
   * @param {Object} token Token object
   * @return {boolean}
   */
  var isChecked = function(token) {
    var checked = false;

    if (token['content'].indexOf('[x]') === 0 || token['content'].indexOf('[X]') === 0) {
      checked = true;
    }

    return checked;
  };


  /**
   * Set attribute of passed token
   * @param {Markdownit.Token} token Token object
   * @param {string} attributeName Attribute name for set
   * @param {string} attributeValue Attribute value for set
   * @suppress {accessControls|duplicate|checkTypes}
   */
  var setTokenAttribute = function(token, attributeName, attributeValue) {
    var index = token.attrIndex(attributeName);
    var attr = [attributeName, attributeValue];

    if (index < 0) {
      token.attrPush(attr);
    } else {
      token.attrs[index] = attr;
    }
  };


  /**
   * @param {Object} state
   * @suppress {accessControls|duplicate|checkTypes}
   */
  var tasklistrule = function(state) {
    var TASK_LIST_ITEM_CLASS_NAME = 'task-list-item';
    var CHECKED_CLASS_NAME = 'checked';
    var tokens = state['tokens'];
    var className;
    var tokenIndex;

    // tokenIndex=0 'ul', tokenIndex=1 'li', tokenIndex=2 'p_open'
    for (tokenIndex = 2; tokenIndex < tokens.length; tokenIndex += 1) {
      if (isTaskListItemToken(tokens, tokenIndex)) {
        if (isChecked(tokens[tokenIndex])) {
          className = TASK_LIST_ITEM_CLASS_NAME + ' ' + CHECKED_CLASS_NAME;
        } else {
          className = TASK_LIST_ITEM_CLASS_NAME;
        }

        removeMarkdownTaskFormatText(tokens[tokenIndex]);

        setTokenAttribute(tokens[tokenIndex - 2], 'class', className);
        setTokenAttribute(tokens[tokenIndex - 2], 'data-te-task', '');
      }
    }
  };

  os.ui.text.TuiEditorMarkdownIt.core.ruler.after('inline', 'tui-task-list', tasklistrule);
})();

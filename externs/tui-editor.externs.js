/**
 * @fileoverview Externs for Toast UI Editor
 *
 * @externs
 */
var toastui = {};


/**
 * @constructor
 */
toastui.EventManager = function() {};


/**
 * @param {string} eventName
 * @param {*} cb
 */
toastui.EventManager.prototype.listen = function(eventName, cb) {};


/**
 * @param {string} eventName
 */
toastui.EventManager.prototype.addEventType = function(eventName) {};


/**
 * @param {string} eventName
 */
toastui.EventManager.prototype.emit = function(eventName) {};


/**
 * @constructor
 * @param {Object} options
 */
toastui.Editor = function(options) {
  /**
   * @type {toastui.EventManager}
   */
  this.eventManager;

  /**
   * @type {Object}
   */
  this.i18n;
};


/**
 * @return {string}
 */
toastui.Editor.prototype.getHtml = function() {};


/**
 * @return {string}
 */
toastui.Editor.prototype.getValue = function() {};


/**
 * @param {string} markdown
 */
toastui.Editor.prototype.setValue = function(markdown) {};


/**
 * @return {boolean}
 */
toastui.Editor.prototype.isViewer = function() {};


/**
 * @return {boolean}
 */
toastui.Editor.prototype.isMarkdownMode = function() {};


/**
 * @return {boolean}
 */
toastui.Editor.prototype.isWysiwygMode = function() {};


/**
 * @param {string} text
 */
toastui.Editor.prototype.insertText = function(text) {};


/**
 * @param {Object} range
 * @return {Object}
 */
toastui.Editor.prototype.getTextObject = function(range) {};


/**
 * @param {string} text
 */
toastui.Editor.prototype.replaceContent = function(text) {};


/**
 * @return {string}
 */
toastui.Editor.prototype.getTextContent = function() {};


/**
 * @return {toastui.UI}
 */
toastui.Editor.prototype.getUI = function() {};


/**
 * @return {toastui.Squire}
 */
toastui.Editor.prototype.getSquire = function() {};


/**
 * @param {string} command
 * @param {Object} options
 */
toastui.Editor.prototype.addCommand = function(command, options) {};


/**
 * @type {Object}
 */
toastui.Editor.markdownit = {};


/**
 * @param {string} markdown
 * @return {string}
 */
toastui.Editor.markdownit.render = function(markdown) {};


/**
 * @param {Object} options
 * @return {Object}
 */
toastui.Editor.factory = function(options) {};


/**
 * @type {Object}
 */
toastui.Editor.mdEditor = {};


/**
 * @type {Object}
 */
toastui.Editor.mdEditor.cm = {};


/**
 * kicks codemirror to update
 */
toastui.Editor.mdEditor.cm.refresh = function() {};


/**
 * @param {string} position
 * @return {toastui.CodeMirrorSelection}
 */
toastui.Editor.mdEditor.cm.getCursor = function(position) {};


/**
 * @return {string}
 */
toastui.Editor.mdEditor.cm.getSelection = function() {};


/**
 * @param {Object} set
 */
toastui.Editor.mdEditor.cm.setSelection = function(set) {};


/**
 * @param {string} replace
 */
toastui.Editor.mdEditor.cm.replaceSelection = function(replace) {};


/**
 * @typedef {{
 *  ch: number,
 *   line: number
 * }}
 */
toastui.CodeMirrorSelection;

/**
 * @constructor
 */
toastui.Editor.wwEditor;


/**
 * @return {toastui.Squire}
 */
toastui.Editor.wwEditor.prototype.getEditor = function() {};


/**
 * @type {Object}
 */
toastui.Editor.wwEditor.componentManager;


/**
 * @constructor
 */
toastui.ComponentManager;


/**
 * @param {string} selector
 * @return {toastui.SelectionManager}
 */
toastui.ComponentManager.getManager = function(selector) {};


/**
 * @constructor
 */
toastui.SelectionManager;


/**
 * @return {Array}
 */
toastui.SelectionManager.prototype.getSelectedCells = function() {};


/**
 * @param {function()} cb
 * @param {string} color
 */
toastui.SelectionManager.prototype.styleToSelectedCells = function(cb, color) {};


/**
 * @param {string} code
 * @param {Object} data
 */
toastui.Editor.setLanguage = function(code, data) {};


/**
 * @constructor
 */
toastui.Squire;


/**
 * @param {*} a
 * @param {Object} b
 */
toastui.Squire.prototype.changeFormat = function(a, b) {};


/**
 * @return {Object}
 */
toastui.Squire.prototype.getSelection = function() {};


/**
 * @param {string} selection
 * @return {boolean}
 */
toastui.Squire.prototype.hasFormat = function(selection) {};


/**
 * @param {Object} selection
 */
toastui.Squire.prototype.setSelection = function(selection) {};


/**
 * @param {string} color
 */
toastui.Squire.prototype.setTextColour = function(color) {};


/**
 * @return {toastui.Squire.Root}
 */
toastui.Squire.prototype.getRoot = function() {};


/**
 * @typedef {{
 *  parentNode: {
 *    scrollTop: number
 *  },
 *  scrollTop: number
 * }}
 */
toastui.Squire.Root;


/**
 * @constructor
 */
toastui.UI;


/**
 * @return {toastui.Toolbar}
 */
toastui.UI.prototype.getToolbar = function() {};


/**
 * @param {Object} settings
 * @return {toastui.Popup}
 */
toastui.UI.prototype.createPopup = function(settings) {};


/**
 * @constructor
 */
toastui.Toolbar = function() {
  /**
   * @type {Object}
   */
  this.el;
};


/**
 * @param {number} index
 * @param {Object} options
 */
toastui.Toolbar.prototype.insertItem = function(index, options) {};


/**
 * @param {string} name
 * @return {number}
 */
toastui.Toolbar.prototype.indexOfItem = function(name) {};


/**
 * @param {number} index
 * @return {Object}
 */
toastui.Toolbar.prototype.getItem = function(index) {};


/**
 * @constructor
 */
toastui.Popup;


/**
 * @return {boolean}
 */
toastui.Popup.show = function() {};


/**
 * @return {boolean}
 */
toastui.Popup.hide = function() {};


/**
 * @return {boolean}
 */
toastui.Popup.isShow = function() {};


/**
 * @return {boolean}
 */
toastui.Popup.remove = function() {};

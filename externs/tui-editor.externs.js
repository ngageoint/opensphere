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
 * @param {function()} cb
 */
toastui.EventManager.prototype.listen = function(eventName, cb) {};


/**
 * @param {string} eventName
 * @param {function()} cb
 */
toastui.EventManager.prototype.addEventType = function(eventName, cb) {};


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
toastui.Editor.prototype.isMarkdownMode = function() {};


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
 * @type {Object<string, Map>}
 */
toastui.Editor.i18n = {'_langs': {}};


/**
 * @param {string} code
 * @param {Object} data
 */
toastui.Editor.setLanguage = function(code, data) {};

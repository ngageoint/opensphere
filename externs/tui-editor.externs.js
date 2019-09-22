/**
 * @fileoverview Externs for Toast UI Editor
 *
 * @externs
 */
var tui = {};


/**
 * @constructor
 */
tui.EventManager = function() {};


/**
 * @param {string} eventName
 * @param {function()} cb
 */
tui.EventManager.prototype.listen = function(eventName, cb) {};


/**
 * @param {string} eventName
 * @param {function()} cb
 */
tui.EventManager.prototype.addEventType = function(eventName, cb) {};


/**
 * @param {string} eventName
 */
tui.EventManager.prototype.emit = function(eventName) {};


/**
 * @constructor
 * @param {Object} options
 */
tui.Editor = function(options) {
  /**
   * @type {tui.EventManager}
   */
  this.eventManager;
};


/**
 * @return {string}
 */
tui.Editor.prototype.getHtml = function() {};


/**
 * @return {string}
 */
tui.Editor.prototype.getValue = function() {};


/**
 * @param {string} markdown
 */
tui.Editor.prototype.setValue = function(markdown) {};


/**
 * @return {boolean}
 */
tui.Editor.prototype.isMarkdownMode = function() {};


/**
 * @param {string} text
 */
tui.Editor.prototype.insertText = function(text) {};


/**
 * @type {Object}
 */
tui.Editor.markdownit = {};


/**
 * @param {string} markdown
 * @return {string}
 */
tui.Editor.markdownit.render = function(markdown) {};


/**
 * @param {Object} options
 * @return {Object}
 */
tui.Editor.factory = function(options) {};


/**
 * @type {Object}
 */
tui.Editor.mdEditor = {};

/**
 * @type {Object}
 */
tui.Editor.mdEditor.cm = {};


/**
 * kicks codemirror to update
 */
tui.Editor.mdEditor.cm.refresh = function() {};


/**
 * @type {Object<string, Map>}
 */
tui.Editor.i18n = {'_langs': {}};

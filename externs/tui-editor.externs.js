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
 * @type {Object}
 */
tui.Editor.markdownitHighlight = {};


/**
 * @param {string} markdown
 * @return {string}
 */
tui.Editor.markdownitHighlight.render = function(markdown) {};


/**
 * @param {Object} options
 * @return {Object}
 */
tui.Editor.factory = function(options) {};

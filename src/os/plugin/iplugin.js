goog.provide('os.plugin.IPlugin');

goog.require('goog.Promise');
goog.require('goog.disposable.IDisposable');



/**
 * The interface which describes a plugin.
 * @extends {goog.disposable.IDisposable}
 * @interface
 */
os.plugin.IPlugin = function() {};


/**
 * @return {!string} The unique ID of the plugin.
 */
os.plugin.IPlugin.prototype.getId;


/**
 * @return {?string} The error message if the plugin failed to initialize.
 */
os.plugin.IPlugin.prototype.getError;


/**
 * Initialize the plugin. Asynchronous loading is supported by returning a promise. HOwever, it should be noted
 * that plugin initialization blocks the application from loading, so the plugin manager will cancel promises
 * that are not resolved in short order.
 *
 * @return {goog.Promise|undefined} The promise for asynchronous init, or undefined for synchronous init
 */
os.plugin.IPlugin.prototype.init;

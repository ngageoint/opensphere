goog.declareModuleId('os.plugin.IPlugin');

const Promise = goog.requireType('goog.Promise');
const IDisposable = goog.requireType('goog.disposable.IDisposable');


/**
 * The interface which describes a plugin.
 *
 * @extends {IDisposable}
 * @interface
 */
export default class IPlugin {
  /**
   * @return {!string} The unique ID of the plugin.
   */
  getId() {}

  /**
   * @return {?string} The error message if the plugin failed to initialize.
   */
  getError() {}

  /**
   * Initialize the plugin. Asynchronous loading is supported by returning a promise. HOwever, it should be noted
   * that plugin initialization blocks the application from loading, so the plugin manager will cancel promises
   * that are not resolved in short order.
   *
   * @return {Promise|undefined} The promise for asynchronous init, or undefined for synchronous init
   */
  init() {}
}

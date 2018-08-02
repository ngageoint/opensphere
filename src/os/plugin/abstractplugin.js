goog.provide('os.plugin.AbstractPlugin');

goog.require('goog.Disposable');
goog.require('os.plugin.IPlugin');



/**
 * @abstract
 * @implements {os.plugin.IPlugin}
 * @extends {goog.Disposable}
 * @constructor
 */
os.plugin.AbstractPlugin = function() {
  os.plugin.AbstractPlugin.base(this, 'constructor');

  /**
   * @type {!string}
   * @protected
   */
  this.id = '';

  /**
   * @type {?string}
   * @protected
   */
  this.error = null;
};
goog.inherits(os.plugin.AbstractPlugin, goog.Disposable);


/**
 * @inheritDoc
 */
os.plugin.AbstractPlugin.prototype.getId = function() {
  return this.id;
};


/**
 * @inheritDoc
 */
os.plugin.AbstractPlugin.prototype.getError = function() {
  return this.error;
};


/**
 * @inheritDoc
 */
os.plugin.AbstractPlugin.prototype.init = goog.abstractMethod;

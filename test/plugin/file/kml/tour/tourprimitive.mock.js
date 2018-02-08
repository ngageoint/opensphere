goog.provide('plugin.file.kml.tour.MockTourPrimitive');

goog.require('plugin.file.kml.tour.AbstractTourPrimitive');


/**
 * Mock tour primitive.
 * @param {boolean=} opt_waitForResolve If the execute function should wait to resolve the promise.
 * @extends {plugin.file.kml.tour.AbstractTourPrimitive}
 * @constructor
 */
plugin.file.kml.tour.MockTourPrimitive = function(opt_waitForResolve) {
  plugin.file.kml.tour.MockTourPrimitive.base(this, 'constructor');

  /**
   * How many times the pause function was called.
   * @type {number}
   */
  this.executedCount = 0;

  /**
   * How many times the pause function was called.
   * @type {number}
   */
  this.pausedCount = 0;

  /**
   * How many times the reset function was called.
   * @type {number}
   */
  this.resetCount = 0;

  /**
   * If the execute promise should wait to resolve. Saves the resolve function to `this.resolver`.
   * @type {boolean}
   */
  this.waitForResolve = opt_waitForResolve || false;

  /**
   * Promise resolve function.
   * @type {function()|undefined}
   */
  this.resolver = undefined;
};
goog.inherits(plugin.file.kml.tour.MockTourPrimitive, plugin.file.kml.tour.AbstractTourPrimitive);


/**
 * @inheritDoc
 */
plugin.file.kml.tour.MockTourPrimitive.prototype.execute = function() {
  this.executedCount++;

  return new goog.Promise(function(resolve, reject) {
    if (!this.waitForResolve) {
      resolve();
    } else {
      this.resolver = resolve;
    }
  }, this);
};


/**
 * @inheritDoc
 */
plugin.file.kml.tour.MockTourPrimitive.prototype.pause = function() {
  this.pausedCount++;
  this.resolver = undefined;
};


/**
 * @inheritDoc
 */
plugin.file.kml.tour.MockTourPrimitive.prototype.reset = function() {
  this.resetCount++;
  this.resolver = undefined;
};

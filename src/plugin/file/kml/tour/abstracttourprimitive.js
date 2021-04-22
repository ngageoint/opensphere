goog.provide('plugin.file.kml.tour.AbstractTourPrimitive');

goog.require('os.fn');


/**
 * Abstract KML tour primitive.
 *
 * @abstract
 * @constructor
 */
plugin.file.kml.tour.AbstractTourPrimitive = function() {
  /**
   * If the tour primitive executes asynchronously.
   * @type {boolean}
   */
  this.isAsync = false;
};


/**
 * Execute the tour instruction.
 *
 * @abstract
 * @return {!goog.Promise} A promise that resolves when execution completes.
 */
plugin.file.kml.tour.AbstractTourPrimitive.prototype.execute = function() {};


/**
 * Pause tour instruction execution.
 */
plugin.file.kml.tour.AbstractTourPrimitive.prototype.pause = os.fn.noop;


/**
 * Reset the tour primitive.
 */
plugin.file.kml.tour.AbstractTourPrimitive.prototype.reset = os.fn.noop;

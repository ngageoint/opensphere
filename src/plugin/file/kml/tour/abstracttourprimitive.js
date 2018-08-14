goog.provide('plugin.file.kml.tour.AbstractTourPrimitive');


/**
 * Abstract KML tour primitive.
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
 * @return {!goog.Promise} A promise that resolves when execution completes.
 */
plugin.file.kml.tour.AbstractTourPrimitive.prototype.execute = goog.abstractMethod;


/**
 * Pause tour instruction execution.
 */
plugin.file.kml.tour.AbstractTourPrimitive.prototype.pause = goog.nullFunction;


/**
 * Reset the tour primitive.
 */
plugin.file.kml.tour.AbstractTourPrimitive.prototype.reset = goog.nullFunction;

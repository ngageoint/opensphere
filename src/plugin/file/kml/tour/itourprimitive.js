goog.provide('plugin.file.kml.tour.ITourPrimitive');


/**
 * @interface
 */
plugin.file.kml.tour.ITourPrimitive = function() {};


/**
 * Execute the tour instruction.
 * @return {!goog.Promise} A promise that resolves when execution completes.
 */
plugin.file.kml.tour.ITourPrimitive.prototype.execute;


/**
 * Pause tour instruction execution.
 */
plugin.file.kml.tour.ITourPrimitive.prototype.pause;


/**
 * Reset the tour primitive.
 */
plugin.file.kml.tour.ITourPrimitive.prototype.reset;

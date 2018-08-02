goog.provide('plugin.arc.query.ArcTemporalFormatter');
goog.require('os.query.ITemporalFormatter');



/**
 * @implements {os.query.ITemporalFormatter}
 * @constructor
 */
plugin.arc.query.ArcTemporalFormatter = function() {};


/**
 * @inheritDoc
 */
plugin.arc.query.ArcTemporalFormatter.prototype.format = function(controller) {
  return controller.getStart() + ', ' + controller.getEnd();
};

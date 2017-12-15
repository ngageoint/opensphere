goog.provide('os.query.TemporalFormatter');
goog.require('os.query.ITemporalFormatter');
goog.require('os.time');



/**
 * Base implementation of a temporal formatter
 * @implements {os.query.ITemporalFormatter}
 * @constructor
 */
os.query.TemporalFormatter = function() {
  /**
   * @type {?string}
   * @private
   */
  this.datePattern_ = null;
};


/**
 * Set the start column.
 * @param {?string} value
 */
os.query.TemporalFormatter.prototype.setStartColumn = function(value) {
};


/**
 * Set the end column.
 * @param {?string} value
 */
os.query.TemporalFormatter.prototype.setEndColumn = function(value) {
};


/**
 * Sets the date format from a string
 * @param {?string} value
 */
os.query.TemporalFormatter.prototype.setDateFormat = function(value) {
  this.datePattern_ = value;
};


/**
 * @inheritDoc
 */
os.query.TemporalFormatter.prototype.format = function(controller) {
  var start = '';
  var end = '';
  if (!this.datePattern_) {
    start = os.time.format(new Date(controller.getStart()), undefined, false, true);
    end = os.time.format(new Date(controller.getEnd()), undefined, false, true);
  } else {
    start = os.time.momentFormat(new Date(controller.getStart()), this.datePattern_, true);
    end = os.time.momentFormat(new Date(controller.getEnd()), this.datePattern_, true);
  }


  return start + '/' + end;
};

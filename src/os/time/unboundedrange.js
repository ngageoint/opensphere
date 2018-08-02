goog.provide('os.time.UnboundedRange');
goog.require('os.time.TimeInstant');



/**
 * A time range for all time
 * @constructor
 * @extends {os.time.TimeInstant}
 */
os.time.UnboundedRange = function() {
  os.time.UnboundedRange.base(this, 'constructor');
};
goog.inherits(os.time.UnboundedRange, os.time.TimeInstant);


/**
 * Always returns the minimum time
 * @return {number} the minimum time
 * @override
 */
os.time.UnboundedRange.prototype.getStart = function() {
  return os.time.TimeInstant.MIN_TIME;
};


/**
 * Always returns the maximum time
 * @return {number} the maximum time
 * @override
 */
os.time.UnboundedRange.prototype.getEnd = function() {
  return os.time.TimeInstant.MAX_TIME;
};

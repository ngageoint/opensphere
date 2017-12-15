goog.provide('os.alert.Alert');
goog.require('os.alert.AlertEventSeverity');



/**
 * Object to carry around alert details
 * @param {string} message The alert to send and add to the window
 * @param {os.alert.AlertEventSeverity=} opt_severity Severity of the event, defaults to error
 * @constructor
 */
os.alert.Alert = function(message, opt_severity) {
  /**
   * @type {string}
   * @private
   */
  this.message_ = message;

  /**
   * @type {os.alert.AlertEventSeverity|undefined}
   * @private
   */
  this.severity_ = opt_severity;
};


/**
 * @return {string}
 */
os.alert.Alert.prototype.getMessage = function() {
  return this.message_;
};


/**
 * @return {os.alert.AlertEventSeverity|undefined}
 */
os.alert.Alert.prototype.getSeverity = function() {
  return this.severity_;
};

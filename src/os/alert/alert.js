goog.declareModuleId('os.alert.Alert');

const {default: AlertEventSeverity} = goog.requireType('os.alert.AlertEventSeverity');


/**
 * Object to carry around alert details.
 */
export default class Alert {
  /**
   * @param {string} message The alert to send and add to the window
   * @param {AlertEventSeverity=} opt_severity Severity of the event, defaults to error
   */
  constructor(message, opt_severity) {
    /**
     * The alert message.
     * @type {string}
     * @private
     */
    this.message_ = message;

    /**
     * The alert severity.
     * @type {AlertEventSeverity|undefined}
     * @private
     */
    this.severity_ = opt_severity;
  }

  /**
   * Get the alert message.
   * @return {string}
   */
  getMessage() {
    return this.message_;
  }

  /**
   * Get the alert severity.
   * @return {AlertEventSeverity|undefined}
   */
  getSeverity() {
    return this.severity_;
  }
}

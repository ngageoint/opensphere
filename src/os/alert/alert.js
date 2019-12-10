goog.module('os.alert.Alert');
goog.module.declareLegacyNamespace();

const AlertEventSeverity = goog.require('os.alert.AlertEventSeverity'); // eslint-disable-line no-unused-vars


/**
 * Object to carry around alert details.
 */
class Alert {
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

exports = Alert;

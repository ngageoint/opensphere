goog.module('os.alert.AlertManager');
goog.module.declareLegacyNamespace();

goog.require('goog.events.EventTarget');
goog.require('goog.log');
goog.require('goog.structs.CircularBuffer');
goog.require('os.alert.AlertEvent');
goog.require('os.array');
goog.require('os.structs.EventType');

const AlertEventSeverity = goog.require('os.alert.AlertEventSeverity');
const AlertEventType = goog.require('os.alert.EventType');


/**
 * Maximum number of alerts to be saved.
 * @type {number}
 */
const maxSaved_ = 10000;

/**
 * Responsible for receiving, logging and reporting alerts
 * @extends {goog.events.EventTarget}
 */
class AlertManager extends goog.events.EventTarget {
  /**
   */
  constructor() {
    super();

    /**
     * @type {!goog.structs.CircularBuffer.<!os.alert.AlertEvent>}
     * @private
     */
    this.savedAlerts_ = new goog.structs.CircularBuffer(maxSaved_);

    /**
     * Tracks the number of alerts process by any given client so the client can get all alerts even if it comes online
     * later.
     * @type {!Object.<!string, !number>}
     * @private
     */
    this.processedByClientCount_ = {};

    /**
     * Ensures that processMissedAlerts is only called once
     * @type {boolean}
     * @private
     */
    this.missedAlertsProcessed_ = false;

    /**
     * Ensures that an alert is only sent once
     * @type {Object<string, boolean>}
     * @private
     */
    this.onceMap_ = {};
  }

  /**
   * Maximum number of alerts to be saved.
   * @return {number}
   */
  static get MAX_SAVED() {
    return maxSaved_;
  }

  /**
   * Global alert manager instance.
   * @return {AlertManager}
   */
  static getInstance() {
    return instance_;
  }

  /**
   * Takes a string and converts it into an alert event, then dispatches it
   *
   * @param {string} alert The alert to send and add to the window
   * @param {AlertEventSeverity=} opt_severity Severity of the event, defaults to error
   * @param {goog.log.Logger=} opt_logger If provided, writes the message to this logger
   * @param {number=} opt_limit Maximum number of duplicate alerts to display, defaults to 5
   * @param {goog.events.EventTarget=} opt_dismissDispatcher Event target which will indicate when to dismiss the alert
   *   by dispatching a {@code os.alert.AlertEventTypes.DISMISS_ALERT} event
   */
  sendAlert(alert, opt_severity, opt_logger, opt_limit, opt_dismissDispatcher) {
    const severity = opt_severity || AlertEventSeverity.ERROR;

    // fire off the alert
    const alertEvent = new os.alert.AlertEvent(alert, severity, opt_limit, opt_dismissDispatcher);
    this.savedAlerts_.add(alertEvent);
    this.dispatchEvent(alertEvent);

    // write the message to the logger if defined
    if (opt_logger != null) {
      switch (severity) {
        case AlertEventSeverity.ERROR:
          goog.log.error(opt_logger, alert);
          break;
        case AlertEventSeverity.WARNING:
          goog.log.warning(opt_logger, alert);
          break;
        case AlertEventSeverity.INFO:
        case AlertEventSeverity.SUCCESS:
        default:
          goog.log.info(opt_logger, alert);
          break;
      }
    }
  }

  /**
   * Check an alert string against onceMap_ before sending an alert
   *
   * @param {string} alert The alert to send and add to the window
   * @param {AlertEventSeverity=} opt_severity Severity of the event, defaults to error
   * @param {goog.log.Logger=} opt_logger If provided, writes the message to this logger
   * @param {number=} opt_limit Maximum number of duplicate alerts to display, defaults to 5
   * @param {goog.events.EventTarget=} opt_dismissDispatcher Event target which will indicate when to dismiss the alert
   *   by dispatching a {@code os.alert.AlertEventTypes.DISMISS_ALERT} event
   */
  sendAlertOnce(alert, opt_severity, opt_logger, opt_limit, opt_dismissDispatcher) {
    if (this.onceMap_[alert]) {
      return;
    } else {
      this.onceMap_[alert] = true;
      opt_limit = 1;
      this.sendAlert(alert, opt_severity, opt_logger, opt_limit, opt_dismissDispatcher);
    }
  }

  /**
   * Clear the alert buffer
   */
  clearAlerts() {
    this.savedAlerts_.clear();
    this.dispatchEvent(AlertEventType.CLEAR_ALERTS);
  }

  /**
   * Get the alert buffer
   *
   * @return {!goog.structs.CircularBuffer.<!os.alert.AlertEvent>} Object containing the parsed record
   */
  getAlerts() {
    return this.savedAlerts_;
  }

  /**
   * Process alerts that AlertManager may have already generated before this class has initialized.
   *
   * @param {!string} clientId An arbitrary string to identify the client that is processing alerts
   * @param {!function(os.alert.AlertEvent)} handler
   * @param {*=} opt_context
   */
  processMissedAlerts(clientId, handler, opt_context) {
    if (!this.missedAlertsProcessed_) {
      const beforeCount = this.processedByClientCount_[clientId] || 0;
      const alerts = goog.array.slice(this.savedAlerts_.getValues(), 0, this.savedAlerts_.getCount() - beforeCount);
      os.array.forEach(alerts, handler, opt_context);
      this.processedByClientCount_[clientId] = this.savedAlerts_.getCount();
      this.missedAlertsProcessed_ = true;
    }
  }
}

/**
 * Global alert manager instance.
 * @type {AlertManager}
 */
const instance_ = new AlertManager();

exports = AlertManager;

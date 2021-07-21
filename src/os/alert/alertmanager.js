goog.module('os.alert.AlertManager');
goog.module.declareLegacyNamespace();

const EventTarget = goog.require('goog.events.EventTarget');
const log = goog.require('goog.log');
const CircularBuffer = goog.require('goog.structs.CircularBuffer');
const AlertEvent = goog.require('os.alert.AlertEvent');
const AlertEventSeverity = goog.require('os.alert.AlertEventSeverity');
const AlertEventType = goog.require('os.alert.EventType');


/**
 * Maximum number of alerts to be saved.
 * @type {number}
 */
const maxSaved_ = 10000;

/**
 * Default severity
 * @type {AlertEventSeverity}
 */
const defaultSeverity_ = AlertEventSeverity.ERROR;

/**
 * Default throttle time for alerts in milliseconds.
 * @type {number}
 */
const defaultThrottleTime_ = 500;

/**
 * Responsible for receiving, logging and reporting alerts
 */
class AlertManager extends EventTarget {
  /**
   */
  constructor() {
    super();

    /**
     * @type {!CircularBuffer<!AlertEvent>}
     * @private
     */
    this.savedAlerts_ = new CircularBuffer(maxSaved_);

    /**
     * Tracks the number of alerts process by any given client so the client can get all alerts even if it comes online
     * later.
     * @type {!Object<!string, !number>}
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

    /**
     * Ensures that an alert is only sent once per throttle interval
     * @type {!Object<string, !Object<AlertEventSeverity, !Array<function()>>>}
     * @private
     */
    this.throttleMap_ = {};
  }

  /**
   * Maximum number of alerts to be saved.
   * @type {number}
   */
  static get MAX_SAVED() {
    return maxSaved_;
  }

  /**
   * Get the global alert manager instance.
   * @return {!AlertManager}
   */
  static getInstance() {
    if (!instance) {
      instance = new AlertManager();
    }

    return instance;
  }

  /**
   * Set the global alert manager instance.
   * @param {AlertManager} value The AlertManager instance to set.
   */
  static setInstance(value) {
    instance = value;
  }

  /**
   * Send an alert
   *
   * @param {string} alert The alert to send and add to the window
   * @param {AlertEventSeverity=} opt_severity Severity of the event, defaults to error
   * @param {goog.log.Logger=} opt_logger If provided, writes the message to this logger
   * @param {number=} opt_limit Maximum number of duplicate alerts to display, defaults to 5
   * @param {goog.events.EventTarget=} opt_dismissDispatcher Event target which will indicate when to dismiss the alert
   *   by dispatching a {@code os.alert.AlertEventTypes.DISMISS_ALERT}
   * @param {number=} opt_throttleTime Time after which another duplicate alert will be allowed
   * @return {Promise}
   */
  sendAlert(alert, opt_severity, opt_logger, opt_limit, opt_dismissDispatcher, opt_throttleTime) {
    return new Promise((resolve, reject) => {
      const severity = opt_severity || defaultSeverity_;
      const dispatcher = opt_throttleTime === 0 ? (f, t) => f() : setTimeout;
      this.throttleMap_[alert] = this.throttleMap_[alert] || {};
      if (!this.throttleMap_[alert][severity]) {
        this.throttleMap_[alert][severity] = [resolve];
        dispatcher(() => {
          this.sendAlert_(alert, severity, opt_logger, opt_limit, opt_dismissDispatcher);
          this.throttleMap_[alert][severity].forEach((resolve) => resolve());
          delete this.throttleMap_[alert][severity];
          if (!Object.keys(this.throttleMap_[alert]).length) {
            delete this.throttleMap_[alert];
          }
        }, opt_throttleTime || defaultThrottleTime_);
      } else {
        this.throttleMap_[alert][severity].push(resolve);
      }
    });
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
   * @private
   */
  sendAlert_(alert, opt_severity, opt_logger, opt_limit, opt_dismissDispatcher) {
    const severity = opt_severity || defaultSeverity_;
    const throttleMap = this.throttleMap_ && this.throttleMap_[alert] ? this.throttleMap_[alert][severity] : undefined;
    const throttleCount = throttleMap ? throttleMap.length : undefined;

    // fire off the alert
    const alertEvent = new AlertEvent(alert, severity, opt_limit, opt_dismissDispatcher, throttleCount);
    this.savedAlerts_.add(alertEvent);
    this.dispatchEvent(alertEvent);

    // write the message to the logger if defined
    if (opt_logger != null) {
      if (throttleMap && throttleMap.length > 1) {
        alert = `${alert} (${throttleMap.length})`;
      }
      switch (severity) {
        case AlertEventSeverity.ERROR:
          log.error(opt_logger, alert);
          break;
        case AlertEventSeverity.WARNING:
          log.warning(opt_logger, alert);
          break;
        case AlertEventSeverity.INFO:
        case AlertEventSeverity.SUCCESS:
        default:
          log.info(opt_logger, alert);
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
    if (!this.onceMap_[alert]) {
      this.onceMap_[alert] = true;
      opt_limit = 1;
      this.sendAlert_(alert, opt_severity, opt_logger, opt_limit, opt_dismissDispatcher);
    }
  }

  /**
   * Clear the alert buffer
   */
  clearAlerts() {
    this.savedAlerts_.clear();
    this.throttleMap_ = {};
    this.dispatchEvent(AlertEventType.CLEAR_ALERTS);
  }

  /**
   * Get the alert buffer
   *
   * @return {!CircularBuffer<!AlertEvent>} Object containing the parsed record
   */
  getAlerts() {
    return this.savedAlerts_;
  }

  /**
   * Process alerts that AlertManager may have already generated before this class has initialized.
   *
   * @param {!string} clientId An arbitrary string to identify the client that is processing alerts
   * @param {!function(AlertEvent)} handler
   * @param {*=} opt_context
   */
  processMissedAlerts(clientId, handler, opt_context) {
    if (!this.missedAlertsProcessed_) {
      const beforeCount = this.processedByClientCount_[clientId] || 0;
      const alerts = this.savedAlerts_.getValues().slice(0, this.savedAlerts_.getCount() - beforeCount);
      alerts.forEach(handler, opt_context);
      this.processedByClientCount_[clientId] = this.savedAlerts_.getCount();
      this.missedAlertsProcessed_ = true;
    }
  }
}

/**
 * Global alert manager instance.
 * @type {AlertManager}
 */
let instance;

exports = AlertManager;

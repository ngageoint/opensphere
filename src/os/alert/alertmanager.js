goog.provide('os.alert.AlertManager');
goog.provide('os.alertManager');
goog.require('goog.events.EventTarget');
goog.require('goog.log');
goog.require('goog.structs.CircularBuffer');
goog.require('os.alert.AlertEvent');
goog.require('os.alert.AlertEventSeverity');
goog.require('os.structs.EventType');



/**
 * Responsible for receiving, logging and reporting alerts
 * @extends {goog.events.EventTarget}
 * @constructor
 */
os.alert.AlertManager = function() {
  os.alert.AlertManager.base(this, 'constructor');

  /**
   * @type {!goog.structs.CircularBuffer.<!os.alert.AlertEvent>}
   * @private
   */
  this.savedAlerts_ = new goog.structs.CircularBuffer(os.alert.AlertManager.MAX_SAVED);

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
};
goog.inherits(os.alert.AlertManager, goog.events.EventTarget);
goog.addSingletonGetter(os.alert.AlertManager);


/**
 * Max number of alerts to be saved
 * @type {number}
 * @const
 */
os.alert.AlertManager.MAX_SAVED = 10000;


/**
 * Takes a string and converts it into an alert event, then dispatches it
 * @param {string} alert The alert to send and add to the window
 * @param {os.alert.AlertEventSeverity=} opt_severity Severity of the event, defaults to error
 * @param {goog.log.Logger=} opt_logger If provided, writes the message to this logger
 * @param {number=} opt_limit Maximum number of duplicate alerts to display, defaults to 5
 * @param {goog.events.EventTarget=} opt_dismissDispatcher Event target which will indicate when to dismiss the alert
 *   by dispatching a {@code os.alert.AlertEventTypes.DISMISS_ALERT} event
 */
os.alert.AlertManager.prototype.sendAlert = function(alert, opt_severity, opt_logger, opt_limit,
    opt_dismissDispatcher) {
  var severity = opt_severity || os.alert.AlertEventSeverity.ERROR;

  // fire off the alert
  var alertEvent = new os.alert.AlertEvent(alert, severity, opt_limit, opt_dismissDispatcher);
  this.savedAlerts_.add(alertEvent);
  this.dispatchEvent(alertEvent);

  // write the message to the logger if defined
  if (goog.isDefAndNotNull(opt_logger)) {
    switch (severity) {
      case os.alert.AlertEventSeverity.ERROR:
        goog.log.error(opt_logger, alert);
        break;
      case os.alert.AlertEventSeverity.WARNING:
        goog.log.warning(opt_logger, alert);
        break;
      case os.alert.AlertEventSeverity.INFO:
      case os.alert.AlertEventSeverity.SUCCESS:
      default:
        goog.log.info(opt_logger, alert);
        break;
    }
  }
};


/**
 * Check an alert string against onceMap_ before sending an alert
 * @param {string} alert The alert to send and add to the window
 * @param {os.alert.AlertEventSeverity=} opt_severity Severity of the event, defaults to error
 * @param {goog.log.Logger=} opt_logger If provided, writes the message to this logger
 * @param {number=} opt_limit Maximum number of duplicate alerts to display, defaults to 5
 * @param {goog.events.EventTarget=} opt_dismissDispatcher Event target which will indicate when to dismiss the alert
 *   by dispatching a {@code os.alert.AlertEventTypes.DISMISS_ALERT} event
 */
os.alert.AlertManager.prototype.sendAlertOnce = function(alert, opt_severity, opt_logger, opt_limit,
  opt_dismissDispatcher) {
  if (this.onceMap_[alert]) {
    return;
  } else {
    this.onceMap_[alert] = true;
    opt_limit = 1;
    this.sendAlert(alert, opt_severity, opt_logger, opt_limit, opt_dismissDispatcher);
  }
};


/**
 * Clear the alert buffer
 */
os.alert.AlertManager.prototype.clearAlerts = function() {
  this.savedAlerts_.clear();
  this.dispatchEvent(os.alert.EventType.CLEAR_ALERTS);
};


/**
 * Get the alert buffer
 * @return {!goog.structs.CircularBuffer.<!os.alert.AlertEvent>} Object containing the parsed record
 */
os.alert.AlertManager.prototype.getAlerts = function() {
  return this.savedAlerts_;
};


/**
 * Process alerts that AlertManager may have already generated before this class has initialized.
 * @param {!string} clientId An arbitrary string to identify the client that is processing alerts
 * @param {!function(os.alert.AlertEvent)} handler
 * @param {*=} opt_context
 */
os.alert.AlertManager.prototype.processMissedAlerts = function(clientId, handler, opt_context) {
  if (!this.missedAlertsProcessed_) {
    var beforeCount = this.processedByClientCount_[clientId] || 0;
    var alerts = goog.array.slice(this.savedAlerts_.getValues(), 0, this.savedAlerts_.getCount() - beforeCount);
    goog.array.forEach(alerts, handler, opt_context);
    this.processedByClientCount_[clientId] = this.savedAlerts_.getCount();
    this.missedAlertsProcessed_ = true;
  }
};


/**
 * Global alert manager reference.
 * @type {os.alert.AlertManager}
 */
os.alertManager = os.alert.AlertManager.getInstance();

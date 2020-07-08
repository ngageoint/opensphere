goog.module('os.alert.AlertEvent');
goog.module.declareLegacyNamespace();

goog.require('goog.date.DateTime');
goog.require('goog.events.Event');
goog.require('goog.events.EventTarget');

const AlertEventSeverity = goog.requireType('os.alert.AlertEventSeverity');
const EventType = goog.require('os.alert.EventType');

/**
 * @type {number}
 */
const DEFAULT_LIMIT = 5;

/**
 * @type {number}
 * @private
 */
let id_ = 0;

/**
 * @unrestricted
 */
class AlertEvent extends goog.events.Event {
  /**
   * @param {string} message The alert message
   * @param {AlertEventSeverity} severity The alert severity
   * @param {number=} opt_limit Maximum number of identical messages to display at once
   * @param {goog.events.EventTarget=} opt_dismissDispatcher
   * @param {number=} opt_count Count of duplicate alert messages
   */
  constructor(message, severity, opt_limit, opt_dismissDispatcher, opt_count) {
    super(EventType.ALERT);

    /**
     * @type {string}
     * @private
     */
    this.message_ = message;

    /**
     * @type {goog.date.DateTime}
     * @private
     */
    this.time_ = new goog.date.DateTime();

    /**
     * @type {number}
     * @private
     */
    this.limit_ = opt_limit || DEFAULT_LIMIT;

    /**
     * @type {goog.events.EventTarget}
     * @private
     */
    this.dismissDispatcher_ = opt_dismissDispatcher || null;

    /**
     * @type {AlertEventSeverity}
     * @private
     */
    this.severity_ = severity;

    /**
     * @type {number}
     * @private
     */
    this.count_ = opt_count || 1;

    this['id'] = id_++;
  }

  /**
   * @return {number}
   */
  getLimit() {
    return this.limit_;
  }

  /**
   * @return {string}
   */
  getMessage() {
    return this.message_;
  }

  /**
   * @return {goog.date.DateTime}
   */
  getTime() {
    return this.time_;
  }

  /**
   * @return {AlertEventSeverity}
   */
  getSeverity() {
    return this.severity_;
  }

  /**
   * @return {goog.events.EventTarget}
   */
  getDismissDispatcher() {
    return this.dismissDispatcher_;
  }

  /**
   * @return {number}
   */
  getCount() {
    return this.count_;
  }
}

exports = AlertEvent;
exports.DEFAULT_LIMIT = DEFAULT_LIMIT;

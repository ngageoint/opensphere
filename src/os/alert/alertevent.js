goog.declareModuleId('os.alert.AlertEvent');

import EventType from './eventtype.js';

const DateTime = goog.require('goog.date.DateTime');
const GoogEvent = goog.require('goog.events.Event');

const EventTarget = goog.requireType('goog.events.EventTarget');
const {default: AlertEventSeverity} = goog.requireType('os.alert.AlertEventSeverity');


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
export default class AlertEvent extends GoogEvent {
  /**
   * @param {string} message The alert message
   * @param {AlertEventSeverity} severity The alert severity
   * @param {number=} opt_limit Maximum number of identical messages to display at once
   * @param {EventTarget=} opt_dismissDispatcher
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
     * @type {DateTime}
     * @private
     */
    this.time_ = new DateTime();

    /**
     * @type {number}
     * @private
     */
    this.limit_ = opt_limit || DEFAULT_LIMIT;

    /**
     * @type {EventTarget}
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
   * @return {DateTime}
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
   * @return {EventTarget}
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

exports.DEFAULT_LIMIT = DEFAULT_LIMIT;

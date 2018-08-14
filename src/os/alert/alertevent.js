goog.provide('os.alert.AlertEvent');
goog.provide('os.alert.AlertEventLevel');
goog.provide('os.alert.AlertEventSeverity');
goog.provide('os.alert.AlertEventTypes');
goog.require('goog.date.DateTime');
goog.require('goog.events.Event');
goog.require('goog.events.EventTarget');
goog.require('os.alert.EventType');



/**
 * An alert level
 * @param {string} name The name of the level.
 * @param {number} value The numeric value of the level.
 * @constructor
 */
os.alert.AlertEventLevel = function(name, value) {
  /**
   * The name of the level
   * @type {string}
   */
  this.name = name;

  /**
   * The numeric value of the level
   * @type {number}
   */
  this.value = value;
};


/**
 * @return {string} String representation of the alert level.
 * @override
 */
os.alert.AlertEventLevel.prototype.toString = function() {
  return this.name;
};


/**
 * Severity levels of alert events.
 * @enum {os.alert.AlertEventLevel}
 */
os.alert.AlertEventSeverity = {
  ERROR: new os.alert.AlertEventLevel('Error', 400),
  WARNING: new os.alert.AlertEventLevel('Warning', 300),
  SUCCESS: new os.alert.AlertEventLevel('Success', 200),
  INFO: new os.alert.AlertEventLevel('Info', 100)
};


/**
 * @enum {string}
 */
os.alert.AlertEventTypes = {
  DISMISS_ALERT: 'dismissAlert'
};



/**
 * @extends {goog.events.Event}
 * @constructor
 * @param {string} message The alert message
 * @param {os.alert.AlertEventSeverity} severity The alert severity
 * @param {number=} opt_limit Maximum number of identical messages to display at once
 * @param {goog.events.EventTarget=} opt_dismissDispatcher
 */
os.alert.AlertEvent = function(message, severity, opt_limit, opt_dismissDispatcher) {
  os.alert.AlertEvent.base(this, 'constructor', os.alert.EventType.ALERT);

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
  this.limit_ = opt_limit || os.alert.AlertEvent.DEFAULT_LIMIT;

  /**
   * @type {goog.events.EventTarget}
   * @private
   */
  this.dismissDispatcher_ = opt_dismissDispatcher || null;

  /**
   * @type {os.alert.AlertEventSeverity}
   * @private
   */
  this.severity_ = severity;
  this['id'] = os.alert.AlertEvent.id_++;
};
goog.inherits(os.alert.AlertEvent, goog.events.Event);


/**
 * @type {number}
 * @const
 */
os.alert.AlertEvent.DEFAULT_LIMIT = 5;


/**
 * @type {number}
 * @private
 */
os.alert.AlertEvent.id_ = 0;


/**
 * @return {number}
 */
os.alert.AlertEvent.prototype.getLimit = function() {
  return this.limit_;
};


/**
 * @return {string}
 */
os.alert.AlertEvent.prototype.getMessage = function() {
  return this.message_;
};


/**
 * @return {goog.date.DateTime}
 */
os.alert.AlertEvent.prototype.getTime = function() {
  return this.time_;
};


/**
 * @return {os.alert.AlertEventSeverity}
 */
os.alert.AlertEvent.prototype.getSeverity = function() {
  return this.severity_;
};


/**
 * @return {goog.events.EventTarget}
 */
os.alert.AlertEvent.prototype.getDismissDispatcher = function() {
  return this.dismissDispatcher_;
};

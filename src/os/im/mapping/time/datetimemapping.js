goog.provide('os.im.mapping.time.DateTimeMapping');

goog.require('os.im.mapping');
goog.require('os.im.mapping.AbstractMapping');
goog.require('os.im.mapping.MappingRegistry');
goog.require('os.im.mapping.TimeFormat');
goog.require('os.im.mapping.TimeType');
goog.require('os.implements');
goog.require('os.time');
goog.require('os.time.ITime');
goog.require('os.time.TimeInstant');
goog.require('os.time.TimeRange');



/**
 * Base class for date/time mappings. Handles single fields for both date and time.
 * @param {os.im.mapping.TimeType} type The type of time mapping.
 * @param {string=} opt_id Identifier for the time mapping.
 * @extends {os.im.mapping.AbstractMapping.<T>}
 * @constructor
 * @template T
 */
os.im.mapping.time.DateTimeMapping = function(type, opt_id) {
  os.im.mapping.time.DateTimeMapping.base(this, 'constructor');
  this.xmlType = os.im.mapping.time.DateTimeMapping.ID;

  /**
   * Whether or not to set the record time
   * @type {boolean}
   * @private
   */
  this.applyTime_ = true;

  /**
   * @type {string}
   * @private
   */
  this.id_ = opt_id || os.im.mapping.time.DateTimeMapping.ID;

  /**
   * The format for parsing the date/time from the field
   * @type {?string}
   * @protected
   */
  this.format = os.time.DATETIME_FORMATS[0];

  /**
   * @type {Array.<string>}
   * @protected
   */
  this.formats = os.time.DATETIME_FORMATS;

  /**
   * @type {Array.<string>}
   * @protected
   */
  this.customFormats = os.time.CUSTOM_DATETIME_FORMATS;

  /**
   * @type {Object.<string, RegExp>}
   * @protected
   */
  this.regexes = os.time.DATETIME_REGEXES;

  /**
   * @type {os.im.mapping.TimeType}
   * @protected
   */
  this.type = type;
};
goog.inherits(os.im.mapping.time.DateTimeMapping, os.im.mapping.AbstractMapping);


/**
 * @type {string}
 * @const
 */
os.im.mapping.time.DateTimeMapping.ID = 'DateTime';


// Register the mapping.
os.im.mapping.MappingRegistry.getInstance().registerMapping(
    os.im.mapping.time.DateTimeMapping.ID, os.im.mapping.time.DateTimeMapping);


/**
 * @inheritDoc
 */
os.im.mapping.time.DateTimeMapping.prototype.getId = function() {
  if (this.type == os.im.mapping.TimeType.START) {
    return 'Start ' + this.id_;
  } else if (this.type == os.im.mapping.TimeType.END) {
    return 'End ' + this.id_;
  }

  return this.id_;
};


/**
 * @inheritDoc
 */
os.im.mapping.time.DateTimeMapping.prototype.getScore = function() {
  return 20;
};


/**
 * @inheritDoc
 */
os.im.mapping.time.DateTimeMapping.prototype.getScoreType = function() {
  return 'time';
};


/**
 * @inheritDoc
 */
os.im.mapping.time.DateTimeMapping.prototype.getLabel = function() {
  return this.getId() || null;
};


/**
 * @inheritDoc
 */
os.im.mapping.time.DateTimeMapping.prototype.getFieldsChanged = function() {
  if (this.getApplyTime()) {
    return ['recordTime'];
  } else {
    return os.im.mapping.time.DateTimeMapping.base(this, 'getFieldsChanged');
  }
};


/**
 * @type {RegExp}
 * @const
 */
os.im.mapping.time.DateTimeMapping.TIMEZONE_REGEX = /(Z|UTC|[+-]\d\d+:?\d\d)$/;


/**
 * @inheritDoc
 */
os.im.mapping.time.DateTimeMapping.prototype.execute = function(item) {
  if (this.field && this.format) {
    var current = /** @type {string|number} */ (os.im.mapping.getItemField(item, this.field));
    var t = this.getTimestamp(current);

    if (this.applyTime_) {
      var old = os.im.mapping.getItemField(item, 'recordTime') || null; // not an ITime! See THIN-8508
      os.im.mapping.setItemField(item, 'recordTime', this.getTime(t, old));
    } else if (t) {
      // only modify the original field if the time wasn't mapped to recordTime. note that this will prevent the
      // field from being used by other date mappings because the format will no longer apply.
      this.updateItem(t, item);
    }
  }
};


/**
 * Get the UNIX timestamp from a value.
 * @param {*} value The time value to parse
 * @return {?number}
 *
 * @protected
 */
os.im.mapping.time.DateTimeMapping.prototype.getTimestamp = function(value) {
  var t = null;
  if (value != null && (goog.isNumber(value) || value != '')) {
    if (this.format == os.im.mapping.TimeFormat.TIMESTAMP) {
      try {
        t = parseFloat(value);
      } catch (e) {
      }
    } else if (this.format === os.im.mapping.TimeFormat.ISO) {
      // Ensure the string has a time zone. Otherwise the browser will assume one, and FF and Chrome do not assume
      // the same thing (Chrome assumes UTC, FF assumes local).
      if (!os.im.mapping.time.DateTimeMapping.TIMEZONE_REGEX.test(value)) {
        value += 'Z';
      }

      t = moment(String(value)).valueOf();
    } else {
      var momentT = os.time.parseMoment(String(value), this.format, true);
      t = momentT.valueOf();
    }
  }

  if (isNaN(t)) {
    t = null;
  }

  return t;
};


/**
 * @inheritDoc
 */
os.im.mapping.time.DateTimeMapping.prototype.autoDetect = function(items) {
  if (items) {
    var i = items.length;

    var f = undefined;
    while (i--) {
      // only auto detect if a time has not yet been parsed
      var time = os.im.mapping.getItemField(items[i], 'recordTime');
      if (os.implements(time, os.time.ITime.ID)) {
        break;
      }

      f = os.im.mapping.getBestFieldMatch(items[i], this.getRegex(), f);

      if (f) {
        var fieldValue = os.im.mapping.getItemField(items[i], f);
        if (fieldValue) {
          // always use strict formatting for auto detection to prevent false positives
          var formats = this.formats.concat(this.customFormats);
          var format = os.time.detectFormat(String(fieldValue), formats, true, true);
          if (format) {
            var m = this.clone();
            m.field = f;
            m.setFormat(format);
            return m;
          }
        }
      }
    }
  }

  return null;
};


/**
 * Whether or not the time will be applied to <code>item.recordTime</code>
 * @return {boolean} Whether or not the time will be applied to <code>item.recordTime</code>.
 */
os.im.mapping.time.DateTimeMapping.prototype.getApplyTime = function() {
  return this.applyTime_;
};


/**
 * Sets whether or not the time will be applied to <code>item.recordTime</code>
 * @param {boolean} value True to apply, false otherwise
 */
os.im.mapping.time.DateTimeMapping.prototype.setApplyTime = function(value) {
  this.applyTime_ = value;
};


/**
 * Gets the format for parsing the date/time from the field
 * @return {?string} The format
 */
os.im.mapping.time.DateTimeMapping.prototype.getFormat = function() {
  return this.format;
};


/**
 * Sets the format for parsing the date/time from the field
 * @param {?string} value The format
 */
os.im.mapping.time.DateTimeMapping.prototype.setFormat = function(value) {
  this.format = value;
};


/**
 * Gets the type of time mapping (instant, start, or end).
 * @return {os.im.mapping.TimeType} The type
 */
os.im.mapping.time.DateTimeMapping.prototype.getType = function() {
  return this.type;
};


/**
 * Sets the type of time mapping (instant, start, or end).
 * @param {os.im.mapping.TimeType} type The type
 */
os.im.mapping.time.DateTimeMapping.prototype.setType = function(type) {
  this.type = type;
};


/**
 * Get the regular expression used to auto detect the date/time mapping.
 * @return {RegExp}
 * @protected
 */
os.im.mapping.time.DateTimeMapping.prototype.getRegex = function() {
  return this.regexes[this.type] || os.time.TIME_REGEXES[os.im.mapping.TimeType.INSTANT];
};


/**
 * Updates the record with the given time
 * @param {number} t The time in ms UTC
 * @param {T} item The item to update
 */
os.im.mapping.time.DateTimeMapping.prototype.updateItem = function(t, item) {
  if (this.field) {
    os.im.mapping.setItemField(item, this.field, new Date(t).toISOString());
  }
};


/**
 * Gets a new time instance based on the mapping type.
 * @param {number} t The time in ms UTC
 * @return {os.time.ITime}
 * @protected
 */
os.im.mapping.time.DateTimeMapping.prototype.getNewTime = function(t) {
  if (this.type == os.im.mapping.TimeType.START) {
    // default both the start and end dates to t
    return new os.time.TimeRange(t, t);
  } else if (this.type == os.im.mapping.TimeType.END) {
    return new os.time.TimeRange(undefined, t);
  }

  return new os.time.TimeInstant(t);
};


/**
 * Updates components of a time based on the mapping.
 * @param {number} to The destination time in ms UTC
 * @param {number} from The source time in ms UTC
 * @return {Date} The updated time.
 */
os.im.mapping.time.DateTimeMapping.prototype.updateTime = function(to, from) {
  return new Date(from);
};


/**
 * Updates the time instance
 * @param {?number} t The time in ms UTC
 * @param {*} time The time instance - an IItime, string, or null if none
 * @return {os.time.ITime} The time instance
 */
os.im.mapping.time.DateTimeMapping.prototype.getTime = function(t, time) {
  if (t == null) {
    // if the old time instance is an ITime, then don't discard it
    return os.implements(time, os.time.ITime.ID) ? /** @type {os.time.ITime} */ (time) : null;
  }

  if (typeof time != 'object' || !os.implements(/** @type {Object} */ (time), os.time.ITime.ID)) {
    time = this.getNewTime(t);
  } else if (this.type == os.im.mapping.TimeType.END) {
    // make sure the time object is a range
    if (!(time instanceof os.time.TimeRange)) {
      time = new os.time.TimeRange(/** @type {os.time.ITime|string|number} */ (time));
    }

    if (time.getEnd()) {
      time.setEnd(this.updateTime(time.getEnd(), t));
    } else {
      time.setEnd(t);
    }
  } else if (time.getStart()) {
    time.setStart(this.updateTime(time.getStart(), t));
  } else {
    time.setStart(t);
  }

  return /** @type {os.time.ITime} */ (time);
};


/**
 * @return {os.im.mapping.time.DateTimeMapping}
 * @override
 */
os.im.mapping.time.DateTimeMapping.prototype.clone = function() {
  var other = new this.constructor(this.type);
  other.field = this.field;
  other.setFormat(this.format);
  other.setApplyTime(this.getApplyTime());
  return other;
};


/**
 * @inheritDoc
 */
os.im.mapping.time.DateTimeMapping.prototype.persist = function(opt_to) {
  opt_to = os.im.mapping.time.DateTimeMapping.base(this, 'persist', opt_to);
  opt_to['applyTime'] = this.getApplyTime();
  opt_to['format'] = this.getFormat();
  opt_to['type'] = this.getType();

  return opt_to;
};


/**
 * @inheritDoc
 */
os.im.mapping.time.DateTimeMapping.prototype.restore = function(config) {
  os.im.mapping.time.DateTimeMapping.base(this, 'restore', config);
  this.setApplyTime(config['applyTime']);
  this.setFormat(config['format']);
  this.setType(config['type']);
};


/**
 * @inheritDoc
 */
os.im.mapping.time.DateTimeMapping.prototype.toXml = function() {
  var xml = os.im.mapping.time.DateTimeMapping.base(this, 'toXml');
  os.xml.appendElement('applyTime', xml, this.getApplyTime());
  os.xml.appendElement('format', xml, os.im.mapping.momentFormatToJavaFormat(this.getFormat()));
  os.xml.appendElement('subType', xml, this.getType());

  return xml;
};


/**
 * @inheritDoc
 */
os.im.mapping.time.DateTimeMapping.prototype.fromXml = function(xml) {
  os.im.mapping.time.DateTimeMapping.base(this, 'fromXml', xml);

  var val = this.getXmlValue(xml, 'applyTime');
  if (null != val) {
    this.setApplyTime(this.toBoolean(val));
  } else {
    this.setApplyTime(false);
  }

  this.setFormat(os.im.mapping.javaFormatToMomentFormat(this.getXmlValue(xml, 'format')));

  val = this.getXmlValue(xml, 'subType');
  if (null != val) {
    this.setType(os.im.mapping.getTimeTypeForString(val));
  }
};

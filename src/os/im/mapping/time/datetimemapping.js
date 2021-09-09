goog.module('os.im.mapping.time.DateTimeMapping');

const RecordField = goog.require('os.data.RecordField');
const osMapping = goog.require('os.im.mapping');
const AbstractMapping = goog.require('os.im.mapping.AbstractMapping');
const MappingRegistry = goog.require('os.im.mapping.MappingRegistry');
const TimeFormat = goog.require('os.im.mapping.TimeFormat');
const TimeType = goog.require('os.im.mapping.TimeType');
const osImplements = goog.require('os.implements');
const osTime = goog.require('os.time');
const ITime = goog.require('os.time.ITime');
const TimeInstant = goog.require('os.time.TimeInstant');
const TimeRange = goog.require('os.time.TimeRange');
const {appendElement} = goog.require('os.xml');


/**
 * Base class for date/time mappings. Handles single fields for both date and time.
 *
 * @extends {AbstractMapping<T>}
 * @template T
 */
class DateTimeMapping extends AbstractMapping {
  /**
   * Constructor.
   * @param {TimeType} type The type of time mapping.
   * @param {string=} opt_id Identifier for the time mapping.
   */
  constructor(type, opt_id) {
    super();
    this.xmlType = DateTimeMapping.ID;
    this.id = opt_id || DateTimeMapping.ID;

    /**
     * Whether or not to set the record time
     * @type {boolean}
     * @private
     */
    this.applyTime_ = true;

    /**
     * The format for parsing the date/time from the field
     * @type {?string}
     * @protected
     */
    this.format = osTime.DATETIME_FORMATS[0];

    /**
     * @type {Array<string>}
     * @protected
     */
    this.formats = osTime.DATETIME_FORMATS;

    /**
     * @type {Array<string>}
     * @protected
     */
    this.customFormats = osTime.CUSTOM_DATETIME_FORMATS;

    /**
     * @type {Object<string, RegExp>}
     * @protected
     */
    this.regexes = osTime.DATETIME_REGEXES;

    /**
     * @type {TimeType}
     * @protected
     */
    this.type = type;
  }

  /**
   * @inheritDoc
   */
  getId() {
    if (this.type == TimeType.START) {
      return 'Start ' + this.id;
    } else if (this.type == TimeType.END) {
      return 'End ' + this.id;
    }

    return this.id;
  }

  /**
   * @inheritDoc
   */
  getScore() {
    return 20;
  }

  /**
   * @inheritDoc
   */
  getScoreType() {
    return 'time';
  }

  /**
   * @inheritDoc
   */
  getLabel() {
    return this.getId() || null;
  }

  /**
   * @inheritDoc
   */
  getFieldsChanged() {
    if (this.getApplyTime()) {
      return [RecordField.TIME];
    } else {
      return super.getFieldsChanged();
    }
  }

  /**
   * @inheritDoc
   */
  execute(item) {
    if (this.field && this.format) {
      var current = /** @type {string|number} */ (osMapping.getItemField(item, this.field));
      var t = this.getTimestamp(current);

      if (this.applyTime_) {
        var old = osMapping.getItemField(item, RecordField.TIME) || null; // not an ITime! See THIN-8508
        osMapping.setItemField(item, RecordField.TIME, this.getTime(t, old));
      } else if (t) {
        // only modify the original field if the time wasn't mapped to recordTime. note that this will prevent the
        // field from being used by other date mappings because the format will no longer apply.
        this.updateItem(t, item);
      }
    }
  }

  /**
   * Get the UNIX timestamp from a value.
   *
   * @param {*} value The time value to parse
   * @return {?number}
   *
   * @protected
   */
  getTimestamp(value) {
    var t = null;
    if (value != null && (typeof value === 'number' || value != '')) {
      if (this.format == TimeFormat.TIMESTAMP) {
        try {
          t = parseFloat(value);
        } catch (e) {
        }
      } else if (this.format === TimeFormat.ISO) {
        // Ensure the string has a time zone. Otherwise the browser will assume one, and FF and Chrome do not assume
        // the same thing (Chrome assumes UTC, FF assumes local).
        if (!DateTimeMapping.TIMEZONE_REGEX.test(value)) {
          value += 'Z';
        }

        t = moment(String(value)).valueOf();
      } else {
        var momentT = osTime.parseMoment(String(value), this.format, true);
        t = momentT.valueOf();
      }
    }

    if (isNaN(t)) {
      t = null;
    }

    return t;
  }

  /**
   * @inheritDoc
   */
  autoDetect(items) {
    if (items) {
      var i = items.length;

      var f = undefined;
      while (i--) {
        // only auto detect if a time has not yet been parsed
        var time = osMapping.getItemField(items[i], RecordField.TIME);
        if (osImplements(time, ITime.ID)) {
          break;
        }

        f = osMapping.getBestFieldMatch(items[i], this.getRegex(), f);

        if (f) {
          var fieldValue = osMapping.getItemField(items[i], f);
          if (fieldValue) {
            // always use strict formatting for auto detection to prevent false positives
            var formats = this.formats.concat(this.customFormats);
            var format = osTime.detectFormat(String(fieldValue), formats, true, true);
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
  }

  /**
   * Whether or not the time will be applied to <code>item.recordTime</code>
   *
   * @return {boolean} Whether or not the time will be applied to <code>item.recordTime</code>.
   */
  getApplyTime() {
    return this.applyTime_;
  }

  /**
   * Sets whether or not the time will be applied to <code>item.recordTime</code>
   *
   * @param {boolean} value True to apply, false otherwise
   */
  setApplyTime(value) {
    this.applyTime_ = value;
  }

  /**
   * Gets the format for parsing the date/time from the field
   *
   * @return {?string} The format
   */
  getFormat() {
    return this.format;
  }

  /**
   * Sets the format for parsing the date/time from the field
   *
   * @param {?string} value The format
   */
  setFormat(value) {
    this.format = value;
  }

  /**
   * Gets the type of time mapping (instant, start, or end).
   *
   * @return {TimeType} The type
   */
  getType() {
    return this.type;
  }

  /**
   * Sets the type of time mapping (instant, start, or end).
   *
   * @param {TimeType} type The type
   */
  setType(type) {
    this.type = type;
  }

  /**
   * Get the regular expression used to auto detect the date/time mapping.
   *
   * @return {RegExp}
   * @protected
   */
  getRegex() {
    return this.regexes[this.type] || osTime.TIME_REGEXES[TimeType.INSTANT];
  }

  /**
   * Updates the record with the given time
   *
   * @param {number} t The time in ms UTC
   * @param {T} item The item to update
   */
  updateItem(t, item) {
    if (this.field) {
      osMapping.setItemField(item, this.field, new Date(t).toISOString());
    }
  }

  /**
   * Gets a new time instance based on the mapping type.
   *
   * @param {number} t The time in ms UTC
   * @return {ITime}
   * @protected
   */
  getNewTime(t) {
    if (this.type == TimeType.START) {
      // default both the start and end dates to t
      return new TimeRange(t, t);
    } else if (this.type == TimeType.END) {
      return new TimeRange(undefined, t);
    }

    return new TimeInstant(t);
  }

  /**
   * Updates components of a time based on the mapping.
   *
   * @param {number} to The destination time in ms UTC
   * @param {number} from The source time in ms UTC
   * @return {Date} The updated time.
   */
  updateTime(to, from) {
    return new Date(from);
  }

  /**
   * Updates the time instance
   *
   * @param {?number} t The time in ms UTC
   * @param {*} time The time instance - an IItime, string, or null if none
   * @return {ITime} The time instance
   */
  getTime(t, time) {
    if (t == null) {
      // if the old time instance is an ITime, then don't discard it
      return osImplements(time, ITime.ID) ? /** @type {ITime} */ (time) : null;
    }

    if (typeof time != 'object' || !osImplements(/** @type {Object} */ (time), ITime.ID)) {
      time = this.getNewTime(t);
    } else if (this.type == TimeType.END) {
      // make sure the time object is a range
      if (!(time instanceof TimeRange)) {
        time = new TimeRange(/** @type {os.time.ITime|string|number} */ (time));
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

    return /** @type {ITime} */ (time);
  }

  /**
   * @return {DateTimeMapping}
   * @override
   */
  clone() {
    var other = new this.constructor(this.type);
    other.field = this.field;
    other.setFormat(this.format);
    other.setApplyTime(this.getApplyTime());
    return other;
  }

  /**
   * @inheritDoc
   */
  persist(opt_to) {
    opt_to = super.persist(opt_to);
    opt_to['applyTime'] = this.getApplyTime();
    opt_to['format'] = this.getFormat();
    opt_to['type'] = this.getType();

    return opt_to;
  }

  /**
   * @inheritDoc
   */
  restore(config) {
    super.restore(config);
    this.setApplyTime(config['applyTime']);
    this.setFormat(config['format']);
    this.setType(config['type']);
  }

  /**
   * @inheritDoc
   */
  toXml() {
    var xml = super.toXml();
    appendElement('applyTime', xml, this.getApplyTime());
    appendElement('format', xml, osMapping.momentFormatToJavaFormat(this.getFormat()));
    appendElement('subType', xml, this.getType());

    return xml;
  }

  /**
   * @inheritDoc
   */
  fromXml(xml) {
    super.fromXml(xml);

    var val = this.getXmlValue(xml, 'applyTime');
    if (null != val) {
      this.setApplyTime(this.toBoolean(val));
    } else {
      this.setApplyTime(false);
    }

    this.setFormat(osMapping.javaFormatToMomentFormat(this.getXmlValue(xml, 'format')));

    val = this.getXmlValue(xml, 'subType');
    if (null != val) {
      this.setType(osMapping.getTimeTypeForString(val));
    }
  }
}

/**
 * @type {string}
 */
DateTimeMapping.ID = 'DateTime';

// Register the mapping.
MappingRegistry.getInstance().registerMapping(DateTimeMapping.ID, DateTimeMapping);

/**
 * @type {RegExp}
 * @const
 */
DateTimeMapping.TIMEZONE_REGEX = /(Z|UTC|[+-]\d\d+:?\d\d)$/;

exports = DateTimeMapping;

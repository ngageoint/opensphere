goog.module('os.ui.im.mapping.time.TimeMappingModel');

const DateType = goog.require('os.im.mapping.DateType');
const TimeType = goog.require('os.im.mapping.TimeType');
const DateMapping = goog.require('os.im.mapping.time.DateMapping');
const DateTimeMapping = goog.require('os.im.mapping.time.DateTimeMapping');
const TimeMapping = goog.require('os.im.mapping.time.TimeMapping');
const {DATETIME_FORMATS, TIME_FORMATS} = goog.require('os.time');


/**
 * Model for describing a time mapping.
 * @unrestricted
 */
class TimeMappingModel {
  /**
   * Constructor.
   * @param {TimeType=} opt_type The type of time mapping (instant, start, end).
   */
  constructor(opt_type) {
    /**
     * @type {string}
     */
    this['dateType'] = DateType.COMBINED;

    /**
     * @type {string}
     */
    this['dateColumn'] = '';

    /**
     * @type {string}
     */
    this['timeColumn'] = '';

    /**
     * @type {string}
     */
    this['dateFormat'] = DATETIME_FORMATS[0];

    /**
     * @type {string}
     */
    this['timeFormat'] = TIME_FORMATS[0];

    /**
     * @type {DateTimeMapping}
     * @private
     */
    this.dateMapping_ = null;

    /**
     * @type {DateTimeMapping}
     * @private
     */
    this.timeMapping_ = null;

    /**
     * @type {TimeType}
     * @private
     */
    this.type_ = opt_type || TimeType.START;
  }

  /**
   * @param {TimeType} type The type of time mapping (instant, start, end).
   */
  setType(type) {
    this.type_ = type;
  }

  /**
   * @return {TimeType}
   */
  getType() {
    return this.type_;
  }

  /**
   * Configure the model from a set of mappings.
   *
   * @param {Array.<DateTimeMapping>} mappings
   */
  updateFromMappings(mappings) {
    this.dateMapping_ = null;
    this.timeMapping_ = null;

    for (var i = 0, n = mappings.length; i < n; i++) {
      var m = mappings[i];
      if (m instanceof TimeMapping) {
        this.timeMapping_ = m.clone();
        this['timeColumn'] = this.timeMapping_.field;
        this['timeFormat'] = this.timeMapping_.getFormat();
      } else {
        this.dateMapping_ = m.clone();
        this['dateColumn'] = this.dateMapping_.field;
        this['dateFormat'] = this.dateMapping_.getFormat();
      }
    }

    this.updateTypeCombo_();
  }

  /**
   * Generate mappings from the model configuration.
   *
   * @return {Array.<DateTimeMapping>}
   */
  generateMappings() {
    var mappings = [];

    switch (this['dateType']) {
      case DateType.COMBINED:
        var dtm = new DateTimeMapping(this.type_);
        dtm.field = this['dateColumn'];
        dtm.setFormat(this['dateFormat']);

        mappings.push(dtm);
        break;
      case DateType.SEPARATE:
        var dm = new DateMapping(this.type_);
        dm.field = this['dateColumn'];
        dm.setFormat(this['dateFormat']);
        mappings.push(dm);

        var tm = new TimeMapping(this.type_);
        tm.field = this['timeColumn'];
        tm.setFormat(this['timeFormat']);
        mappings.push(tm);
        break;
      case DateType.DATE_ONLY:
        var dm = new DateMapping(this.type_);
        dm.field = this['dateColumn'];
        dm.setFormat(this['dateFormat']);
        mappings.push(dm);
        break;
      default:
        break;
    }

    return mappings;
  }

  /**
   * Check if mappings can be generated from this model.
   *
   * @return {boolean}
   */
  validate() {
    var valid = this['dateColumn'] && this['dateFormat'];
    if (this['dateType'] == DateType.SEPARATE) {
      valid = valid && this['timeColumn'] && this['timeFormat'];
    }

    return valid;
  }

  /**
   * @private
   */
  updateTypeCombo_() {
    if (this.timeMapping_) {
      // use separate fields if a time mapping exists even without a date mapping (may have been auto detected)
      this['dateType'] = DateType.SEPARATE;
    } else if (this.dateMapping_ instanceof DateMapping) {
      // date but no time
      this['dateType'] = DateType.DATE_ONLY;
    } else {
      // default to combined
      this['dateType'] = DateType.COMBINED;
    }
  }
}

exports = TimeMappingModel;

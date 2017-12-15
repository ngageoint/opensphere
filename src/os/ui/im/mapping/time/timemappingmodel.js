goog.provide('os.ui.im.mapping.time.TimeMappingModel');
goog.require('os.im.mapping.TimeType');
goog.require('os.im.mapping.time.DateMapping');
goog.require('os.im.mapping.time.DateTimeMapping');
goog.require('os.im.mapping.time.TimeMapping');
goog.require('os.time');



/**
 * Model for describing a time mapping.
 * @param {os.im.mapping.TimeType=} opt_type The type of time mapping (instant, start, end).
 * @constructor
 */
os.ui.im.mapping.time.TimeMappingModel = function(opt_type) {
  /**
   * @type {string}
   */
  this['dateType'] = 'combined';

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
  this['dateFormat'] = os.time.DATETIME_FORMATS[0];

  /**
   * @type {string}
   */
  this['timeFormat'] = os.time.TIME_FORMATS[0];

  /**
   * @type {os.im.mapping.time.DateTimeMapping}
   * @private
   */
  this.dateMapping_ = null;

  /**
   * @type {os.im.mapping.time.DateTimeMapping}
   * @private
   */
  this.timeMapping_ = null;

  /**
   * @type {os.im.mapping.TimeType}
   * @private
   */
  this.type_ = opt_type || os.im.mapping.TimeType.START;
};


/**
 * @param {os.im.mapping.TimeType} type The type of time mapping (instant, start, end).
 */
os.ui.im.mapping.time.TimeMappingModel.prototype.setType = function(type) {
  this.type_ = type;
};


/**
 * @return {os.im.mapping.TimeType}
 */
os.ui.im.mapping.time.TimeMappingModel.prototype.getType = function() {
  return this.type_;
};


/**
 * Configure the model from a set of mappings.
 * @param {Array.<os.im.mapping.time.DateTimeMapping>} mappings
 */
os.ui.im.mapping.time.TimeMappingModel.prototype.updateFromMappings = function(mappings) {
  this.dateMapping_ = null;
  this.timeMapping_ = null;

  for (var i = 0, n = mappings.length; i < n; i++) {
    var m = mappings[i];
    if (m instanceof os.im.mapping.time.TimeMapping) {
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
};


/**
 * Generate mappings from the model configuration.
 * @return {Array.<os.im.mapping.time.DateTimeMapping>}
 */
os.ui.im.mapping.time.TimeMappingModel.prototype.generateMappings = function() {
  var mappings = [];

  switch (this['dateType']) {
    case 'combined':
      var dtm = new os.im.mapping.time.DateTimeMapping(this.type_);
      dtm.field = this['dateColumn'];
      dtm.setFormat(this['dateFormat']);

      mappings.push(dtm);
      break;
    case 'separate':
      var dm = new os.im.mapping.time.DateMapping(this.type_);
      dm.field = this['dateColumn'];
      dm.setFormat(this['dateFormat']);
      mappings.push(dm);

      var tm = new os.im.mapping.time.TimeMapping(this.type_);
      tm.field = this['timeColumn'];
      tm.setFormat(this['timeFormat']);
      mappings.push(tm);
      break;
    case 'dateonly':
      var dm = new os.im.mapping.time.DateMapping(this.type_);
      dm.field = this['dateColumn'];
      dm.setFormat(this['dateFormat']);
      mappings.push(dm);
      break;
    default:
      break;
  }

  return mappings;
};


/**
 * Check if mappings can be generated from this model.
 * @return {boolean}
 */
os.ui.im.mapping.time.TimeMappingModel.prototype.validate = function() {
  var valid = this['dateColumn'] && this['dateFormat'];
  if (this['dateType'] == 'separate') {
    valid = valid && this['timeColumn'] && this['timeFormat'];
  }

  return valid;
};


/**
 * @private
 */
os.ui.im.mapping.time.TimeMappingModel.prototype.updateTypeCombo_ = function() {
  if (this.timeMapping_) {
    // use separate fields if a time mapping exists even without a date mapping (may have been auto detected)
    this['dateType'] = 'separate';
  } else if (this.dateMapping_ instanceof os.im.mapping.time.DateMapping) {
    // date but no time
    this['dateType'] = 'dateonly';
  } else {
    // default to combined
    this['dateType'] = 'combined';
  }
};

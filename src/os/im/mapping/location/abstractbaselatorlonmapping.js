goog.provide('os.im.mapping.location.AbstractBaseLatOrLonMapping');
goog.require('os.geo');
goog.require('os.im.mapping.AbstractPositionMapping');



/**
 * @extends {os.im.mapping.AbstractPositionMapping.<T, S>}
 * @constructor
 * @template T, S
 */
os.im.mapping.location.AbstractBaseLatOrLonMapping = function() {
  os.im.mapping.location.AbstractBaseLatOrLonMapping.base(this, 'constructor');

  /**
   * @type {string}
   * @protected
   */
  this.coordField = '';

  /**
   * @type {string}
   * @protected
   */
  this.type = '';

  /**
   * @type {RegExp}
   * @protected
   */
  this.regex = null;

  /**
   * @type {Function}
   * @protected
   */
  this.parseFn = null;
};
goog.inherits(os.im.mapping.location.AbstractBaseLatOrLonMapping, os.im.mapping.AbstractPositionMapping);


/**
 * @inheritDoc
 */
os.im.mapping.location.AbstractBaseLatOrLonMapping.prototype.getId = function() {
  return this.type;
};


/**
 * @inheritDoc
 */
os.im.mapping.location.AbstractBaseLatOrLonMapping.prototype.getFieldsChanged = function() {
  return [this.field, this.coordField];
};


/**
 * @inheritDoc
 */
os.im.mapping.location.AbstractBaseLatOrLonMapping.prototype.getLabel = function() {
  return this.type;
};


/**
 * @inheritDoc
 */
os.im.mapping.location.AbstractBaseLatOrLonMapping.prototype.getScore = function() {
  if (this.type && this.field) {
    return this.type.toLowerCase().indexOf(this.field.toLowerCase()) == 0 ? 11 : 10;
  }

  return os.im.mapping.location.AbstractBaseLatOrLonMapping.base(this, 'getScore');
};


/**
 * @inheritDoc
 */
os.im.mapping.location.AbstractBaseLatOrLonMapping.prototype.getScoreType = function() {
  return 'geom';
};


/**
 * @inheritDoc
 */
os.im.mapping.location.AbstractBaseLatOrLonMapping.prototype.execute = function(item, targetItem) {
  var value = NaN;
  let result = false;
  if (!targetItem) {
    targetItem = item;
  }

  if (this.field) {
    var fieldValue = os.im.mapping.getItemField(item, this.field);
    if (fieldValue) {
      fieldValue = String(fieldValue).replace(os.geo.COORD_CLEANER, '');
      value = this.parseFn(fieldValue, this.customFormat);

      if (!isNaN(value)) {
        result = os.im.mapping.setItemField(item, this.coordField, value);
        this.addGeometry(item, targetItem);
      }
    }
  }
  return result;
};


/**
 * @inheritDoc
 */
os.im.mapping.location.AbstractBaseLatOrLonMapping.prototype.testField = function(value) {
  if (value) {
    var l = this.parseFn(String(value));
    return l != null && !isNaN(l);
  }
  return false;
};


/**
 * @inheritDoc
 */
os.im.mapping.location.AbstractBaseLatOrLonMapping.prototype.testAndGetField = function(value, opt_format) {
  if (value) {
    var l = this.parseFn(String(value), opt_format);
    return l != null && !isNaN(l) ? l.toString() : null;
  }
  return null;
};


/**
 * @param {T} item
 * @param {S} targetItem
 * @protected
 */
os.im.mapping.location.AbstractBaseLatOrLonMapping.prototype.addGeometry = function(item, targetItem) {
  var lat = item['LAT'];
  var lon = item['LON'];
  if (lat !== undefined && !isNaN(lat) && typeof lat === 'number' &&
      lon !== undefined && !isNaN(lon) && typeof lon === 'number') {
    targetItem['GEOM'] = [lon, lat];
  }
};


/**
 * @inheritDoc
 */
os.im.mapping.location.AbstractBaseLatOrLonMapping.prototype.autoDetect = function(items) {
  var m = null;
  if (items) {
    var i = items.length;
    var f = undefined;
    while (i--) {
      var item = items[i];
      f = os.im.mapping.getBestFieldMatch(item, this.regex, f);

      if (f) {
        m = new this.constructor();
        m.field = f;
      }
    }
  }

  return m;
};

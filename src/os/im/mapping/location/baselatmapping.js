goog.provide('os.im.mapping.location.BaseLatMapping');
goog.require('os.geo');
goog.require('os.im.mapping.AbstractPositionMapping');



/**
 * @extends {os.im.mapping.AbstractPositionMapping.<T, S>}
 * @constructor
 * @template T, S
 */
os.im.mapping.location.BaseLatMapping = function() {
  os.im.mapping.location.BaseLatMapping.base(this, 'constructor');

  /**
   * @type {string}
   * @protected
   */
  this.coordField = 'LAT';

  /**
   * @type {string}
   * @protected
   */
  this.type = os.im.mapping.location.BaseLatMapping.ID;

  /**
   * @type {RegExp}
   * @protected
   */
  this.regex = os.im.mapping.location.BaseLatMapping.LAT_REGEX;
};
goog.inherits(os.im.mapping.location.BaseLatMapping, os.im.mapping.AbstractPositionMapping);


/**
 * @type {string}
 * @const
 */
os.im.mapping.location.BaseLatMapping.ID = 'Latitude';


/**
 * @type {RegExp}
 * @const
 */
os.im.mapping.location.BaseLatMapping.LAT_REGEX = /lat(i(t(u(d(e)?)?)?)?)?\b/i;


/**
 * @inheritDoc
 */
os.im.mapping.location.BaseLatMapping.prototype.getId = function() {
  return this.type;
};


/**
 * @inheritDoc
 */
os.im.mapping.location.BaseLatMapping.prototype.getFieldsChanged = function() {
  return [this.field, this.coordField];
};


/**
 * @inheritDoc
 */
os.im.mapping.location.BaseLatMapping.prototype.getLabel = function() {
  return this.type;
};


/**
 * @inheritDoc
 */
os.im.mapping.location.BaseLatMapping.prototype.getScore = function() {
  if (this.type && this.field) {
    return this.type.toLowerCase().indexOf(this.field.toLowerCase()) == 0 ? 11 : 10;
  }

  return os.im.mapping.location.BaseLatMapping.base(this, 'getScore');
};


/**
 * @inheritDoc
 */
os.im.mapping.location.BaseLatMapping.prototype.getScoreType = function() {
  return 'geom';
};


/**
 * @inheritDoc
 */
os.im.mapping.location.BaseLatMapping.prototype.execute = function(item, targetItem) {
  var value = NaN;
  if (!targetItem) {
    targetItem = item;
  }

  if (this.field) {
    var fieldValue = os.im.mapping.getItemField(item, this.field);
    if (fieldValue) {
      fieldValue = String(fieldValue).replace(os.geo.COORD_CLEANER, '');
      value = os.geo.parseLat(fieldValue, this.customFormat);

      if (!isNaN(value)) {
        os.im.mapping.setItemField(item, this.coordField, value);
        this.addGeometry(item, targetItem);
      }
    }
  }
};


/**
 * @inheritDoc
 */
os.im.mapping.location.BaseLatMapping.prototype.testField = function(value) {
  if (value) {
    var l = os.geo.parseLat(String(value));
    return goog.isDefAndNotNull(l) && !isNaN(l);
  }
  return false;
};


/**
 * @inheritDoc
 */
os.im.mapping.location.BaseLatMapping.prototype.testAndGetField = function(value, opt_format) {
  if (value) {
    var l = os.geo.parseLat(String(value), opt_format);
    return goog.isDefAndNotNull(l) && !isNaN(l) ? l.toString() : null;
  }
  return null;
};


/**
 * @param {T} item
 * @param {S} targetItem
 * @protected
 */
os.im.mapping.location.BaseLatMapping.prototype.addGeometry = function(item, targetItem) {
  var lat = item['LAT'];
  var lon = item['LON'];
  if (goog.isDef(lat) && !isNaN(lat) && goog.isNumber(lat) && goog.isDef(lon) && !isNaN(lon) && goog.isNumber(lon)) {
    targetItem['GEOM'] = [lon, lat];
  }
};


/**
 * @inheritDoc
 */
os.im.mapping.location.BaseLatMapping.prototype.autoDetect = function(items) {
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

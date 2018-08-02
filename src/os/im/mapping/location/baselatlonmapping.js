goog.provide('os.im.mapping.location.BaseLatLonMapping');
goog.require('os.geo');
goog.require('os.im.mapping.AbstractMapping');
goog.require('os.im.mapping.AbstractPositionMapping');



/**
 * Mapping to translate a coordinate string to a point geometry.
 * @param {number=} opt_order
 * @extends {os.im.mapping.AbstractPositionMapping.<T, S>}
 * @constructor
 * @template T, S
 */
os.im.mapping.location.BaseLatLonMapping = function(opt_order) {
  os.im.mapping.location.BaseLatLonMapping.base(this, 'constructor');

  /**
   * @type {number}
   * @private
   */
  this.order_ = goog.isDef(opt_order) ? opt_order : os.geo.PREFER_LAT_FIRST;
};
goog.inherits(os.im.mapping.location.BaseLatLonMapping, os.im.mapping.AbstractPositionMapping);


/**
 * Maps a coordinate string to a geometry.
 * @param {T} item The item to modify
 * @param {S=} opt_targetItem The optional target item
 * @throws {Error} If the location field cannot be parsed.
 * @override
 */
os.im.mapping.location.BaseLatLonMapping.prototype.execute = function(item, opt_targetItem) {
  if (this.field) {
    var fieldValue = os.im.mapping.getItemField(item, this.field) || '';

    // try to idiot proof the position string
    fieldValue = goog.string.trim(fieldValue.replace(os.geo.COORD_CLEANER, ''));
    if (fieldValue) {
      var location = this.parseLatLon(fieldValue, this.customFormat);
      if (location) {
        var coord = [location.lon, location.lat];
        item[this.field] = coord;
      } else {
        throw new Error('Could not parse coordinate from "' + fieldValue + '"!');
      }
    }
  }
};


/**
 * @return {number}
 */
os.im.mapping.location.BaseLatLonMapping.prototype.getOrder = function() {
  return this.order_;
};


/**
 * @param {number} order
 */
os.im.mapping.location.BaseLatLonMapping.prototype.setOrder = function(order) {
  this.order_ = order;
};


/**
 * @inheritDoc
 */
os.im.mapping.location.BaseLatLonMapping.prototype.testField = function(value) {
  if (value) {
    var l = this.parseLatLon(String(value));
    return goog.isDefAndNotNull(l);
  }
  return false;
};


/**
 * @inheritDoc
 */
os.im.mapping.location.BaseLatLonMapping.prototype.testAndGetField = function(value, opt_format) {
  if (value) {
    var l = this.parseLatLon(String(value), opt_format);
    if (goog.isDefAndNotNull(l)) {
      return l.lat.toString() + ' ' + l.lon.toString();
    }
  }
  return null;
};


/**
 * Parses a coordinate string into a lat/lon pair.
 * @param {string} value
 * @param {string=} opt_format Custom format string
 * @return {?osx.geo.Location}
 * @protected
 */
os.im.mapping.location.BaseLatLonMapping.prototype.parseLatLon = function(value, opt_format) {
  return os.geo.parseLatLon(value, this.order_, opt_format);
};

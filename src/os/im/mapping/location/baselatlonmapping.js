goog.module('os.im.mapping.location.BaseLatLonMapping');

const {COORD_CLEANER, PREFER_LAT_FIRST, parseLatLon} = goog.require('os.geo');
const {getItemField} = goog.require('os.im.mapping');
const AbstractPositionMapping = goog.require('os.im.mapping.AbstractPositionMapping');


/**
 * Mapping to translate a coordinate string to a point geometry.
 *
 * @extends {AbstractPositionMapping<T, S>}
 * @template T, S
 */
class BaseLatLonMapping extends AbstractPositionMapping {
  /**
   * Constructor.
   * @param {number=} opt_order
   */
  constructor(opt_order) {
    super();

    /**
     * @type {number}
     * @private
     */
    this.order_ = opt_order !== undefined ? opt_order : PREFER_LAT_FIRST;
  }

  /**
   * Maps a coordinate string to a geometry.
   *
   * @param {T} item The item to modify
   * @param {S=} opt_targetItem The optional target item
   * @throws {Error} If the location field cannot be parsed.
   * @override
   */
  execute(item, opt_targetItem) {
    if (this.field) {
      var fieldValue = getItemField(item, this.field) || '';

      // try to idiot proof the position string
      fieldValue = fieldValue.replace(COORD_CLEANER, '').trim();
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
  }

  /**
   * @return {number}
   */
  getOrder() {
    return this.order_;
  }

  /**
   * @param {number} order
   */
  setOrder(order) {
    this.order_ = order;
  }

  /**
   * @inheritDoc
   */
  testField(value) {
    if (value) {
      var l = this.parseLatLon(String(value));
      return l != null;
    }
    return false;
  }

  /**
   * @inheritDoc
   */
  testAndGetField(value, opt_format) {
    if (value) {
      var l = this.parseLatLon(String(value), opt_format);
      if (l != null) {
        return l.lat.toString() + ' ' + l.lon.toString();
      }
    }
    return null;
  }

  /**
   * Parses a coordinate string into a lat/lon pair.
   *
   * @param {string} value
   * @param {string=} opt_format Custom format string
   * @return {?osx.geo.Location}
   * @protected
   */
  parseLatLon(value, opt_format) {
    return parseLatLon(value, this.order_, opt_format);
  }
}

exports = BaseLatLonMapping;

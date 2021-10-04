goog.declareModuleId('os.im.mapping.location.AbstractBaseLatOrLonMapping');

import {COORD_CLEANER} from '../../../geo/geo.js';
import AbstractPositionMapping from '../abstractpositionmapping.js';
import {getBestFieldMatch, getItemField, setItemField} from '../mapping.js';


/**
 * @extends {AbstractPositionMapping<T, S>}
 * @template T, S
 */
export default class AbstractBaseLatOrLonMapping extends AbstractPositionMapping {
  /**
   * Constructor.
   */
  constructor() {
    super();

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
  }

  /**
   * @inheritDoc
   */
  getId() {
    return this.type;
  }

  /**
   * @inheritDoc
   */
  getFieldsChanged() {
    return [this.field, this.coordField];
  }

  /**
   * @inheritDoc
   */
  getLabel() {
    return this.type;
  }

  /**
   * @inheritDoc
   */
  getScore() {
    if (this.type && this.field) {
      return this.type.toLowerCase().indexOf(this.field.toLowerCase()) == 0 ? 11 : 10;
    }

    return super.getScore();
  }

  /**
   * @inheritDoc
   */
  getScoreType() {
    return 'geom';
  }

  /**
   * @inheritDoc
   */
  execute(item, targetItem) {
    var value = NaN;
    if (!targetItem) {
      targetItem = item;
    }

    if (this.field) {
      var fieldValue = getItemField(item, this.field);
      if (fieldValue) {
        fieldValue = String(fieldValue).replace(COORD_CLEANER, '');
        value = this.parseFn(fieldValue, this.customFormat);

        if (!isNaN(value)) {
          setItemField(item, this.coordField, value);
          this.addGeometry(item, targetItem);
        }
      }
    }
  }

  /**
   * @inheritDoc
   */
  testField(value) {
    if (value) {
      var l = this.parseFn(String(value));
      return l != null && !isNaN(l);
    }
    return false;
  }

  /**
   * @inheritDoc
   */
  testAndGetField(value, opt_format) {
    if (value) {
      var l = this.parseFn(String(value), opt_format);
      return l != null && !isNaN(l) ? l.toString() : null;
    }
    return null;
  }

  /**
   * @param {T} item
   * @param {S} targetItem
   * @protected
   */
  addGeometry(item, targetItem) {
    var lat = item['LAT'];
    var lon = item['LON'];
    if (lat !== undefined && !isNaN(lat) && typeof lat === 'number' &&
        lon !== undefined && !isNaN(lon) && typeof lon === 'number') {
      targetItem['GEOM'] = [lon, lat];
    }
  }

  /**
   * @inheritDoc
   */
  autoDetect(items) {
    var m = null;
    if (items) {
      var i = items.length;
      var f = undefined;
      while (i--) {
        var item = items[i];
        f = getBestFieldMatch(item, this.regex, f);

        if (f) {
          m = new this.constructor();
          m.field = f;
        }
      }
    }

    return m;
  }
}

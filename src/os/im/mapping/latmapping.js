goog.declareModuleId('os.im.mapping.LatMapping');

import Point from 'ol/src/geom/Point.js';

import Fields from '../../fields/fields.js';
import {COORD_CLEANER, parseLat} from '../../geo/geo.js';
import AbstractPositionMapping from './abstractpositionmapping.js';
import {getBestFieldMatch, getItemField, setItemField} from './mapping.js';
import MappingRegistry from './mappingregistry.js';



/**
 * @extends {AbstractPositionMapping<Feature>}
 */
export default class LatMapping extends AbstractPositionMapping {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.xmlType = LatMapping.ID;

    /**
     * @type {string}
     * @protected
     */
    this.coordField = Fields.LAT;

    /**
     * @type {string}
     * @protected
     */
    this.type = LatMapping.ID;

    /**
     * @type {RegExp}
     * @protected
     */
    this.regex = LatMapping.LAT_REGEX;
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
  execute(item) {
    var value = NaN;
    if (this.field) {
      var fieldValue = getItemField(item, this.field);
      if (fieldValue != null) {
        fieldValue = String(fieldValue).replace(COORD_CLEANER, '');
        value = parseLat(fieldValue, this.customFormat);

        if (!isNaN(value)) {
          setItemField(item, this.coordField, value);
          this.addGeometry(item);
        }
      }
    }
  }

  /**
   * @inheritDoc
   */
  testField(value) {
    if (value) {
      var l = parseLat(String(value));
      return l != null && !isNaN(l);
    }
    return false;
  }

  /**
   * @inheritDoc
   */
  testAndGetField(value, opt_format) {
    if (value) {
      var l = parseLat(String(value), opt_format);
      if (l != null && !isNaN(l)) {
        return l.toString();
      }
    }
    return null;
  }

  /**
   * @param {Feature} feature
   * @protected
   */
  addGeometry(feature) {
    var current = feature.getGeometry();
    if (current) {
      // already has a geometry... don't bother
      return;
    }

    var lat = feature.get(Fields.LAT);
    var lon = feature.get(Fields.LON);
    if (lat !== undefined && !isNaN(lat) && typeof lat === 'number' &&
        lon !== undefined && !isNaN(lon) && typeof lon === 'number') {
      var geom = new Point([lon, lat]);
      feature.suppressEvents();
      feature.setGeometry(geom.osTransform());
      feature.enableEvents();
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
        var feature = items[i];
        var geom = feature.getGeometry();
        if (geom) {
          // Something else (most likely the parser) has already populated the geometry.
          return null;
        }

        f = getBestFieldMatch(feature, this.regex, f);

        if (f) {
          m = new this.constructor();
          m.field = f;
        }
      }
    }

    return m;
  }
}

/**
 * @type {string}
 */
LatMapping.ID = 'Latitude';

// Register the mapping.
MappingRegistry.getInstance().registerMapping(LatMapping.ID, LatMapping);

/**
 * Matches "lat" with optional variations of "itude", surrounded by a word boundary, whitespace, or undersos.
 * @type {RegExp}
 */
LatMapping.LAT_REGEX = /(\b|_)lat(i(t(u(d(e)?)?)?)?)?(\b|_)/i;

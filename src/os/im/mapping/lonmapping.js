goog.declareModuleId('os.im.mapping.LonMapping');

import Fields from '../../fields/fields.js';
import {COORD_CLEANER, parseLon} from '../../geo/geo.js';
import LatMapping from './latmapping.js';
import {getItemField, setItemField} from './mapping.js';
import MappingRegistry from './mappingregistry.js';


/**
 */
export default class LonMapping extends LatMapping {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.coordField = Fields.LON;
    this.type = LonMapping.ID;
    this.regex = LonMapping.LON_REGEX;
    this.xmlType = LonMapping.ID;
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
        value = parseLon(fieldValue, this.customFormat);

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
      var l = parseLon(String(value));
      return l != null && !isNaN(l);
    }
    return false;
  }

  /**
   * @inheritDoc
   */
  testAndGetField(value, opt_format) {
    if (value) {
      var l = parseLon(String(value), opt_format);
      if (l != null && !isNaN(l)) {
        return l.toString();
      }
    }
    return null;
  }
}

/**
 * @type {string}
 * @override
 */
LonMapping.ID = 'Longitude';

// Register the mapping.
MappingRegistry.getInstance().registerMapping(LonMapping.ID, LonMapping);

/**
 * Matches "lon" with optional variations of "gitude", surrounded by a word boundary or undersos.
 * @type {RegExp}
 */
LonMapping.LON_REGEX = /(\b|_)lon(g(i(t(u(d(e)?)?)?)?)?)?(\b|_)/i;

goog.declareModuleId('os.im.mapping.location.BaseMGRSMapping');

import {MGRS_REGEXP} from '../../../geo/geo.js';
import AbstractPositionMapping from '../abstractpositionmapping.js';
import {getItemField} from '../mapping.js';


/**
 * Mapping to translate an MGRS coordinate string to a point geometry.
 *
 * @extends {AbstractPositionMapping<T, S>}
 * @template T, S
 */
export default class BaseMGRSMapping extends AbstractPositionMapping {
  /**
   * Constructor.
   */
  constructor() {
    super();
  }

  /**
   * Maps an MGRS coordinate string to a geometry.
   *
   * @param {T} item The feature to modify
   * @param {S=} opt_targetItem The optional target item
   * @throws {Error} If the location field cannot be parsed.
   * @override
   */
  execute(item, opt_targetItem) {
    if (this.field) {
      var mgrs = getItemField(item, this.field);
      if (mgrs) {
        mgrs = mgrs.replace(/\s/g, '');
        mgrs = mgrs.toUpperCase();

        if (mgrs.match(MGRS_REGEXP)) {
          var coord = osasm.toLonLat(mgrs);
          item[this.field] = coord;
        } else {
          throw new Error('"' + mgrs + '" does not appear to be a valid MGRS coordinate!');
        }
      }
    }
  }

  /**
   * @inheritDoc
   */
  testField(value) {
    if (value) {
      var mgrs = value.replace(/\s/g, '');
      mgrs = mgrs.toUpperCase();
      return mgrs.match(MGRS_REGEXP) != null;
    }
    return false;
  }
}

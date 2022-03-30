goog.declareModuleId('os.im.mapping.MGRSMapping');

import Point from 'ol/src/geom/Point.js';

import {MGRS_REGEXP} from '../../geo/geo.js';
import BaseMGRSMapping from './location/basemgrsmapping.js';
import {getItemField} from './mapping.js';
import MappingRegistry from './mappingregistry.js';



/**
 * Mapping to translate an MGRS coordinate string to a point geometry.
 *
 * @extends {BaseMGRSMapping<Feature>}
 */
export default class MGRSMapping extends BaseMGRSMapping {
  /**
   * Constructor.
   */
  constructor() {
    super();
  }

  /**
   * Maps an MGRS coordinate string to a geometry.
   *
   * @param {Feature} item The feature to modify
   * @throws {Error} If the location field cannot be parsed.
   * @override
   */
  execute(item) {
    if (this.field) {
      var mgrs = getItemField(item, this.field);
      if (mgrs) {
        mgrs = mgrs.replace(/\s/g, '');
        mgrs = mgrs.toUpperCase();

        if (mgrs.match(MGRS_REGEXP)) {
          var coord = osasm.toLonLat(mgrs);
          var geom = new Point(coord);
          item.suppressEvents();
          item.setGeometry(geom.osTransform());
          item.enableEvents();
        } else {
          throw new Error('"' + mgrs + '" does not appear to be a valid MGRS coordinate!');
        }
      }
    }
  }
}

/**
 * @type {string}
 */
MGRSMapping.ID = 'MGRSMapping';

// Register the mapping.
MappingRegistry.getInstance().registerMapping(MGRSMapping.ID, MGRSMapping);

goog.declareModuleId('os.im.mapping.WKTMapping');

import * as osMap from '../../map/map.js';
import {FORMAT} from '../../ol/wkt.js';
import {EPSG4326} from '../../proj/proj.js';
import AbstractPositionMapping from './abstractpositionmapping.js';
import {getItemField} from './mapping.js';
import MappingRegistry from './mappingregistry.js';

const log = goog.require('goog.log');


/**
 * @extends {AbstractPositionMapping<Feature>}
 */
export default class WKTMapping extends AbstractPositionMapping {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.xmlType = WKTMapping.ID;
  }

  /**
   * @inheritDoc
   */
  getId() {
    return WKTMapping.ID;
  }

  /**
   * @inheritDoc
   */
  getFieldsChanged() {
    return [this.field];
  }

  /**
   * @inheritDoc
   */
  getLabel() {
    return WKTMapping.ID;
  }

  /**
   * @inheritDoc
   */
  getScore() {
    return 20;
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
    if (this.field) {
      var fieldValue = getItemField(item, this.field);
      if (fieldValue) {
        var geom = FORMAT.readGeometry(String(fieldValue), {
          dataProjection: EPSG4326,
          featureProjection: osMap.PROJECTION
        });

        if (geom) {
          item.suppressEvents();
          item.set(this.field, undefined);
          item.setGeometry(geom);
          item.enableEvents();
        }
      }
    }
  }

  /**
   * @inheritDoc
   */
  autoDetect(features) {
    if (features) {
      var i = features.length;
      while (i--) {
        var feature = features[i];
        var geom = feature.getGeometry();
        if (geom) {
          // Something else (most likely the parser) has already populated the geometry.
          return null;
        }

        var fields = feature.getProperties();
        var mappings = [];

        for (var field in fields) {
          var val = feature.get(field);
          if (val && WKTMapping.WKT_REGEX.test(String(val))) {
            var mapping = new WKTMapping();
            mapping.field = field;
            mappings.push(mapping);
          }
        }

        // if multiple WKT fields, favor anything over CENTROID/CENTER, which is likely center of the actual geometry
        if (mappings.length > 0) {
          var map = mappings[0];
          for (var j = 0; j < mappings.length; j++) {
            if (!WKTMapping.CENTER_REGEXP.test(mappings[j].field)) {
              map = mappings[j];
            }
          }
          return map;
        }
      }
    }

    return null;
  }

  /**
   * @inheritDoc
   */
  testField(value) {
    var geom = null;
    try { // ol throws all kinds off errors when the format is unexpected
      geom = FORMAT.readGeometry(String(value));
    } catch (e) {
      log.error(logger, 'failed restoring descriptors from settings', e);
    }
    return geom != null;
  }
}

/**
 * @type {string}
 */
WKTMapping.ID = 'WKTGeometry';

// Register the mapping.
MappingRegistry.getInstance().registerMapping(WKTMapping.ID, WKTMapping);

/**
 * Logger
 * @type {goog.log.Logger}
 */
const logger = log.getLogger('os.im.mapping.WKTMapping');

/**
 * @type {RegExp}
 * @const
 */
WKTMapping.WKT_REGEX =
    /^\s*(POINT|LINESTRING|LINEARRING|POLYGON|MULTIPOINT|MULTILINESTRING|MULTIPOLYGON|GEOMETRYCOLLECTION)\s*Z?[(]/i;

/**
 * @type {RegExp}
 * @const
 */
WKTMapping.CENTER_REGEXP = /(center|centroid)/i;

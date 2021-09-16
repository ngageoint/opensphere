goog.module('os.im.mapping.MGRSMapping');

const Point = goog.require('ol.geom.Point');
const {MGRS_REGEXP} = goog.require('os.geo');
const {getItemField} = goog.require('os.im.mapping');
const MappingRegistry = goog.require('os.im.mapping.MappingRegistry');
const BaseMGRSMapping = goog.require('os.im.mapping.location.BaseMGRSMapping');

const Feature = goog.requireType('ol.Feature');


/**
 * Mapping to translate an MGRS coordinate string to a point geometry.
 *
 * @extends {BaseMGRSMapping<Feature>}
 */
class MGRSMapping extends BaseMGRSMapping {
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

exports = MGRSMapping;

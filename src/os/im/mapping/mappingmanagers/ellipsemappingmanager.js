goog.module('os.im.mapping.EllipseMappingManager');
goog.module.declareLegacyNamespace();


const olEvents = goog.require('ol.events');
const AbstractMappingManager = goog.require('os.im.mapping.AbstractMappingManager');
const OrientationMapping = goog.require('os.im.mapping.OrientationMapping');
const RadiusMapping = goog.require('os.im.mapping.RadiusMapping');
const SemiMajorMapping = goog.require('os.im.mapping.SemiMajorMapping');
const SemiMinorMapping = goog.require('os.im.mapping.SemiMinorMapping');
const {setFeaturesStyle, notifyStyleChange} = goog.require('os.style');
const {PROPERTYCHANGE} = goog.require('goog.events.EventType');
const {createEllipse} = goog.require('os.feature');
const {ORIENTATION} = goog.require('os.Fields');
const {
  DEFAULT_RADIUS_COL_NAME: RADIUS,
  DEFAULT_SEMI_MAJ_COL_NAME: SEMI_MAJOR,
  DEFAULT_SEMI_MIN_COL_NAME: SEMI_MINOR
} = goog.require('os.fields');

const olLayer = goog.requireType('ol.layer.Layer');
const RenameMapping = goog.requireType('os.im.mapping.RenameMapping');
const ColumnDefinition = goog.requireType('os.data.ColumnDefinition');


/**
 * @typedef {{
 *   keepOriginal: boolean,
 *   radius: (?string|ColumnDefinition),
 *   radiusUnits: (?string),
 *   semiMajor: (?string|ColumnDefinition),
 *   semiMajorUnits: (?string),
 *   semiMinor: (?string|ColumnDefinition),
 *   semiMinorUnits: (?string)
 * }}
 */
let MappingOptions;


/**
 * Settings key
 * @type {string}
 */
const ELLIPSE_MAPPING_KEY = 'ellipseMappings';


/**
 * Class for Ellipse Mapping Manager
 * @unrestricted
 */
class MappingManager extends AbstractMappingManager {
  /**
   * Constructor.
   * @ngInject
   * @param {*=} opt_source
   */
  constructor(opt_source) {
    super(opt_source);

    /**
     * FeatureCount
     * @type {number}
     * @private
     */
    this.featureCount_ = opt_source ? this.source_.getFeatureCount() : undefined;
  }

  /**
   * Create Mappings for Ellipse Data
   * @param {MappingOptions} data
   * @return {Array<RenameMapping>}
   * @override
   */
  createMappings(data) {
    const mappings = [];

    if (data['radius']) {
      const rm = new RadiusMapping();
      rm.field = data['radius'].name || data['radius'];
      rm.setUnits(data['radiusUnits']);
      mappings.push(rm);
    }
    if (data['semiMajor']) {
      var smaj = new SemiMajorMapping();
      smaj.field = data['semiMajor'].name || data['semiMajor'];
      smaj.setUnits(data['semiMajorUnits']);
      mappings.push(smaj);
    }
    if (data['semiMinor']) {
      var smin = new SemiMinorMapping();
      smin.field = data['semiMinor'].name || data['semiMinor'];
      smin.setUnits(data['semiMinorUnits']);
      mappings.push(smin);
    }
    if (data['orientation']) {
      var om = new OrientationMapping();
      om.field = data['orientation'].name || data['orientation'];
      mappings.push(om);
    }


    if (this.source_) {
      if (!this.sourceListener_) this.listenerSetup_();
      this.setMappings(mappings);
    }

    return mappings;
  }



  /**
   * Execute the Mappings for the source
   * @override
   */
  executeMappings() {
    const sourceId = this.source_.getId();
    // HACK: doing goog.require('os.MapContainer') creates a circular dependency somewhere in
    // the os.layer chain. TODO Fix it when there's time
    const layer = os.map.mapContainer.getLayer(sourceId);
    const mappings = this.getMappings() || [];
    const features = this.source_.getFeatures();
    const options = this.getMappingOptions() || {};
    const keepOriginal = options['keepOriginal'] || false;

    mappings.forEach((mapping) => {
      features.forEach((feature) => {
        mapping.execute(feature, keepOriginal);
        createEllipse(feature, true);
      });
    });

    this.appliedMappings_ = this.getMappings();
    this.updateColumns_();
    setFeaturesStyle(features);
    notifyStyleChange(/** @type {olLayer} */ (layer));
  }


  /**
   * Update the columns so they show up in the analyze tool/feature info
   * @private
   */
  updateColumns_() {
    const mappings = this.getMappings();

    mappings.forEach((mapping) => {
      const label = mapping.getLabel();

      if (RadiusMapping.REGEX.test(label)) {
        this.source_.addColumn(RADIUS);
      } else if (SemiMajorMapping.REGEX.test(label)) {
        this.source_.addColumn(SEMI_MAJOR);
      } else if (SemiMinorMapping.REGEX.test(label)) {
        this.source_.addColumn(SEMI_MINOR);
      } else if (OrientationMapping.REGEX.test(label)) {
        this.source_.addColumn(ORIENTATION);
      }
    });
  }


  /**
   * Layers Added
   * @private
   */
  featuresAdded_() {
    // Only execute the mappings if there are new features, or new mappings
    const sourceFeatureCount = this.source_.getFeatureCount();
    if ((this.featureCount_ != sourceFeatureCount && sourceFeatureCount > 0) ||
    (this.getMappings() != this.appliedMappings_)) {
      this.featureCount_ = sourceFeatureCount;
      this.executeMappings();
    }
  }


  /**
   * Setup a listener on the source
   * @private
   */
  listenerSetup_() {
    this.sourceListener_ = olEvents.listen(
        /** @type {olEvents.EventTarget} */ (this.source_),
        PROPERTYCHANGE,
        this.featuresAdded_,
        this
    );
  }
}


exports = {
  MappingOptions,
  MappingManager,
  ELLIPSE_MAPPING_KEY
};

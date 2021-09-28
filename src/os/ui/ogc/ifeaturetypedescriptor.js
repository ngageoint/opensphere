goog.declareModuleId('os.ui.ogc.IFeatureTypeDescriptor');

const IFeatureType = goog.requireType('os.ogc.IFeatureType');


/**
 * Interface for descriptors providing an `IFeatureType`.
 *
 * @interface
 */
export default class IFeatureTypeDescriptor {
  /**
   * Get the FeatureType.
   * @return {IFeatureType}
   */
  getFeatureType() {}

  /**
   * Check if the FeatureType is ready and load it if not.
   * @return {boolean}
   */
  isFeatureTypeReady() {}
}

/**
 * @type {string}
 * @const
 */
IFeatureTypeDescriptor.ID = 'os.ui.ogc.IFeatureTypeDescriptor';

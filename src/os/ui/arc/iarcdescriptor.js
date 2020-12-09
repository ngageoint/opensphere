goog.module('os.ui.arc.IARCDescriptor');
goog.module.declareLegacyNamespace();

const IDataDescriptor = goog.requireType('os.data.IDataDescriptor');
const IServerDescriptor = goog.requireType('os.data.IServerDescriptor');
const IFilterable = goog.requireType('os.filter.IFilterable');
const IFeatureTypeDescriptor = goog.requireType('os.ui.ogc.IFeatureTypeDescriptor');


/**
 * Interface for ARC data descriptors
 *
 * @interface
 * @extends {IDataDescriptor}
 * @extends {IServerDescriptor}
 * @extends {IFilterable}
 * @extends {IFeatureTypeDescriptor}
 */
class IARCDescriptor {
  /**
   * Set the url
   * @param {?string} value
   */
  setUrl(value) {}

  /**
   * Get the url
   * @return {?string}
   */
  getUrl() {}

  /**
   * Set deprecated
   * @param {boolean} value
   */
  setDeprecated(value) {}

  /**
   * Get deprecated
   * @return {boolean}
   */
  getDeprecated() {}
}

/**
 * @type {string}
 * @const
 */
IARCDescriptor.ID = 'os.ui.arc.IARCDescriptor';

exports = IARCDescriptor;

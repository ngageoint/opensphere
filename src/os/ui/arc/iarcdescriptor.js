goog.declareModuleId('os.ui.arc.IARCDescriptor');

const {default: IDataDescriptor} = goog.requireType('os.data.IDataDescriptor');
const {default: IServerDescriptor} = goog.requireType('os.data.IServerDescriptor');
const {default: IFilterable} = goog.requireType('os.filter.IFilterable');
const {default: IFeatureTypeDescriptor} = goog.requireType('os.ui.ogc.IFeatureTypeDescriptor');


/**
 * Interface for ARC data descriptors
 *
 * @interface
 * @extends {IDataDescriptor}
 * @extends {IServerDescriptor}
 * @extends {IFilterable}
 * @extends {IFeatureTypeDescriptor}
 */
export default class IARCDescriptor {
  /**
   * Get the url
   * @return {?string}
   */
  getUrl() {}

  /**
   * Set the url
   * @param {?string} value
   */
  setUrl(value) {}

  /**
   * Get deprecated
   * @return {boolean}
   */
  getDeprecated() {}

  /**
   * Set deprecated
   * @param {boolean} value
   */
  setDeprecated(value) {}
}

/**
 * @type {string}
 * @const
 */
IARCDescriptor.ID = 'os.ui.arc.IARCDescriptor';

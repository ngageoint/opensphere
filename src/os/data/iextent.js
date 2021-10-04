goog.declareModuleId('os.data.IExtent');

/**
 * @interface
 */
export default class IExtent {
  /**
   * @return {?ol.Extent} The extent or null
   */
  getExtent() {}
}

/**
 * @const
 * @type {string}
 */
IExtent.ID = 'os.data.IExtent';

goog.module('os.data.IExtent');
goog.module.declareLegacyNamespace();


/**
 * @interface
 */
class IExtent {
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


exports = IExtent;

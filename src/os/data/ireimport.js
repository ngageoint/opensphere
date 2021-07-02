goog.module('os.data.IReimport');
goog.module.declareLegacyNamespace();


/**
 * @interface
 */
class IReimport {
  /**
   * @return {boolean}
   */
  canReimport() {}

  /**
   * Reimports this item
   */
  reimport() {}
}

exports = IReimport;

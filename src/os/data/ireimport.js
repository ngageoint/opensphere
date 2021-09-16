goog.module('os.data.IReimport');


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

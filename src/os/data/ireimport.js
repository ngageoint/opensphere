goog.declareModuleId('os.data.IReimport');

/**
 * @interface
 */
export default class IReimport {
  /**
   * @return {boolean}
   */
  canReimport() {}

  /**
   * Reimports this item
   */
  reimport() {}
}

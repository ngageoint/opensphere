goog.declareModuleId('os.source.IModifiableSource');

/**
 * @interface
 */
export default class IModifiableSource {
  /**
   * Get whether the source supports modify.
   * @return {boolean}
   */
  supportsModify() {}

  /**
   * Get the modify function used to handle the feature update.
   * @return {function(Feature, Feature)} Function that takes the feature to update as the first argument and the
   *                                      feature that was modified by the interaction as the second argument.
   */
  getModifyFunction() {}
}

/**
 * Identifier used with os.implements.
 * @type {string}
 */
IModifiableSource.ID = 'os.source.IModifiableSource';

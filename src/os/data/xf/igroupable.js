goog.declareModuleId('os.data.xf.IGroupable');

const Listenable = goog.requireType('goog.events.Listenable');


/**
 * Interface representing a XF groupable object.
 *
 * @extends {Listenable}
 * @template T
 * @interface
 */
export default class IGroupable {
  /**
   * Get the name.
   * @return {?string}
   */
  getName() {}

  /**
   * Set the name.
   * @param {?string} value
   */
  setName(value) {}

  /**
   * Gets the bin method.
   * @return {os.histo.IBinMethod}
   */
  getBinMethod() {}

  /**
   * Sets the bin method.
   * @param {os.histo.IBinMethod} value The count object
   */
  setBinMethod(value) {}

  /**
   * This runs when an item is added to a group
   * @param {os.histo.Bin<T>} bin
   * @param {T} item
   * @return {os.histo.Bin<T>}
   */
  reduceAdd(bin, item) {}

  /**
   * This runs when an item is removed from a group
   * @param {os.histo.Bin<T>} bin
   * @param {T} item
   * @return {os.histo.Bin.<T>}
   */
  reduceRemove(bin, item) {}

  /**
   * Creates a new bin for a group
   * @return {os.histo.Bin<T>}
   */
  reduceInit() {}
}

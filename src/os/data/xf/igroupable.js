goog.declareModuleId('os.data.xf.IGroupable');

const Listenable = goog.requireType('goog.events.Listenable');
const {default: Bin} = goog.requireType('os.histo.Bin');
const {default: IBinMethod} = goog.requireType('os.histo.IBinMethod');


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
   * @return {IBinMethod}
   */
  getBinMethod() {}

  /**
   * Sets the bin method.
   * @param {IBinMethod} value The count object
   */
  setBinMethod(value) {}

  /**
   * This runs when an item is added to a group
   * @param {Bin<T>} bin
   * @param {T} item
   * @return {Bin<T>}
   */
  reduceAdd(bin, item) {}

  /**
   * This runs when an item is removed from a group
   * @param {Bin<T>} bin
   * @param {T} item
   * @return {Bin.<T>}
   */
  reduceRemove(bin, item) {}

  /**
   * Creates a new bin for a group
   * @return {Bin<T>}
   */
  reduceInit() {}
}

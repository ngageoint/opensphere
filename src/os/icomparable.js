goog.declareModuleId('os.IComparable');

/**
 * Interface for objects that can be compared.
 *
 * @interface
 * @template T
 */
export default class IComparable {
  /**
   * Compares this object to another object.
   * @param {T} other The other object
   * @return {number} The comparison value
   */
  compare(other) {}
}

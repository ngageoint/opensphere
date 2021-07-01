goog.module('os.IComparable');
goog.module.declareLegacyNamespace();

/**
 * Interface for objects that can be compared.
 *
 * @interface
 * @template T
 */
class IComparable {
  /**
   * Compares this object to another object.
   * @param {T} other The other object
   * @return {number} The comparison value
   */
  compare(other) {}
}

exports = IComparable;

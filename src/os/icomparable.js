goog.provide('os.IComparable');



/**
 * Interface for objects that can be compared.
 * @interface
 * @template T
 */
os.IComparable = function() {};


/**
 * Compares this object to another object.
 * @param {T} other The other object
 * @return {number} The comparison value
 */
os.IComparable.prototype.compare;

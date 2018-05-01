goog.provide('os.IPersistable');



/**
 * An interface for persistable/restorable objects
 * @interface
 * @template T
 */
os.IPersistable = function() {};


/**
 * Persists this object
 * @param {T=} opt_to An optional object to persist to. By default a new object is created.
 * @return {!T}
 */
os.IPersistable.prototype.persist;


/**
 * Restores the object
 * @param {!T} config The object from which to restore
 */
os.IPersistable.prototype.restore;

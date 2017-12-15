goog.provide('os.IPersistable');



/**
 * An interface for persistable/restorable objects
 * @interface
 */
os.IPersistable = function() {};


/**
 * Persists this object
 * @param {Object=} opt_to An optional object to persist to. By default a new object is created.
 * @return {!Object}
 */
os.IPersistable.prototype.persist;


/**
 * Restores the object
 * @param {!Object} config The object from which to restore
 */
os.IPersistable.prototype.restore;

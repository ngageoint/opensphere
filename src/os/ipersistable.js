goog.declareModuleId('os.IPersistable');

/**
 * An interface for persistable/restorable objects
 *
 * @interface
 * @template T
 */
export default class IPersistable {
  /**
   * Persists this object
   * @param {T=} opt_to An optional object to persist to. By default a new object is created.
   * @return {!T}
   */
  persist(opt_to) {}

  /**
   * Restores the object
   * @param {!T} config The object from which to restore
   */
  restore(config) {}
}

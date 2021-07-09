goog.module('os.config.storage.ISettingsStorage');
goog.module.declareLegacyNamespace();

const Deferred = goog.requireType('goog.async.Deferred');


/**
 * Basic interface for settings storage
 *
 * @interface
 */
class ISettingsStorage {
  /**
   * Constructor.
   */
  constructor() {
    /**
     * Determines if this storage is in a good state to be accessible.  If an error occurs, this will be set to false
     * and should no longer be considered for transactions.
     * @type {boolean}
     */
    this.canAccess;

    /**
     * An easy name for this storage
     * @type {string}
     */
    this.name;
  }

  /**
   * Initialize the storage
   * @return {!Deferred}
   */
  init() {}
}


/**
 * ID for the interface
 * @const {string}
 */
ISettingsStorage.ID = 'os.config.storage.ISettingsStorage';


exports = ISettingsStorage;

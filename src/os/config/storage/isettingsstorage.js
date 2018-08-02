goog.provide('os.config.storage.ISettingsStorage');
goog.require('goog.async.Deferred');



/**
 * Basic interface for settings storage
 * @interface
 */
os.config.storage.ISettingsStorage = function() {};


/**
 * ID for the interface
 * @const {string}
 */
os.config.storage.ISettingsStorage.ID = 'os.config.storage.ISettingsStorage';


/**
 * Initialize the storage
 * @return {!goog.async.Deferred}
 */
os.config.storage.ISettingsStorage.prototype.init;


/**
 * Determines if this storage is in a good state to be accessible.  If an error occurs, this will be set to false
 * and should no longer be considered for transactions.
 * @type {boolean}
 */
os.config.storage.ISettingsStorage.prototype.canAccess;


/**
 * An easy name for this storage
 * @type {string}
 */
os.config.storage.ISettingsStorage.prototype.name;


/**
 * @constructor
 */
var StorageManager;

/**
 * @return {Promise<StorageEstimate>}
 */
StorageManager.prototype.estimate;

/**
 * @return {Promise<boolean>}
 */
StorageManager.prototype.persist;

/**
 * @return {Promise<boolean>}
 */
StorageManager.prototype.persisted;

/**
 * @typedef {{quota: number, usage: number}}
 */
var StorageEstimate;

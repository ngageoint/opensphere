goog.provide('os.ex.IPersistenceMethod');



/**
 * Interface for a method that persists data to a file, url, etc.
 * @interface
 */
os.ex.IPersistenceMethod = function() {};


/**
 * The human-readable label for this persistence method.
 * @return {string}
 */
os.ex.IPersistenceMethod.prototype.getLabel;


/**
 * Whether or not the method is supported
 * @return {boolean}
 */
os.ex.IPersistenceMethod.prototype.isSupported;


/**
 * Whether the persistence method requires a user action in the call stack
 * @return {boolean}
 */
os.ex.IPersistenceMethod.prototype.requiresUserAction;


/**
 * Saves the given content
 * @param {string} fileName The file name (may not be applicable to all persistence methods)
 * @param {*} content The content to save
 * @param {string=} opt_mimeType The mime type of the content
 * @param {string=} opt_title The title of the state (may not be applicable to all persistence methods)
 * @param {string=} opt_description The description of the state (may not be applicable to all persistence methods)
 * @param {string=} opt_tags The tags of the state (may not be applicable to all persistence methods)
 * @return {boolean} Whether or not the save action was successfull
 */
os.ex.IPersistenceMethod.prototype.save;

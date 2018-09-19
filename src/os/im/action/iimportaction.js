goog.provide('os.im.action.IImportAction');

goog.require('os.IPersistable');
goog.require('os.IXmlPersistable');



/**
 * Interface for performing actions on imported data.
 * @extends {os.IPersistable}
 * @extends {os.IXmlPersistable}
 * @interface
 * @template T
 */
os.im.action.IImportAction = function() {};


/**
 * Get the import action identifier.
 * @return {string}
 */
os.im.action.IImportAction.prototype.getId;


/**
 * Get the label or title for the import action.
 * @return {string}
 */
os.im.action.IImportAction.prototype.getLabel;


/**
 * Get the directive name for the import action configuration UI.
 * @return {string|undefined}
 */
os.im.action.IImportAction.prototype.getConfigUI;


/**
 * If the action should be restricted to one use per entry.
 * @return {boolean}
 */
os.im.action.IImportAction.prototype.isUnique;


/**
 * Execute the import action on the given items.
 * @param {!Array<T>} items The items.
 */
os.im.action.IImportAction.prototype.execute;


/**
 * Clone the import action.
 * @return {!os.im.action.IImportAction<T>} The cloned action.
 */
os.im.action.IImportAction.prototype.clone;


/**
 * Reset the import action.
 * @param {string} entry type
 * @param {!Array<T>} items The items.
 */
os.im.action.IImportAction.prototype.reset;

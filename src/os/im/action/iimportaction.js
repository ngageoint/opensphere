goog.module('os.im.action.IImportAction');
goog.module.declareLegacyNamespace();

const IPersistable = goog.requireType('os.IPersistable');
const IXmlPersistable = goog.requireType('os.IXmlPersistable');
const ImportActionCallbackConfig = goog.requireType('os.im.action.ImportActionCallbackConfig');


/**
 * Interface for performing actions on imported data.
 *
 * @extends {IPersistable}
 * @extends {IXmlPersistable}
 * @interface
 * @template T
 */
class IImportAction {
  /**
   * Get the import action identifier.
   * @return {string}
   */
  getId() {}

  /**
   * Get the label or title for the import action.
   * @return {string}
   */
  getLabel() {}

  /**
   * Get the directive name for the import action configuration UI.
   * @return {string|undefined}
   */
  getConfigUI() {}

  /**
   * If the action should be restricted to one use per entry.
   * @return {boolean}
   */
  isUnique() {}

  /**
   * Execute the import action on the given items.
   * @param {!Array<T>} items The items.
   * @return {ImportActionCallbackConfig|undefined}
   */
  execute(items) {}

  /**
   * Clone the import action.
   * @return {!IImportAction<T>} The cloned action.
   */
  clone() {}

  /**
   * Reset the import action.
   * @param {!Array<T>} items The items.
   * @return {ImportActionCallbackConfig|undefined}
   */
  reset(items) {}
}

exports = IImportAction;

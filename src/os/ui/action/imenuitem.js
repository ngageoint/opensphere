goog.module('os.ui.action.IMenuItem');
goog.module.declareLegacyNamespace();

const MenuOptions = goog.requireType('os.ui.action.MenuOptions');

/**
 * Represents an entry in a menu.
 *
 * @interface
 * @deprecated Please use {@link os.ui.menu.Menu} and {@link os.ui.menu.MenuItem} instead
 */
class IMenuItem {
  /**
   * Get the display name for the menu item
   * @return {string}
   */
  getName() {}

  /**
   * Get the description for the menu item, useful for tool tips
   * @return {?string}
   */
  getDescription() {}

  /**
   * Get the menu options which tells the client how to display this menu item
   * @return {!MenuOptions}
   */
  getMenuOptions() {}
}

exports = IMenuItem;

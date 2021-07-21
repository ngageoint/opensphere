goog.module('os.ui.action.MenuItemSeparator');
goog.module.declareLegacyNamespace();

const MenuItem = goog.require('os.ui.action.MenuItem');
const IMenuItem = goog.requireType('os.ui.action.IMenuItem');

/**
 * Represents a menu divider.
 *
 * @implements {IMenuItem}
 * @deprecated Please use {@link os.ui.menu.Menu} and {@link os.ui.menu.MenuItem} instead
 */
class MenuItemSeparator extends MenuItem {
  /**
   * Constructor.
   */
  constructor() {
    // call super constructor
    super('', null);

    /**
     * Defines this class as a separator
     * @type {boolean}
     * @export
     */
    this.isSeparator = true;
  }
}

exports = MenuItemSeparator;

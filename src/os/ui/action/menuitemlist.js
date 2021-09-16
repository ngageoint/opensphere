goog.module('os.ui.action.MenuItemList');

const MenuItem = goog.require('os.ui.action.MenuItem');

const IMenuItem = goog.requireType('os.ui.action.IMenuItem');
const MenuOptions = goog.requireType('os.ui.action.MenuOptions');


/**
 * Represents a menu item which is an entry point to a menu items as a sub-menu.
 *
 * @implements {IMenuItem}
 * @deprecated Please use {@link os.ui.menu.Menu} and {@link os.ui.menu.MenuItem} instead
 */
class MenuItemList extends MenuItem {
  /**
   * Constructor.
   * @param {!string} name
   * @param {?MenuOptions=} opt_menuOptions Optional menu options
   */
  constructor(name, opt_menuOptions) {
    // call super constructor
    super(name, null, opt_menuOptions);

    /**
     * The list of menu items (i.e. the sub-menu) contained by this menu item.
     * @type {!Array<MenuItem>}
     * @private
     */
    this.menuItems_ = [];
  }

  /**
   * Add an item to the list (sub-menu)
   *
   * @param {!MenuItem} menuItem
   */
  addItem(menuItem) {
    this.menuItems_.push(menuItem);
  }

  /**
   * Retrieve the list of menu items (sub-menu)
   *
   * @return {!Array<MenuItem>}
   * @export
   */
  getItems() {
    return this.menuItems_;
  }
}

exports = MenuItemList;

goog.provide('os.ui.action.MenuItemList');
goog.require('os.ui.action.IMenuItem');
goog.require('os.ui.action.MenuItem');



/**
 * Represents a menu item which is an entry point to a menu items as a sub-menu.
 * @implements {os.ui.action.IMenuItem}
 * @extends {os.ui.action.MenuItem}
 * @param {!string} name
 * @param {?os.ui.action.MenuOptions=} opt_menuOptions Optional menu options
 * @deprecated Please use {@link os.ui.menu.Menu} and {@link os.ui.menu.MenuItem} instead
 * @constructor
 */
os.ui.action.MenuItemList = function(name, opt_menuOptions) {
  // call super constructor
  os.ui.action.MenuItemList.base(this, 'constructor', name, null, opt_menuOptions);

  /**
   * The list of menu items (i.e. the sub-menu) contained by this menu item.
   * @type {!Array.<os.ui.action.MenuItem>}
   * @private
   */
  this.menuItems_ = [];
};
goog.inherits(os.ui.action.MenuItemList, os.ui.action.MenuItem);


/**
 * Add an item to the list (sub-menu)
 * @param {!os.ui.action.MenuItem} menuItem
 */
os.ui.action.MenuItemList.prototype.addItem = function(menuItem) {
  this.menuItems_.push(menuItem);
};


/**
 * Retrieve the list of menu items (sub-menu)
 * @return {!Array.<os.ui.action.MenuItem>}
 */
os.ui.action.MenuItemList.prototype.getItems = function() {
  return this.menuItems_;
};
goog.exportProperty(
    os.ui.action.MenuItemList.prototype,
    'getItems',
    os.ui.action.MenuItemList.prototype.getItems);

goog.module('os.ui.menu.UnclickableTypes');

const MenuItemType = goog.require('os.ui.menu.MenuItemType');


/**
 * @type {Array<MenuItemType>}
 */
exports = [
  MenuItemType.GROUP,
  MenuItemType.SUBMENU,
  MenuItemType.SEPARATOR
];

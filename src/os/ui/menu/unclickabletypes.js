goog.declareModuleId('os.ui.menu.UnclickableTypes');

import MenuItemType from './menuitemtype.js';


/**
 * @type {Array<MenuItemType>}
 */
const UnclickableTypes = [
  MenuItemType.GROUP,
  MenuItemType.SUBMENU,
  MenuItemType.SEPARATOR
];

export default UnclickableTypes;

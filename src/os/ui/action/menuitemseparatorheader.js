goog.declareModuleId('os.ui.action.MenuItemSeparatorHeader');

import MenuItem from './menuitem.js';
const {default: IMenuItem} = goog.requireType('os.ui.action.IMenuItem');


/**
 * Represents a menu divider with a name
 *
 * @implements {IMenuItem}
 * @deprecated Please use os.ui.menu.MenuItemType.SEPARATOR instead.
 */
export default class MenuItemSeparatorHeader extends MenuItem {
  /**
   * Constructor.
   * @param {string} name The name of the header
   * @suppress {deprecated}
   */
  constructor(name) {
    super(name, null);

    /**
     * Defines this class as a separator name
     * @type {boolean}
     * @export
     */
    this.isSeparatorHeader = true;
  }
}

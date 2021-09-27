goog.declareModuleId('os.ui.action.MenuItemSeparator');

import MenuItem from './menuitem.js';
const {default: IMenuItem} = goog.requireType('os.ui.action.IMenuItem');


/**
 * Represents a menu divider.
 *
 * @implements {IMenuItem}
 * @deprecated Please use {@link os.ui.menu.Menu} and {@link os.ui.menu.MenuItem} instead
 */
export default class MenuItemSeparator extends MenuItem {
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

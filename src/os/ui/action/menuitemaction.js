/* eslint-disable import/no-deprecated */
goog.declareModuleId('os.ui.action.MenuItemAction');

import MenuItem from './menuitem.js';

const {default: Action} = goog.requireType('os.ui.action.Action');
const {default: IMenuItem} = goog.requireType('os.ui.action.IMenuItem');


/**
 * Represents a menu item which triggers an action when selected.
 *
 * @implements {IMenuItem}
 * @deprecated Please use {@link os.ui.menu.Menu} and {@link os.ui.menu.MenuItem} instead
 */
export default class MenuItemAction extends MenuItem {
  /**
   * Constructor.
   * @param {!Action} action The action to be applied when this menu item is selected
   */
  constructor(action) {
    super(action.getTitle(), action.getDescription(), action.getMenuOptions());

    /**
     * The action to be applied when this menu item is selected
     * @type {!Action}
     * @private
     */
    this.action_ = action;
  }

  /**
   * Retrieve the action
   *
   * @return {!Action}
   * @export
   */
  getAction() {
    return this.action_;
  }
}

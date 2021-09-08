goog.module('os.ui.action.MenuItemAction');

const MenuItem = goog.require('os.ui.action.MenuItem');

const Action = goog.requireType('os.ui.action.Action');
const IMenuItem = goog.requireType('os.ui.action.IMenuItem');


/**
 * Represents a menu item which triggers an action when selected.
 *
 * @implements {IMenuItem}
 * @deprecated Please use {@link os.ui.menu.Menu} and {@link os.ui.menu.MenuItem} instead
 */
class MenuItemAction extends MenuItem {
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

exports = MenuItemAction;

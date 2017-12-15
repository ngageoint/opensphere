goog.provide('os.ui.action.MenuItemAction');
goog.require('os.ui.action.Action');
goog.require('os.ui.action.IMenuItem');
goog.require('os.ui.action.MenuItem');



/**
 * Represents a menu item which triggers an action when selected.
 * @implements {os.ui.action.IMenuItem}
 * @extends {os.ui.action.MenuItem}
 * @param {!os.ui.action.Action} action The action to be applied when this menu item is selected
 * @deprecated Please use {@link os.ui.menu.Menu} and {@link os.ui.menu.MenuItem} instead
 * @constructor
 */
os.ui.action.MenuItemAction = function(action) {
  os.ui.action.MenuItemAction.base(this, 'constructor',
      action.getTitle(), action.getDescription(), action.getMenuOptions());

  /**
   * The action to be applied when this menu item is selected
   * @type {!os.ui.action.Action}
   * @private
   */
  this.action_ = action;
};
goog.inherits(os.ui.action.MenuItemAction, os.ui.action.MenuItem);


/**
 * Retrieve the action
 * @return {!os.ui.action.Action}
 */
os.ui.action.MenuItemAction.prototype.getAction = function() {
  return this.action_;
};
goog.exportProperty(os.ui.action.MenuItemAction.prototype, 'getAction',
    os.ui.action.MenuItemAction.prototype.getAction);

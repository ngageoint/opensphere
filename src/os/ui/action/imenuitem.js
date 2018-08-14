goog.provide('os.ui.action.IMenuItem');



/**
 * Represents an entry in a menu.
 * @interface
 * @deprecated Please use {@link os.ui.menu.Menu} and {@link os.ui.menu.MenuItem} instead
 */
os.ui.action.IMenuItem = function() {};


/**
 * Get the display name for the menu item
 * @type {function(): string}
 */
os.ui.action.IMenuItem.prototype.getName;


/**
 * Get the description for the menu item, useful for tool tips
 * @type {function(): ?string}
 */
os.ui.action.IMenuItem.prototype.getDescription;


/**
 * Get the menu options which tells the client how to display this menu item
 * @type {function(): !os.ui.action.MenuOptions}
 */
os.ui.action.IMenuItem.prototype.getMenuOptions;

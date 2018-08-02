goog.provide('os.ui.action.MenuItemSeparator');
goog.provide('os.ui.action.MenuItemSeparatorHeader');
goog.require('os.ui.action.IMenuItem');
goog.require('os.ui.action.MenuItem');



/**
 * Represents a menu divider.
 * @implements {os.ui.action.IMenuItem}
 * @extends {os.ui.action.MenuItem}
 * @deprecated Please use {@link os.ui.menu.Menu} and {@link os.ui.menu.MenuItem} instead
 * @constructor
 */
os.ui.action.MenuItemSeparator = function() {
  // call super constructor
  os.ui.action.MenuItemSeparator.base(this, 'constructor', '', null);
};
goog.inherits(os.ui.action.MenuItemSeparator, os.ui.action.MenuItem);


/**
 * Defines this class as a separator
 * @type {boolean}
 */
os.ui.action.MenuItemSeparator.prototype.isSeparator = true;
goog.exportProperty(os.ui.action.MenuItemSeparator.prototype, 'isSeparator',
    os.ui.action.MenuItemSeparator.prototype.isSeparator);



/**
 * Represents a menu divider with a name
 * @implements {os.ui.action.IMenuItem}
 * @extends {os.ui.action.MenuItem}
 * @constructor
 * @param {string} name The name of the header
 */
os.ui.action.MenuItemSeparatorHeader = function(name) {
  os.ui.action.MenuItemSeparatorHeader.base(this, 'constructor', name, null);
};
goog.inherits(os.ui.action.MenuItemSeparatorHeader, os.ui.action.MenuItem);


/**
 * Defines this class as a separator name
 * @type {boolean}
 */
os.ui.action.MenuItemSeparatorHeader.prototype.isSeparatorHeader = true;
goog.exportProperty(os.ui.action.MenuItemSeparatorHeader.prototype, 'isSeparatorHeader',
    os.ui.action.MenuItemSeparatorHeader.prototype.isSeparatorHeader);

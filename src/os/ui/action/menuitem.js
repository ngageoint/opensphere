goog.provide('os.ui.action.MenuItem');
goog.require('os.ui.action.IMenuItem');
goog.require('os.ui.action.MenuOptions');



/**
 * Represents a menu item
 * @implements {os.ui.action.IMenuItem}
 * @constructor
 * @param {!string} name
 * @param {?string} description
 * @param {?os.ui.action.MenuOptions=} opt_menuOptions Options for displaying this item in a menu
 * @deprecated Please use {@link os.ui.menu.Menu} and {@link os.ui.menu.MenuItem} instead
 */
os.ui.action.MenuItem = function(name, description, opt_menuOptions) {
  /**
   * @type {!string}
   * @private
   */
  this.name_ = name;

  /**
   * @type {?string}
   * @private
   */
  this.description_ = description;


  /**
   * @type {!os.ui.action.MenuOptions}
   * @private
   */
  this.menuOptions_ = opt_menuOptions || new os.ui.action.MenuOptions(null, null, Number.MAX_VALUE);
};


/**
 * @inheritDoc
 */
os.ui.action.MenuItem.prototype.getName = function() {
  return this.name_;
};
goog.exportProperty(
    os.ui.action.MenuItem.prototype,
    'getName',
    os.ui.action.MenuItem.prototype.getName);


/**
 * @inheritDoc
 */
os.ui.action.MenuItem.prototype.getDescription = function() {
  return this.description_;
};
goog.exportProperty(
    os.ui.action.MenuItem.prototype,
    'getDescription',
    os.ui.action.MenuItem.prototype.getDescription);


/**
 * @inheritDoc
 */
os.ui.action.MenuItem.prototype.getMenuOptions = function() {
  return this.menuOptions_;
};

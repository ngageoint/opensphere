goog.provide('os.ui.action.MenuOptions');



/**
 * Options for defining an item in a menu.
 * @constructor
 * @param {?string=} opt_menu The sub-menu into which this item will be placed
 *  A simple string, or a dot-delimited string to indicate multiple levels of sub-menu depth.
 *  At each depth, a division may be specified in the form of "division/menu".  This indicates the division of
 *  the parent menu into which this item is placed.
 *  Examples:
 *    "History" - creates a sub-menu called history
 *    "Actions.History" - creates 2 nested sub-menus called Actions and History
 *    "Actions/History" - creates a sub-menu called history and places it in the Actions division.  The opt_division
 *      parameter is then used to indicate into which division it falls in the sub-menu.
 *    "Actions/History.Other/Clear" - creates 2 nested sub-menus called History and Clear.  In the first menu,
 *      History is placed in the Actions division.  In the second menu, Clear is placed in the Other division.
 * @param {?string=} opt_division The division of the menu into which this item will be placed.  This specifies the
 *  placement in the current menu.  To place a sub-menu into a division of its parent, see the opt_menu options.
 *  Optionally preceded with a positive integer and colon.  The integer is used to order the division within the menu.
 *  Examples:
 *    'History' - creates a history division
 *    '1:History' - creates a history division and sorts it by '1' instead of 'H'.  The '1:' is removed from the
 *      display.
 * @param {?number=} opt_order The order which this menu item is placed
 * @struct
 * @deprecated Please use {@link os.ui.menu.Menu} and {@link os.ui.menu.MenuItem} instead
 */
os.ui.action.MenuOptions = function(opt_menu, opt_division, opt_order) {
  this.menu = opt_menu;
  this.division = opt_division;
  this.order = goog.isDefAndNotNull(opt_order) ? opt_order : Number.MAX_VALUE;
};

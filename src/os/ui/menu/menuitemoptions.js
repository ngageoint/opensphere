goog.declareModuleId('os.ui.menu.MenuItemOptions');

const {default: MenuEvent} = goog.requireType('os.ui.menu.MenuEvent');
const {default: MenuItem} = goog.requireType('os.ui.menu.MenuItem');
const {default: MenuItemType} = goog.requireType('os.ui.menu.MenuItemType');


/**
 * @typedef {{
 *  type: (MenuItemType|undefined),
 *  eventType: (string|undefined),
 *  label: (string|undefined),
 *  metricKey: (string|undefined),
 *  visible: (boolean|undefined),
 *  enabled: (boolean|undefined),
 *  selected: (boolean|undefined),
 *  closeOnSelect: (boolean|undefined),
 *  icons: (!Array<!string>|undefined),
 *  tooltip: (string|undefined),
 *  shortcut: (string|undefined),
 *  sort: (number|undefined),
 *  children: (Array<!MenuItemOptions>|undefined),
 *  beforeRender: (function(this: MenuItem, *)|undefined),
 *  handler: (function(MenuEvent)|undefined)
 * }}
 */
let MenuItemOptions;

export default MenuItemOptions;

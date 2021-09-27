goog.declareModuleId('os.ui.menu.feature');

import MenuItemType from './menuitemtype.js';

const EventType = goog.require('os.action.EventType');

const {default: Menu} = goog.requireType('os.ui.menu.Menu');
const {default: MenuEvent} = goog.requireType('os.ui.menu.MenuEvent');


/**
 * Group labels for feature menu items.
 * @enum {string}
 */
export const GroupLabel = {
  SELECT: 'Select',
  SHOW_HIDE: 'Show/Hide',
  REMOVE: 'Remove',
  COLOR: 'Color',
  TOOLS: 'Tools'
};

/**
 * Add generic feature menu items.
 *
 * @param {Menu} menu The menu.
 * @param {string=} opt_prefix The menu event prefix.
 * @param {function(MenuEvent)=} opt_handler The menu handler.
 */
export const addFeatureItems = function(menu, opt_prefix, opt_handler) {
  addSelectItems(menu, opt_prefix, opt_handler);
  addShowHideItems(menu, opt_prefix, opt_handler);
  addRemoveItems(menu, opt_prefix, opt_handler);
};

/**
 * Add menu items to change feature selection.
 *
 * @param {Menu} menu The menu.
 * @param {string=} opt_prefix The menu event prefix.
 * @param {function(MenuEvent)=} opt_handler The menu handler.
 */
export const addSelectItems = function(menu, opt_prefix, opt_handler) {
  var prefix = opt_prefix || '';
  var menuRoot = menu.getRoot();

  var group = menuRoot.findOrCreate({
    label: GroupLabel.SELECT,
    type: MenuItemType.GROUP,
    sort: 0
  });

  group.addChild({
    label: 'Select All',
    eventType: prefix + EventType.SELECT,
    tooltip: 'Selects all items',
    icons: ['<i class="fa fa-fw fa-check-circle"></i>'],
    handler: opt_handler,
    sort: 1
  });
  group.addChild({
    label: 'Deselect All',
    eventType: prefix + EventType.DESELECT,
    tooltip: 'Deselects all items',
    icons: ['<i class="fa fa-fw fa-times-circle"></i>'],
    handler: opt_handler,
    sort: 2
  });
  group.addChild({
    label: 'Invert',
    eventType: prefix + EventType.INVERT,
    tooltip: 'Inverts the selection',
    icons: ['<i class="fa fa-fw fa-adjust"></i>'],
    handler: opt_handler,
    sort: 3
  });
};

/**
 * Add menu items to show/hide features.
 *
 * @param {Menu} menu The menu.
 * @param {string=} opt_prefix The menu event prefix.
 * @param {function(MenuEvent)=} opt_handler The menu handler.
 */
export const addShowHideItems = function(menu, opt_prefix, opt_handler) {
  var prefix = opt_prefix || '';
  var menuRoot = menu.getRoot();

  var group = menuRoot.findOrCreate({
    label: GroupLabel.SHOW_HIDE,
    type: MenuItemType.GROUP,
    sort: 1
  });

  group.addChild({
    label: 'Hide Selected',
    eventType: prefix + EventType.HIDE_SELECTED,
    tooltip: 'Hides selected items',
    icons: ['<i class="fa fa-fw fa-eye-slash"></i>'],
    handler: opt_handler,
    sort: 0
  });
  group.addChild({
    label: 'Hide Unselected',
    eventType: prefix + EventType.HIDE_UNSELECTED,
    tooltip: 'Hides unselected items',
    icons: ['<i class="fa fa-fw fa-eye-slash"></i>'],
    handler: opt_handler,
    sort: 1
  });
  group.addChild({
    label: 'Display All',
    eventType: prefix + EventType.DISPLAY_ALL,
    tooltip: 'Displays all items',
    icons: ['<i class="fa fa-fw fa-eye"></i>'],
    handler: opt_handler,
    sort: 2
  });
};

/**
 * Add menu items to remove features.
 *
 * @param {Menu} menu The menu.
 * @param {string=} opt_prefix The menu event prefix.
 * @param {function(MenuEvent)=} opt_handler The menu handler.
 */
export const addRemoveItems = function(menu, opt_prefix, opt_handler) {
  var prefix = opt_prefix || '';
  var menuRoot = menu.getRoot();

  var group = menuRoot.findOrCreate({
    label: GroupLabel.REMOVE,
    type: MenuItemType.GROUP,
    sort: 2
  });

  group.addChild({
    label: 'Remove Selected',
    eventType: prefix + EventType.REMOVE,
    tooltip: 'Removes selected items',
    icons: ['<i class="fa fa-fw fa-times"></i>'],
    handler: opt_handler,
    sort: 1
  });
  group.addChild({
    label: 'Remove Unselected',
    eventType: prefix + EventType.REMOVE_UNSELECTED,
    tooltip: 'Removes the unselected items',
    icons: ['<i class="fa fa-fw fa-times"></i>'],
    handler: opt_handler,
    sort: 2
  });
};

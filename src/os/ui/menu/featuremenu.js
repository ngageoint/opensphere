goog.provide('os.ui.menu.feature');

goog.require('os.action.EventType');
goog.require('os.ui.menu.MenuItemType');


/**
 * Group labels for feature menu items.
 * @enum {string}
 */
os.ui.menu.feature.GroupLabel = {
  SELECT: 'Select',
  SHOW_HIDE: 'Show/Hide',
  REMOVE: 'Remove',
  TOOLS: 'Tools'
};


/**
 * Add generic feature menu items.
 * @param {os.ui.menu.Menu} menu The menu.
 * @param {string=} opt_prefix The menu event prefix.
 * @param {function(os.ui.menu.MenuEvent)=} opt_handler The menu handler.
 */
os.ui.menu.feature.addFeatureItems = function(menu, opt_prefix, opt_handler) {
  os.ui.menu.feature.addSelectItems(menu, opt_prefix, opt_handler);
  os.ui.menu.feature.addShowHideItems(menu, opt_prefix, opt_handler);
  os.ui.menu.feature.addRemoveItems(menu, opt_prefix, opt_handler);
};


/**
 * Add menu items to change feature selection.
 * @param {os.ui.menu.Menu} menu The menu.
 * @param {string=} opt_prefix The menu event prefix.
 * @param {function(os.ui.menu.MenuEvent)=} opt_handler The menu handler.
 */
os.ui.menu.feature.addSelectItems = function(menu, opt_prefix, opt_handler) {
  var prefix = opt_prefix || '';
  var menuRoot = menu.getRoot();

  var group = menuRoot.findOrCreate({
    label: os.ui.menu.feature.GroupLabel.SELECT,
    type: os.ui.menu.MenuItemType.GROUP,
    sort: 0
  });

  group.addChild({
    label: 'Select All',
    eventType: prefix + os.action.EventType.SELECT,
    tooltip: 'Selects all items',
    icons: ['<i class="fa fa-fw fa-check-circle"></i>'],
    handler: opt_handler,
    sort: 1
  });
  group.addChild({
    label: 'Deselect All',
    eventType: prefix + os.action.EventType.DESELECT,
    tooltip: 'Deselects all items',
    icons: ['<i class="fa fa-fw fa-times-circle"></i>'],
    handler: opt_handler,
    sort: 2
  });
  group.addChild({
    label: 'Invert',
    eventType: prefix + os.action.EventType.INVERT,
    tooltip: 'Inverts the selection',
    icons: ['<i class="fa fa-fw fa-adjust"></i>'],
    handler: opt_handler,
    sort: 3
  });
};


/**
 * Add menu items to show/hide features.
 * @param {os.ui.menu.Menu} menu The menu.
 * @param {string=} opt_prefix The menu event prefix.
 * @param {function(os.ui.menu.MenuEvent)=} opt_handler The menu handler.
 */
os.ui.menu.feature.addShowHideItems = function(menu, opt_prefix, opt_handler) {
  var prefix = opt_prefix || '';
  var menuRoot = menu.getRoot();

  var group = menuRoot.findOrCreate({
    label: os.ui.menu.feature.GroupLabel.SHOW_HIDE,
    type: os.ui.menu.MenuItemType.GROUP,
    sort: 1
  });

  group.addChild({
    label: 'Hide Selected',
    eventType: prefix + os.action.EventType.HIDE_SELECTED,
    tooltip: 'Hides selected items',
    icons: ['<i class="fa fa-fw fa-eye-slash"></i>'],
    handler: opt_handler,
    sort: 0
  });
  group.addChild({
    label: 'Hide Unselected',
    eventType: prefix + os.action.EventType.HIDE_UNSELECTED,
    tooltip: 'Hides unselected items',
    icons: ['<i class="fa fa-fw fa-eye-slash"></i>'],
    handler: opt_handler,
    sort: 1
  });
  group.addChild({
    label: 'Display All',
    eventType: prefix + os.action.EventType.DISPLAY_ALL,
    tooltip: 'Displays all items',
    icons: ['<i class="fa fa-fw fa-eye"></i>'],
    handler: opt_handler,
    sort: 2
  });
};


/**
 * Add menu items to remove features.
 * @param {os.ui.menu.Menu} menu The menu.
 * @param {string=} opt_prefix The menu event prefix.
 * @param {function(os.ui.menu.MenuEvent)=} opt_handler The menu handler.
 */
os.ui.menu.feature.addRemoveItems = function(menu, opt_prefix, opt_handler) {
  var prefix = opt_prefix || '';
  var menuRoot = menu.getRoot();

  var group = menuRoot.findOrCreate({
    label: os.ui.menu.feature.GroupLabel.REMOVE,
    type: os.ui.menu.MenuItemType.GROUP,
    sort: 1
  });

  group.addChild({
    label: 'Remove Selected',
    eventType: prefix + os.action.EventType.REMOVE,
    tooltip: 'Removes selected items',
    icons: ['<i class="fa fa-fw fa-times"></i>'],
    handler: opt_handler,
    sort: 1
  });
  group.addChild({
    label: 'Remove Unselected',
    eventType: prefix + os.action.EventType.REMOVE_UNSELECTED,
    tooltip: 'Removes the unselected items',
    icons: ['<i class="fa fa-fw fa-times"></i>'],
    handler: opt_handler,
    sort: 2
  });
};

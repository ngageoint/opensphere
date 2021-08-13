goog.module('os.ui.menu.import');
goog.module.declareLegacyNamespace();

const googDispose = goog.require('goog.dispose');
const {isOSX} = goog.require('os');
const BaseDescriptor = goog.require('os.data.BaseDescriptor');
const DataManager = goog.require('os.data.DataManager');
const LayerType = goog.require('os.layer.LayerType');
const {AddData: AddDataKeys} = goog.require('os.metrics.keys');
const ImportEventType = goog.require('os.ui.im.ImportEventType');
const Menu = goog.require('os.ui.menu.Menu');
const MenuItem = goog.require('os.ui.menu.MenuItem');
const MenuItemType = goog.require('os.ui.menu.MenuItemType');
const {openWindow} = goog.require('os.ui.menu.windows');

const IDataDescriptor = goog.requireType('os.data.IDataDescriptor');


/**
 * The import menu.
 * @type {Menu|undefined}
 */
let MENU = undefined;

/**
 * Get the menu.
 * @return {Menu|undefined}
 */
const getMenu = () => MENU;

/**
 * Set the menu.
 * @param {Menu|undefined} menu The menu.
 */
const setMenu = (menu) => {
  MENU = menu;
};

/**
 * Default groups in the import menu
 */
const GroupType = {
  MAJOR: 'Major',
  MINOR: 'Minor',
  RECENT: 'Recent'
};

/**
 * Default groups in the import menu
 */
const GroupSort = {
  MAJOR: 0,
  MINOR: 100,
  RECENT: 200
};

/**
 * Event type prefix for recent menu items.
 * @type {string}
 */
const RECENT_PREFIX = 'recent.';

/**
 * Set up the import menu.
 */
const setup = function() {
  if (!MENU) {
    MENU = new Menu(new MenuItem({
      type: MenuItemType.ROOT,
      children: [{
        label: '',
        eventType: GroupType.MAJOR,
        type: MenuItemType.GROUP,
        sort: 0,
        children: [{
          label: 'Add Data',
          eventType: 'openwindow.addData',
          tooltip: 'Browse the data catalog',
          icons: ['<i class="fa fa-fw fa-plus"></i>'],
          handler: openWindow,
          metricKey: AddDataKeys.OPEN,
          sort: 0
        }, {
          label: 'Open File or URL',
          eventType: ImportEventType.FILE,
          tooltip: 'Import data from a local file or a URL',
          icons: ['<i class="fa fa-fw fa-folder-open"></i>'],
          shortcut: (isOSX() ? 'cmd' : 'ctrl') + '+o',
          metricKey: AddDataKeys.IMPORT,
          sort: 1
        }]
      }, {
        label: '',
        eventType: GroupType.MINOR,
        type: MenuItemType.GROUP,
        sort: 1
      },
      {
        label: GroupType.RECENT,
        eventType: GroupType.RECENT,
        type: MenuItemType.GROUP,
        beforeRender: refreshRecent,
        sort: 2
      }]
    }));
  }
};

/**
 * Dispose the import menu.
 */
const dispose = function() {
  googDispose(MENU);
  MENU = undefined;
};

/**
 * Take in a descriptor and the enabled state and determine which icon to display
 *
 * @param {IDataDescriptor} descriptor
 * @param {boolean} enabled
 * @return {string}
 */
const getDescriptorToggleIcon = function(descriptor, enabled) {
  return enabled ? 'fa-check-square-o' : 'fa-square-o';
};

/**
 * Update the "Recent" menu group.
 *
 */
const refreshRecent = function() {
  var menu = MENU;
  if (menu) {
    var recentGroup = menu.getRoot().find(GroupType.RECENT);

    // clear all recents from the group
    if (recentGroup.children) {
      recentGroup.children.length = 0;
    }
  }

  // filter descriptors by last active and then sort them
  var descriptors = DataManager.getInstance().getDescriptors().filter(
      /**
       * @param {IDataDescriptor} d The descriptor
       * @return {boolean} If the descriptor has a last active time
       */
      function(d) {
        return !isNaN(d.getLastActive());
      });
  descriptors.sort(BaseDescriptor.lastActiveReverse);

  // add up to 10 recent items
  var n = Math.min(descriptors.length, 10);
  var seenTitles = {};

  for (var i = 0; i < n; i++) {
    var descriptor = descriptors[i];
    var enabled = descriptor.isActive();
    var title = descriptor.getTitle() || '';
    var type = descriptor.getType();
    var icon = getDescriptorToggleIcon(descriptor, enabled);

    if (type) {
      if (type === LayerType.GROUPS) {
        type = 'Group';
      }

      type = type.replace(/ Layers/i, '');
      title += ' (' + type + ')';
    }

    if (title in seenTitles) {
      title += ' (' + descriptor.getProvider() + ')';
    }

    seenTitles[title] = true;

    recentGroup.addChild({
      eventType: RECENT_PREFIX + descriptor.getId(),
      label: title,
      tooltip: (enabled ? 'Remove' : 'Add') + ' this item',
      icons: ['<i class="fa fa-fw ' + icon + '"></i>'],
      sort: i,
      handler: descriptor.setActive.bind(descriptor, !enabled)
    });
  }
};

exports = {
  getMenu,
  setMenu,
  GroupType,
  GroupSort,
  RECENT_PREFIX,
  setup,
  dispose
};

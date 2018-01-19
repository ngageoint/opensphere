goog.provide('os.ui.menu.import');

goog.require('os.metrics.keys');
goog.require('os.ui.im.ImportEventType');
goog.require('os.ui.menu.Menu');
goog.require('os.ui.menu.MenuItem');
goog.require('os.ui.menu.MenuItemType');
goog.require('os.ui.menu.windows');


/**
 * The import menu.
 * @type {os.ui.menu.Menu|undefined}
 */
os.ui.menu.import.MENU = undefined;


/**
 * Default groups in the import menu
 */
os.ui.menu.import.GroupType = {
  MAJOR: 'Major',
  MINOR: 'Minor',
  RECENT: 'Recent'
};


/**
 * Default groups in the import menu
 */
os.ui.menu.import.GroupSort = {
  MAJOR: 0,
  MINOR: 100,
  RECENT: 200
};


/**
 * Event type prefix for recent menu items.
 * @type {string}
 * @const
 */
os.ui.menu.import.RECENT_PREFIX = 'recent.';


/**
 * Set up the import menu.
 */
os.ui.menu.import.setup = function() {
  if (!os.ui.menu.import.MENU) {
    os.ui.menu.import.MENU = new os.ui.menu.Menu(new os.ui.menu.MenuItem({
      type: os.ui.menu.MenuItemType.ROOT,
      children: [{
        label: '',
        eventType: os.ui.menu.import.GroupType.MAJOR,
        type: os.ui.menu.MenuItemType.GROUP,
        sort: 0,
        children: [{
          label: 'Add Data',
          eventType: 'openwindow.addData',
          tooltip: 'Browse the data catalog',
          icons: ['<i class="fa fa-fw fa-plus green-icon"></i>'],
          handler: os.ui.menu.windows.openWindow,
          metricKey: os.metrics.keys.AddData.OPEN,
          sort: 0
        }, {
          label: 'Open File or URL',
          eventType: os.ui.im.ImportEventType.FILE,
          tooltip: 'Import data from a local file or a URL',
          icons: ['<i class="fa fa-fw fa-folder-open"></i>'],
          shortcut: (os.isOSX() ? 'cmd' : 'ctrl') + '+o',
          metricKey: os.metrics.keys.AddData.IMPORT,
          sort: 1
        }]
      }, {
        label: '',
        eventType: os.ui.menu.import.GroupType.MINOR,
        type: os.ui.menu.MenuItemType.GROUP,
        sort: 1
      },
      {
        label: os.ui.menu.import.GroupType.RECENT,
        eventType: os.ui.menu.import.GroupType.RECENT,
        type: os.ui.menu.MenuItemType.GROUP,
        beforeRender: os.ui.menu.import.refreshRecent_,
        sort: 2
      }]
    }));
  }
};


/**
 * Dispose the import menu.
 */
os.ui.menu.import.dispose = function() {
  goog.dispose(os.ui.menu.import.MENU);
  os.ui.menu.import.MENU = undefined;
};


/**
 * Update the "Recent" menu group.
 * @private
 */
os.ui.menu.import.refreshRecent_ = function() {
  var menu = os.ui.menu.import.MENU;
  if (menu) {
    var recentGroup = menu.getRoot().find(os.ui.menu.import.GroupType.RECENT);

    // clear all recents from the group
    if (recentGroup.children) {
      recentGroup.children.length = 0;
    }
  }

  // filter descriptors by last active and then sort them
  var descriptors = os.dataManager.getDescriptors().filter(
      /**
       * @param {os.data.IDataDescriptor} d The descriptor
       * @return {boolean} If the descriptor has a last active time
       */
      function(d) {
        return !isNaN(d.getLastActive());
      });
  descriptors.sort(os.data.BaseDescriptor.lastActiveReverse);

  // add up to 10 recent items
  var n = Math.min(descriptors.length, 10);
  var seenTitles = {};

  for (var i = 0; i < n; i++) {
    var descriptor = descriptors[i];
    var enabled = descriptor.isActive();
    var title = descriptor.getTitle() || '';
    var type = descriptor.getType();
    var icon = enabled ? 'fa-check-square-o' : 'fa-square-o';

    if (type) {
      if (type === os.layer.LayerType.GROUPS) {
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
      eventType: os.ui.menu.import.RECENT_PREFIX + descriptor.getId(),
      label: title,
      tooltip: (enabled ? 'Remove' : 'Add') + ' this item',
      icons: ['<i class="fa fa-fw ' + icon + '"></i>'],
      sort: i,
      handler: descriptor.setActive.bind(descriptor, !enabled)
    });
  }
};

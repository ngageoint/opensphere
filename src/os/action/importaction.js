goog.provide('os.action.import');

goog.require('os.action.EventType');
goog.require('os.metrics.keys');
goog.require('os.ui.action.Action');
goog.require('os.ui.action.ActionManager');
goog.require('os.ui.action.MenuOptions');
goog.require('os.ui.action.windows');


/**
 * @type {os.ui.action.ActionManager}
 */
os.action.import.manager = null;


/**
 * Default groups in the import menu
 */
os.action.import.GroupType = {
  MAJOR: '0:',
  MINOR: '1:',
  RECENT: '2:Recent'
};


/**
 * Sets up import actions
 */
os.action.import.setup = function() {
  if (!os.action.import.manager) {
    os.action.import.manager = new os.ui.action.ActionManager();
  }

  var manager = os.action.import.manager;

  if (!manager.getAction(os.ui.im.ImportEventType.FILE)) {
    var ctrlOr = os.isOSX() ? 'cmd' : 'ctrl';
    var addData = new os.ui.action.Action('openwindow.addData', 'Add Data',
        'Browse the data catalog', 'fa-plus green-icon', null,
        new os.ui.action.MenuOptions(null, os.action.import.GroupType.MAJOR),
        os.metrics.keys.AddData.OPEN);
    manager.listen(addData.getEventType(), os.ui.action.windows.openWindow);
    manager.addAction(addData);

    var importFile = new os.ui.action.Action(os.ui.im.ImportEventType.FILE, 'Open File or URL',
        'Import data from a local file or a URL', 'fa-folder-open', ctrlOr + '+o',
        new os.ui.action.MenuOptions(null, os.action.import.GroupType.MAJOR),
        os.metrics.keys.AddData.IMPORT);
    manager.addAction(importFile);

    os.action.import.manager.registerTempActionFunc(os.action.import.getRecentActions_);
  }
};


/**
 * Disposes import actions
 */
os.action.import.dispose = function() {
  if (os.action.import.manager) {
    os.action.import.manager.dispose();
    os.action.import.manager = null;
  }
};


/**
 * @type {string}
 * @const
 */
os.action.import.RECENT_PREFIX = 'recent.';


/**
 * Get menu items for recently opened actions
 * @private
 */
os.action.import.getRecentActions_ = function() {
  var manager = os.action.import.manager;

  // Clear out all the actions and recreate them.
  var actions = manager.getEnabledActions();
  var i = actions.length;
  while (i--) {
    if (actions[i].getEventType().indexOf(os.action.import.RECENT_PREFIX) === 0) {
      manager.removeAction(actions[i]);
    }
  }

  var resultActions = [];
  var descriptors = os.dataManager.getDescriptors();

  // filter descriptors by last active and then sort them
  descriptors = descriptors.filter(
      /**
       * @param {os.data.IDataDescriptor} d The descriptor
       * @return {boolean} If the descriptor has a last active time
       */
      function(d) {
        return !isNaN(d.getLastActive());
      });

  descriptors.sort(os.data.BaseDescriptor.lastActiveReverse);

  // make actions out of the first ten
  var n = Math.min(descriptors.length, 10);
  var seenTitles = {};

  for (i = 0; i < n; i++) {
    var descriptor = descriptors[i];
    var enabled = descriptor.isActive();
    var title = descriptor.getTitle();
    var type = descriptor.getType();

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

    var action = new os.ui.action.Action(os.action.import.RECENT_PREFIX + descriptor.getId(),
        title,
        (enabled ? 'Remove' : 'Add') + ' this item',
        (enabled ? 'fa-check-square-o' : 'fa-square-o'), null,
        new os.ui.action.MenuOptions(null, os.action.import.GroupType.RECENT));

    action.handleWith(descriptor.setActive.bind(descriptor, !enabled));
    resultActions.push(action);
  }

  manager.addActions(resultActions);
};

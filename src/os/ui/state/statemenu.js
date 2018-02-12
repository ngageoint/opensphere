goog.provide('os.ui.state.menu');
goog.provide('os.ui.state.menu.EventType');
goog.provide('os.ui.state.menu.manager');

goog.require('goog.async.Throttle');
goog.require('os.metrics.Metrics');
goog.require('os.metrics.keys');
goog.require('os.ui.events.UIEvent');
goog.require('os.ui.events.UIEventType');
goog.require('os.ui.im.ImportEventType');
goog.require('os.ui.menu.Menu');
goog.require('os.ui.menu.MenuItem');
goog.require('os.ui.menu.MenuItemType');
goog.require('os.ui.state.IStateDescriptor');
goog.require('os.ui.state.cmd.StateClear');


/**
 * The state menu.
 * @type {os.ui.menu.Menu|undefined}
 */
os.ui.state.MENU = undefined;


/**
 * Throttle how often the state menu is updated.
 * @type {goog.async.Throttle|undefined}
 */
os.ui.state.menu.refreshThrottle = undefined;


/**
 * The maximum number of items to display in each state menu group.
 * @type {number}
 * @const
 */
os.ui.state.menu.DISPLAY_LIMIT = 7;


/**
 * Prefix for all state menu event types.
 * @type {string}
 * @const
 */
os.ui.state.menu.PREFIX = 'state:';


/**
 * State menu event types.
 * @enum {string}
 */
os.ui.state.menu.EventType = {
  SAVE_STATE: os.ui.state.menu.PREFIX + 'save',
  CLEAR_STATES: os.ui.state.menu.PREFIX + 'clear'
};


/**
 * Set up state menu.
 */
os.ui.state.menu.setup = function() {
  if (!os.ui.state.MENU) {
    os.ui.state.MENU = new os.ui.menu.Menu(new os.ui.menu.MenuItem({
      type: os.ui.menu.MenuItemType.ROOT,
      children: [{
        label: 'Import State',
        eventType: os.ui.im.ImportEventType.FILE,
        tooltip: 'Import a state from a local file or a URL',
        icons: ['<i class="fa fa-fw fa-cloud-download"></i>'],
        metricKey: os.metrics.keys.Map.IMPORT_STATE,
        sort: 100
      },
      {
        label: 'Save State',
        eventType: os.ui.state.menu.EventType.SAVE_STATE,
        tooltip: 'Save the application state',
        icons: ['<i class="fa fa-fw fa-floppy-o"></i>'],
        handler: os.ui.state.menu.onStateMenuEvent_,
        metricKey: os.metrics.keys.Map.SAVE_STATE,
        sort: 101
      },
      {
        label: 'Disable States',
        eventType: os.ui.state.menu.EventType.CLEAR_STATES,
        tooltip: 'Disable all active application states',
        icons: ['<i class="fa fa-fw fa-times"></i>'],
        handler: os.ui.state.menu.onStateMenuEvent_,
        metricKey: os.metrics.keys.Map.CLEAR_STATE,
        sort: 102
      }]
    }));

    os.dataManager.listen(os.data.DescriptorEventType.ADD_DESCRIPTOR, os.ui.state.menu.onDescriptorChange_);
    os.dataManager.listen(os.data.DescriptorEventType.REMOVE_DESCRIPTOR, os.ui.state.menu.onDescriptorChange_);
    os.dataManager.listen(os.data.DescriptorEventType.UPDATE_DESCRIPTOR, os.ui.state.menu.onDescriptorChange_);

    os.dispatcher.listen(os.data.DescriptorEventType.ACTIVATED, os.ui.state.menu.onDescriptorChange_);
    os.dispatcher.listen(os.data.DescriptorEventType.DEACTIVATED, os.ui.state.menu.onDescriptorChange_);

    os.ui.state.menu.refreshThrottle = new goog.async.Throttle(os.ui.state.menu.refreshMenu, 50);
  }
};


/**
 * Dispose the state menu.
 */
os.ui.state.menu.dispose = function() {
  goog.dispose(os.ui.state.MENU);
  os.ui.state.MENU = undefined;

  goog.dispose(os.ui.state.menu.refreshThrottle);
  os.ui.state.menu.refreshThrottle = undefined;
};


/**
 * Refresh menu items when a state descriptor changes.
 * @param {os.data.DescriptorEvent} event Looking for IStateDescriptor events
 * @private
 */
os.ui.state.menu.onDescriptorChange_ = function(event) {
  if (os.ui.state.menu.refreshThrottle && event && os.implements(event.descriptor, os.ui.state.IStateDescriptor.ID)) {
    os.ui.state.menu.refreshThrottle.fire();
  }
};


/**
 * Handle state menu event.
 * @param {os.ui.menu.MenuEvent<undefined>} event The menu event.
 * @private
 */
os.ui.state.menu.onStateMenuEvent_ = function(event) {
  switch (event.type) {
    case os.ui.state.menu.EventType.SAVE_STATE:
      os.ui.stateManager.startExport();
      break;
    case os.ui.state.menu.EventType.CLEAR_STATES:
      var cmd = new os.ui.state.cmd.StateClear();
      os.command.CommandProcessor.getInstance().addCommand(cmd);
      break;
    default:
      break;
  }
};


/**
 * Update the states displayed in the menu.
 */
os.ui.state.menu.refreshMenu = function() {
  if (!os.ui.state.MENU) {
    return;
  }

  // Remove all groups from the menu
  var menuRoot = os.ui.state.MENU.getRoot();
  if (menuRoot.children) {
    goog.array.removeAllIf(menuRoot.children, function(item) {
      return item.type === os.ui.menu.MenuItemType.GROUP;
    });
  }

  // dataManager.getDescriptors will get everything
  var descriptors = os.dataManager.getDescriptors();

  // Organize the descriptors by group.
  var menuGroups = {};
  for (var i = 0; i < descriptors.length; i++) {
    var descriptor = descriptors[i];
    if (os.implements(descriptor, os.ui.state.IStateDescriptor.ID)) {
      var stateDescriptor = /** @type {os.ui.state.IStateDescriptor} */ (descriptor);
      if (!menuGroups[stateDescriptor.getMenuGroup()]) {
        menuGroups[stateDescriptor.getMenuGroup()] = [];
      }
      menuGroups[stateDescriptor.getMenuGroup()].push(stateDescriptor);
    }
  }

  // Filter for display
  for (var menuGroupKey in menuGroups) {
    var splitKey = menuGroupKey.split(':');
    var group = menuRoot.addChild({
      label: String(splitKey[1]),
      type: os.ui.menu.MenuItemType.GROUP,
      sort: Number(splitKey[0]) || 0
    });

    // Sort the group items by time so we act on the latest
    var groupDescriptors = menuGroups[menuGroupKey];
    groupDescriptors.sort(os.data.BaseDescriptor.lastActiveReverse);

    // Store the latest active
    var tmpDescriptors = [];
    for (var i = 0; i < groupDescriptors.length; i++) {
      if (tmpDescriptors.length >= os.ui.state.menu.DISPLAY_LIMIT) {
        // If the display limit is reached, add a "View More" item and stop iterating
        var viewMoreOptions = os.ui.state.menu.getViewMoreOptions_(tmpDescriptors[0]);
        if (viewMoreOptions) {
          group.addChild(viewMoreOptions);
        }
        break;
      }

      var descriptor = groupDescriptors[i];
      if (descriptor.getLastActive()) {
        tmpDescriptors.push(descriptor);
      }
    }

    // Sort the latest by title for the better user experience
    tmpDescriptors.sort(os.data.BaseDescriptor.titleCompare);

    // Create the menu items for the descriptors
    for (var i = 0; i < tmpDescriptors.length; i++) {
      var options = os.ui.state.menu.getStateOptions_(tmpDescriptors[i], i);
      if (options) {
        group.addChild(options);
      }
    }
  }
};


/**
 * Create menu item options to toggle a state descriptor.
 * @param {os.ui.state.IStateDescriptor} descriptor A state descriptor.
 * @param {number} index The menu item index.
 * @return {os.ui.menu.MenuItemOptions|undefined} Options to create the menu item.
 * @private
 */
os.ui.state.menu.getStateOptions_ = function(descriptor, index) {
  var label = descriptor.getTitle();
  if (label) {
    var enabled = descriptor.isActive();
    var icon = (enabled ? 'fa-check-square-o' : 'fa-square-o');
    var tooltip = (enabled ? 'Unload' : 'Load') + ' this application state';

    return {
      label: label,
      eventType: os.ui.state.menu.PREFIX + descriptor.getId(),
      tooltip: tooltip,
      icons: ['<i class="fa fa-fw ' + icon + '"></i>'],
      handler: os.ui.state.menu.toggleState_.bind(undefined, descriptor),
      sort: index
    };
  }

  return undefined;
};


/**
 * Handle state menu click.
 * @param {!os.ui.state.IStateDescriptor} descriptor The clicked descriptor
 * @param {os.ui.menu.MenuEvent} event The menu event.
 * @private
 */
os.ui.state.menu.toggleState_ = function(descriptor, event) {
  descriptor.setActive(!descriptor.isActive());
};


/**
 * Create menu item options for a "View More" item.
 * @param {!os.data.BaseDescriptor} descriptor A descriptor to provide input on the how the menu item should be built.
 * @return {os.ui.menu.MenuItemOptions|undefined} Options to create the menu item.
 * @private
 */
os.ui.state.menu.getViewMoreOptions_ = function(descriptor) {
  var typeName = descriptor.getType();
  var descriptorType = descriptor.getDescriptorType();
  if (typeName && descriptorType) {
    return {
      label: 'More ' + typeName,
      eventType: 'VIEW_MORE_' + descriptorType,
      tooltip: 'Launch the Add Data window to add more',
      icons: ['<i class="fa fa-fw fa-plus green-icon"></i>'],
      handler: os.ui.state.menu.viewMoreEventEmitter.bind(undefined, typeName, descriptorType),
      sort: Infinity
    };
  }

  return undefined;
};


/**
 * Sends the event to launch the 'Add Data' window.
 * @param {string} typeName The descriptor type name.
 * @param {string} descriptorType The descriptor type.
 */
os.ui.state.menu.viewMoreEventEmitter = function(typeName, descriptorType) {
  var filterFn = os.ui.state.menu.stateFilter.bind(undefined, typeName, descriptorType);

  var params = {};
  params[os.ui.events.UIEventParams.FILTER_FUNC] = filterFn;
  params[os.ui.events.UIEventParams.FILTER_NAME] = typeName;

  var event = new os.ui.events.UIEvent(os.ui.events.UIEventType.TOGGLE_UI, 'addData', undefined, params);
  os.dispatcher.dispatchEvent(event);
};


/**
 * Filter state descriptors.
 * @param {string} typeName The descriptor type name.
 * @param {string} descriptorType The descriptor type.
 * @param {os.structs.ITreeNode} node The tree node.
 * @return {boolean} If the node should be displayed.
 */
os.ui.state.menu.stateFilter = function(typeName, descriptorType, node) {
  if (node instanceof os.ui.data.DescriptorNode) {
    var descriptor = node.getDescriptor();
    if (os.implements(descriptor, os.ui.state.IStateDescriptor.ID)) {
      return descriptor.getType() === typeName && descriptor.getDescriptorType() === descriptorType;
    }
  }

  return false;
};

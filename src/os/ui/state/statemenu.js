goog.module('os.ui.state.menu');

const {removeAllIf} = goog.require('goog.array');
const Throttle = goog.require('goog.async.Throttle');
const googDispose = goog.require('goog.dispose');
const dispatcher = goog.require('os.Dispatcher');
const CommandProcessor = goog.require('os.command.CommandProcessor');
const BaseDescriptor = goog.require('os.data.BaseDescriptor');
const DataManager = goog.require('os.data.DataManager');
const DescriptorEventType = goog.require('os.data.DescriptorEventType');
const osImplements = goog.require('os.implements');
const {Map: MapMetrics} = goog.require('os.metrics.keys');
const {getStateManager} = goog.require('os.state.instance');
const DescriptorNode = goog.require('os.ui.data.DescriptorNode');
const UIEvent = goog.require('os.ui.events.UIEvent');
const UIEventParams = goog.require('os.ui.events.UIEventParams');
const UIEventType = goog.require('os.ui.events.UIEventType');
const ImportEventType = goog.require('os.ui.im.ImportEventType');
const Menu = goog.require('os.ui.menu.Menu');
const MenuItem = goog.require('os.ui.menu.MenuItem');
const MenuItemType = goog.require('os.ui.menu.MenuItemType');
const IStateDescriptor = goog.require('os.ui.state.IStateDescriptor');
const StateClear = goog.require('os.ui.state.cmd.StateClear');

const DescriptorEvent = goog.requireType('os.data.DescriptorEvent');
const MenuEvent = goog.requireType('os.ui.menu.MenuEvent');
const MenuItemOptions = goog.requireType('os.ui.menu.MenuItemOptions');


/**
 * The state menu.
 * @type {Menu|undefined}
 */
let menu = undefined;

/**
 * Get the menu instance.
 * @return {Menu|undefined} The menu.
 */
const getMenu = () => menu;

/**
 * Throttle how often the state menu is updated.
 * @type {Throttle|undefined}
 */
let refreshThrottle = undefined;

/**
 * The maximum number of items to display in each state menu group.
 * @type {number}
 */
const DISPLAY_LIMIT = 7;

/**
 * Prefix for all state menu event types.
 * @type {string}
 */
const PREFIX = 'state:';

/**
 * State menu event types.
 * @enum {string}
 */
const EventType = {
  SAVE_STATE: PREFIX + 'save',
  CLEAR_STATES: PREFIX + 'clear'
};

/**
 * Set up state menu.
 */
const setup = function() {
  if (!menu) {
    menu = new Menu(new MenuItem({
      type: MenuItemType.ROOT,
      children: [{
        label: 'Save State',
        eventType: EventType.SAVE_STATE,
        tooltip: 'Save the application state',
        icons: ['<i class="fa fa-fw fa-floppy-o"></i>'],
        handler: onStateMenuEvent,
        metricKey: MapMetrics.SAVE_STATE,
        shortcut: 'Ctrl+S',
        sort: 100
      },
      {
        label: 'Import State',
        eventType: ImportEventType.FILE,
        tooltip: 'Import a state from a local file or a URL',
        icons: ['<i class="fa fa-fw fa-cloud-download"></i>'],
        metricKey: MapMetrics.IMPORT_STATE,
        sort: 101
      },
      {
        label: 'Disable States',
        eventType: EventType.CLEAR_STATES,
        tooltip: 'Disable all active application states',
        icons: ['<i class="fa fa-fw fa-times"></i>'],
        handler: onStateMenuEvent,
        metricKey: MapMetrics.CLEAR_STATE,
        sort: 102
      }]
    }));

    DataManager.getInstance().listen(DescriptorEventType.ADD_DESCRIPTOR, onDescriptorChange);
    DataManager.getInstance().listen(DescriptorEventType.REMOVE_DESCRIPTOR, onDescriptorChange);
    DataManager.getInstance().listen(DescriptorEventType.UPDATE_DESCRIPTOR, onDescriptorChange);

    dispatcher.getInstance().listen(DescriptorEventType.ACTIVATED, onDescriptorChange);
    dispatcher.getInstance().listen(DescriptorEventType.DEACTIVATED, onDescriptorChange);

    refreshThrottle = new Throttle(refreshMenu, 50);
  }
};

/**
 * Dispose the state menu.
 */
const dispose = function() {
  googDispose(menu);
  menu = undefined;

  googDispose(refreshThrottle);
  refreshThrottle = undefined;
};

/**
 * Refresh menu items when a state descriptor changes.
 *
 * @param {DescriptorEvent} event Looking for IStateDescriptor events
 */
const onDescriptorChange = function(event) {
  if (refreshThrottle && event && osImplements(event.descriptor, IStateDescriptor.ID)) {
    refreshThrottle.fire();
  }
};

/**
 * Handle state menu event.
 *
 * @param {MenuEvent<undefined>} event The menu event.
 */
const onStateMenuEvent = function(event) {
  switch (event.type) {
    case EventType.SAVE_STATE:
      getStateManager().startExport();
      break;
    case EventType.CLEAR_STATES:
      var cmd = new StateClear();
      CommandProcessor.getInstance().addCommand(cmd);
      break;
    default:
      break;
  }
};

/**
 * Update the states displayed in the menu.
 */
const refreshMenu = function() {
  if (!menu) {
    return;
  }

  // Remove all groups from the menu
  var menuRoot = menu.getRoot();
  if (menuRoot.children) {
    removeAllIf(menuRoot.children, function(item) {
      return item.type === MenuItemType.GROUP;
    });
  }

  // dataManager.getDescriptors will get everything
  var descriptors = DataManager.getInstance().getDescriptors();

  // Organize the descriptors by group.
  var menuGroups = {};
  for (var i = 0; i < descriptors.length; i++) {
    var descriptor = descriptors[i];
    if (osImplements(descriptor, IStateDescriptor.ID)) {
      var stateDescriptor = /** @type {IStateDescriptor} */ (descriptor);
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
      type: MenuItemType.GROUP,
      sort: Number(splitKey[0]) || 0
    });

    // Sort the group items by time so we act on the latest
    var groupDescriptors = menuGroups[menuGroupKey];
    groupDescriptors.sort(BaseDescriptor.lastActiveReverse);

    // Store the latest active
    var tmpDescriptors = [];
    for (var i = 0; i < groupDescriptors.length; i++) {
      if (tmpDescriptors.length >= DISPLAY_LIMIT) {
        // If the display limit is reached, add a "View More" item and stop iterating
        var viewMoreOptions = getViewMoreOptions_(tmpDescriptors[0]);
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
    tmpDescriptors.sort(BaseDescriptor.titleCompare);

    // Create the menu items for the descriptors
    for (var i = 0; i < tmpDescriptors.length; i++) {
      var options = getStateOptions_(tmpDescriptors[i], i);
      if (options) {
        group.addChild(options);
      }
    }
  }
};

/**
 * Create menu item options to toggle a state descriptor.
 *
 * @param {IStateDescriptor} descriptor A state descriptor.
 * @param {number} index The menu item index.
 * @return {MenuItemOptions|undefined} Options to create the menu item.
 */
const getStateOptions_ = function(descriptor, index) {
  var label = descriptor.getTitle();
  if (label) {
    var enabled = descriptor.isActive();
    var icon = (enabled ? 'fa-check-square-o' : 'fa-square-o');
    var tooltip = (enabled ? 'Unload' : 'Load') + ' this application state';

    return {
      label: label,
      eventType: PREFIX + descriptor.getId(),
      tooltip: tooltip,
      icons: ['<i class="fa fa-fw ' + icon + '"></i>'],
      handler: toggleState.bind(undefined, descriptor),
      sort: index
    };
  }

  return undefined;
};

/**
 * Handle state menu click.
 *
 * @param {!IStateDescriptor} descriptor The clicked descriptor
 * @param {MenuEvent} event The menu event.
 */
const toggleState = function(descriptor, event) {
  descriptor.setActive(!descriptor.isActive());
};

/**
 * Create menu item options for a "View More" item.
 *
 * @param {!os.data.BaseDescriptor} descriptor A descriptor to provide input on the how the menu item should be built.
 * @return {MenuItemOptions|undefined} Options to create the menu item.
 */
const getViewMoreOptions_ = function(descriptor) {
  var typeName = descriptor.getType();
  var descriptorType = descriptor.getDescriptorType();
  if (typeName && descriptorType) {
    return {
      label: 'More ' + typeName,
      eventType: 'VIEW_MORE_' + descriptorType,
      tooltip: 'Launch the Add Data window to add more',
      icons: ['<i class="fa fa-fw fa-plus"></i>'],
      handler: viewMoreEventEmitter.bind(undefined, typeName, descriptorType),
      sort: Infinity
    };
  }

  return undefined;
};

/**
 * Sends the event to launch the 'Add Data' window.
 *
 * @param {string} typeName The descriptor type name.
 * @param {string} descriptorType The descriptor type.
 */
const viewMoreEventEmitter = function(typeName, descriptorType) {
  var filterFn = stateFilter.bind(undefined, typeName, descriptorType);

  var params = {};
  params[UIEventParams.FILTER_FUNC] = filterFn;
  params[UIEventParams.FILTER_NAME] = typeName;

  var event = new UIEvent(UIEventType.TOGGLE_UI, 'addData', undefined, params);
  dispatcher.getInstance().dispatchEvent(event);
};

/**
 * Filter state descriptors.
 *
 * @param {string} typeName The descriptor type name.
 * @param {string} descriptorType The descriptor type.
 * @param {os.structs.ITreeNode} node The tree node.
 * @return {boolean} If the node should be displayed.
 */
const stateFilter = function(typeName, descriptorType, node) {
  if (node instanceof DescriptorNode) {
    var descriptor = node.getDescriptor();
    if (osImplements(descriptor, IStateDescriptor.ID)) {
      return descriptor.getType() === typeName && descriptor.getDescriptorType() === descriptorType;
    }
  }

  return false;
};

exports = {
  getMenu,
  refreshThrottle,
  DISPLAY_LIMIT,
  PREFIX,
  EventType,
  setup,
  dispose,
  refreshMenu,
  toggleState,
  viewMoreEventEmitter,
  stateFilter
};

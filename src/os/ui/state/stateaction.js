goog.provide('os.ui.state.action');
goog.provide('os.ui.state.action.EventType');
goog.provide('os.ui.state.action.manager');

goog.require('goog.async.Throttle');
goog.require('os.metrics.Metrics');
goog.require('os.metrics.keys');
goog.require('os.ui.action.Action');
goog.require('os.ui.action.ActionManager');
goog.require('os.ui.action.MenuOptions');
goog.require('os.ui.events.UIEvent');
goog.require('os.ui.events.UIEventType');
goog.require('os.ui.im.ImportEventType');
goog.require('os.ui.state.IStateDescriptor');
goog.require('os.ui.state.cmd.StateClear');


/**
 * @type {os.ui.action.ActionManager}
 */
os.ui.state.action.manager = null;


/**
 * Throttle how often the state menu is updated.
 * @type {goog.async.Throttle}
 */
os.ui.state.action.refreshThrottle = null;


/**
 * The maximum number of items to display in the state menu.
 * @type {number}
 * @private
 */
os.ui.state.action.displayLimit_ = 7;


/**
 * TODO: This really should not be in the action handler. Where to put it?
 * @type {string}
 * @private
 */
os.ui.state.action.targetWindow_ = 'addData';


/**
 * Prefix for all state actions.
 * @type {string}
 * @const
 */
os.ui.state.action.PREFIX = 'state:';


/**
 * State action event types.
 * @enum {string}
 */
os.ui.state.action.EventType = {
  SAVE_STATE: os.ui.state.action.PREFIX + 'save',
  CLEAR_STATES: os.ui.state.action.PREFIX + 'clear'
};


/**
 * Sets up state actions.
 */
os.ui.state.action.setup = function() {
  if (!os.ui.state.action.manager) {
    os.ui.state.action.manager = new os.ui.action.ActionManager();
  }

  var manager = os.ui.state.action.manager;
  if (!manager.getAction(os.ui.state.action.EventType.SAVE_STATE)) {
    os.ui.state.action.addStaticActions_(manager);

    os.dataManager.listen(os.data.DescriptorEventType.ADD_DESCRIPTOR,
        os.ui.state.action.onDescriptorChange_);
    os.dataManager.listen(os.data.DescriptorEventType.REMOVE_DESCRIPTOR,
        os.ui.state.action.onDescriptorChange_);
    os.dataManager.listen(os.data.DescriptorEventType.UPDATE_DESCRIPTOR,
        os.ui.state.action.onDescriptorChange_);

    os.dispatcher.listen(os.data.DescriptorEventType.ACTIVATED, os.ui.state.action.onDescriptorChange_);
    os.dispatcher.listen(os.data.DescriptorEventType.DEACTIVATED, os.ui.state.action.onDescriptorChange_);

    manager.registerTempActionFunc(os.ui.state.action.getEnabledActions);

    os.ui.state.action.refreshThrottle = new goog.async.Throttle(manager.refreshEnabledActions, 50, manager);
  }
};


/**
 * Disposes the state action manager.
 */
os.ui.state.action.dispose = function() {
  if (os.ui.state.action.manager) {
    os.ui.state.action.manager.dispose();
    os.ui.state.action.manager = null;
  }
};


/**
 * Adds the static actions to manager.
 * @param {os.ui.action.ActionManager} manager The action manager
 * @private
 */
os.ui.state.action.addStaticActions_ = function(manager) {
  if (manager && !manager.getAction(os.ui.state.action.EventType.SAVE_STATE)) {
    var importFile = new os.ui.action.Action(os.ui.im.ImportEventType.FILE, 'Import State',
        'Import a state from a local file or a URL', 'fa-cloud-download', null, null,
        os.metrics.keys.Map.IMPORT_STATE);
    manager.addAction(importFile);

    var save = new os.ui.action.Action(os.ui.state.action.EventType.SAVE_STATE, 'Save State',
        'Save the application state', 'fa-floppy-o', null, null);
    manager.addAction(save);

    var clear = new os.ui.action.Action(os.ui.state.action.EventType.CLEAR_STATES, 'Disable States',
        'Disable all active application states', 'fa-times', null, null);
    manager.addAction(clear);

    manager.listen(os.ui.state.action.EventType.SAVE_STATE, os.ui.state.action.onStateActionEvent_);
    manager.listen(os.ui.state.action.EventType.CLEAR_STATES, os.ui.state.action.onStateActionEvent_);
  }
};


/**
 * Triggers a refresh of the menu when descriptors are changed.
 * @param {os.data.DescriptorEvent} event Looking for IStateDescriptor events
 * @private
 */
os.ui.state.action.onDescriptorChange_ = function(event) {
  if (os.implements(event.descriptor, os.ui.state.IStateDescriptor.ID)) {
    // Throttles how often the bound method gets fired.
    os.ui.state.action.refreshThrottle.fire();
  }
};


/**
 * State action event listener
 * @param {os.ui.action.ActionEvent} event
 * @private
 */
os.ui.state.action.onStateActionEvent_ = function(event) {
  switch (event.type) {
    case os.ui.state.action.EventType.SAVE_STATE:
      os.ui.stateManager.startExport();
      break;
    case os.ui.state.action.EventType.CLEAR_STATES:
      os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Map.CLEAR_STATE, 1);
      var cmd = new os.ui.state.cmd.StateClear();
      os.command.CommandProcessor.getInstance().addCommand(cmd);
      break;
    default:
      break;
  }
};


/**
 * Get the list of currently enabled actions.
 *
 */
os.ui.state.action.getEnabledActions = function() {
  var manager = os.ui.state.action.manager;

  // Clear out all the actions and recreate them.
  manager.removeActions();

  var resultActions = [];

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
    var groupDescriptors = menuGroups[menuGroupKey];
    var tmpDescriptors = [];

    // Sort the group items by time so we act on the latest
    goog.array.sort(groupDescriptors, os.data.BaseDescriptor.lastActiveReverse);

    // Store the latest active
    for (var i = 0; i < groupDescriptors.length; i++) {
      var descriptor = groupDescriptors[i];
      if (descriptor.getLastActive()) {
        tmpDescriptors.push(descriptor);
      }
    }

    if (tmpDescriptors.length >= os.ui.state.action.displayLimit_) {
      tmpDescriptors = tmpDescriptors.splice(0, os.ui.state.action.displayLimit_);
    }

    // Sort the latest by title for the better user experience
    goog.array.sort(tmpDescriptors, os.data.BaseDescriptor.titleCompare);

    // Create the actions for the descriptors
    for (var i = 0; i < tmpDescriptors.length; i++) {
      resultActions.push(os.ui.state.action.getStateAction_(tmpDescriptors[i]));
    }

    if (os.ui.state.action.displayLimit_ == tmpDescriptors.length) {
      // Add the view more action.
      resultActions.push(os.ui.state.action.createViewMore_(tmpDescriptors[0]));
    }
  }

  // concatenate the above actions with the static actions
  os.ui.state.action.addStaticActions_(manager);
  manager.addActions(resultActions);
};


/**
 * @param {os.ui.state.IStateDescriptor} descriptor
 * @return {os.ui.action.Action}
 * @private
 */
os.ui.state.action.getStateAction_ = function(descriptor) {
  var enabled = descriptor.isActive();
  var addAction = new os.ui.action.Action(os.ui.state.action.PREFIX + descriptor.getId(),
      descriptor.getTitle(),
      (enabled ? 'Unload' : 'Load') + ' this application state',
      (enabled ? 'fa-check-square-o' : 'fa-square-o'),
      null,
      new os.ui.action.MenuOptions(null, descriptor.getMenuGroup()));
  addAction.handleWith(os.ui.state.action.onStateAction_.bind(undefined, descriptor));

  return addAction;
};


/**
 * Handle state action menu click
 * @param {!os.ui.state.IStateDescriptor} descriptor The clicked descriptor
 * @param {os.ui.action.ActionEvent} event The action event
 * @private
 */
os.ui.state.action.onStateAction_ = function(descriptor, event) {
  var active = !descriptor.isActive();
  descriptor.setActive(active);

  os.ui.state.action.manager.refreshEnabledActions();
};


/**
 * Adds the static actions to manager.
 * @param {os.data.BaseDescriptor} descriptor A descriptor to provide input on the how the action should be built.
 * @private
 * @return {os.ui.action.Action} A new view more action.
 */
os.ui.state.action.createViewMore_ = function(descriptor) {
  var manager = os.ui.state.action.manager;

  // TODO: make function
  manager.listen('VIEW_MORE_' + descriptor.getDescriptorType(), os.ui.state.action.viewMoreEventEmitter);

  var viewMore = new os.ui.action.Action(
      'VIEW_MORE_' + descriptor.getDescriptorType(),
      'More ' + descriptor.getType(),
      'Launch the Add Data window to add more',
      'fa-plus green-icon',
      null,
      new os.ui.action.MenuOptions(null, descriptor.getMenuGroup()));

  return viewMore;
};


/**
 * Sends the event to launch the 'Add Data' window
 * TODO: when the capabilitiy is ready be sure to filter to the specific state types.
 */
os.ui.state.action.viewMoreEventEmitter = function() {
  var event = new os.ui.events.UIEvent(os.ui.events.UIEventType.TOGGLE_UI, os.ui.state.action.targetWindow_, true);
  os.dispatcher.dispatchEvent(event);
};

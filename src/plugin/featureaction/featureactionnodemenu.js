goog.module('plugin.im.action.feature.node');
goog.module.declareLegacyNamespace();

const googDispose = goog.require('goog.dispose');
const CommandProcessor = goog.require('os.command.CommandProcessor');
const ParallelCommand = goog.require('os.command.ParallelCommand');
const action = goog.require('os.im.action');
const filterAction = goog.require('os.im.action.filter');
const structs = goog.require('os.structs');
const TriState = goog.require('os.structs.TriState');
const {launchFilterActionExport} = goog.require('os.ui.im.action.FilterActionExportUI');
const FilterActionExportType = goog.require('os.ui.im.action.FilterActionExportType');
const Menu = goog.require('os.ui.menu.Menu');
const MenuItem = goog.require('os.ui.menu.MenuItem');
const MenuItemType = goog.require('os.ui.menu.MenuItemType');
const {
  Metrics: FeatureActionMetrics,
  editEntry,
  getExportName
} = goog.require('plugin.im.action.feature');

const FilterActionEntry = goog.requireType('os.im.action.FilterActionEntry');
const ITreeNode = goog.requireType('os.structs.ITreeNode');
const FilterActionNode = goog.requireType('os.ui.im.action.FilterActionNode');
const MenuEvent = goog.requireType('os.ui.menu.MenuEvent');
const layerMenu = goog.requireType('os.ui.menu.layer');


/**
 * Application feature action node menu.
 * @type {(Menu<undefined>|undefined)}
 */
let MENU = undefined;

/**
 * Feature action node menu event types.
 * @enum {string}
 */
const EventType = {
  COPY: 'featureactionnodes:copy',
  EDIT: 'featureactionnodes:edit',
  EXPORT: 'featureactionnodes:export',
  REMOVE: 'featureactionnodes:remove',
  REMOVE_SELECTED: 'featureactionnodes:removeSelected',
  TOGGLE_ON: 'featureactionnodes:toggleOn',
  TOGGLE_OFF: 'featureactionnodes:toggleOff'
};

/**
 * Set up the menu.
 */
const setup = function() {
  if (!MENU) {
    MENU = new Menu(new MenuItem({
      type: MenuItemType.ROOT,
      children: [{
        label: 'Copy',
        eventType: EventType.COPY,
        tooltip: 'Copy the action',
        icons: ['<i class="fa fa-copy fa-fw"></i>'],
        beforeRender: visibleIfSelected_,
        handler: onCopyEvent_,
        metricKey: action.Metrics.COPY
      },
      {
        label: 'Edit',
        eventType: EventType.EDIT,
        tooltip: 'Edit the action',
        icons: ['<i class="fa fa-pencil fa-fw"></i>'],
        beforeRender: visibleIfOneSelected_,
        handler: onEditEvent_,
        metricKey: action.Metrics.EDIT
      },
      {
        label: 'Export Selected',
        eventType: EventType.EXPORT,
        tooltip: 'Export the action',
        icons: ['<i class="fa fa-fw fa-download"></i>'],
        beforeRender: visibleIfSelected_,
        handler: onExportEvent_,
        metricKey: action.Metrics.EXPORT
      },
      {
        label: 'Remove',
        eventType: EventType.REMOVE,
        tooltip: 'Remove the action',
        icons: ['<i class="fa fa-fw fa-times"></i>'],
        beforeRender: visibleIfOneSelected_,
        handler: onRemoveEvent_,
        metricKey: action.Metrics.REMOVE
      },
      {
        label: 'Remove Selected',
        eventType: EventType.REMOVE_SELECTED,
        tooltip: 'Removes selected actions',
        icons: ['<i class="fa fa-fw fa-times"></i>'],
        beforeRender: visibleIfMultiSelected_,
        handler: onRemoveSelectedEvent_,
        metricKey: FeatureActionMetrics.REMOVE_SELECTED
      },
      {
        label: 'Toggle On',
        eventType: EventType.TOGGLE_ON,
        tooltip: 'Toggles the actions on',
        icons: ['<i class="fa fa-fw fa-check-square-o"></i>'],
        beforeRender: visibleIfCanToggleOn_,
        handler: onToggleOnEvent_,
        metricKey: FeatureActionMetrics.TOGGLE_ON
      },
      {
        label: 'Toggle Off',
        eventType: EventType.TOGGLE_OFF,
        tooltip: 'Toggles the actions off',
        icons: ['<i class="fa fa-fw fa-square-o"></i>'],
        beforeRender: visibleIfCanToggleOff_,
        handler: onToggleOffEvent_,
        metricKey: FeatureActionMetrics.TOGGLE_OFF
      }]
    }));
  }
};

/**
 * Disposes feature action node menu
 */
const dispose = function() {
  googDispose(MENU);
  MENU = undefined;
};

/**
 * Gets the filter action nodes out of an array of nodes.
 *
 * @param {Array<ITreeNode>} context The array of nodes.
 * @return {!Array<FilterActionNode>} The array of filter action nodes.
 */
const getFeatureActionNodes = function(context) {
  var filterActionNodes = [];
  if (context) {
    context.forEach(filterAction.isFilterActionNode.bind(undefined, filterActionNodes));
  }

  return filterActionNodes;
};

/**
 * Show the feature action node menu item.
 *
 * @param {layerMenu.Context} context The menu context.
 * @this {MenuItem}
 */
const visibleIfSelected_ = function(context) {
  var filterActionNodes = getFeatureActionNodes(context);
  this.visible = filterActionNodes.length > 0;
};

/**
 * Show the feature action node menu item if a single item is selected.
 *
 * @param {layerMenu.Context} context The menu context.
 * @this {MenuItem}
 */
const visibleIfOneSelected_ = function(context) {
  var filterActionNodes = getFeatureActionNodes(context);
  this.visible = filterActionNodes.length == 1;
};

/**
 * Show the feature action node menu item if multiple items are selected.
 *
 * @param {layerMenu.Context} context The menu context.
 * @this {MenuItem}
 */
const visibleIfMultiSelected_ = function(context) {
  var filterActionNodes = getFeatureActionNodes(context);
  this.visible = filterActionNodes.length > 1;
};

/**
 * Show the feature action node menu item if can toggle it on.
 *
 * @param {layerMenu.Context} context The menu context.
 * @this {MenuItem}
 */
const visibleIfCanToggleOn_ = function(context) {
  this.visible = false;

  var filterActionNodes = getFeatureActionNodes(context);
  if (filterActionNodes.length == 1) {
    if (filterActionNodes[0].getState() == TriState.ON) {
      this.visible = false;
    } else {
      this.visible = true;
    }
  } else if (filterActionNodes.length > 1) {
    for (var i = 0; i < filterActionNodes.length; i++) {
      if (filterActionNodes[i].getState() == TriState.OFF) {
        this.visible = true;
        break;
      }
    }
  }
};

/**
 * Show the feature action node menu item if can toggle it off.
 *
 * @param {layerMenu.Context} context The menu context.
 * @this {MenuItem}
 */
const visibleIfCanToggleOff_ = function(context) {
  this.visible = false;

  var filterActionNodes = getFeatureActionNodes(context);
  if (filterActionNodes.length == 1) {
    if (filterActionNodes[0].getState() == TriState.OFF) {
      this.visible = false;
    } else {
      this.visible = true;
    }
  } else if (filterActionNodes.length > 1) {
    for (var i = 0; i < filterActionNodes.length; i++) {
      if (filterActionNodes[i].getState() == TriState.ON) {
        this.visible = true;
        break;
      }
    }
  }
};

/**
 * Handle the Copy menu event from the feature action node menu.
 *
 * @param {!MenuEvent<layerMenu.Context>} event The menu event.
 */
const onCopyEvent_ = function(event) {
  var context = event.getContext();
  var filterActionNodes = getFeatureActionNodes(context);
  if (filterActionNodes.length == 1) {
    var entry = /** @type {FilterActionEntry} */ (filterActionNodes[0].getEntry());
    var parentIndex = structs.getIndexInParent(filterActionNodes[0]);
    if (entry) {
      var cmd = filterAction.copyEntryCmd(entry, parentIndex == -1 ? undefined : parentIndex + 1);
      CommandProcessor.getInstance().addCommand(cmd);
    }
  } else if (filterActionNodes.length > 1) {
    var cpCmds = [];
    for (var i = 0; i < filterActionNodes.length; i++) {
      var entry = /** @type {FilterActionEntry} */ (filterActionNodes[i].getEntry());
      var parentIndex = structs.getIndexInParent(filterActionNodes[i]);
      if (entry) {
        var cpCmd = filterAction.copyEntryCmd(entry, parentIndex == -1 ? undefined : parentIndex + 1);
        cpCmds.push(cpCmd);
      }
    }
    if (cpCmds.length) {
      var cmd = new ParallelCommand();
      cmd.setCommands(cpCmds);
      cmd.title = 'Copy feature action nodes' + (cpCmds.length > 1 ? 's' : '');
      CommandProcessor.getInstance().addCommand(cmd);
    }
  }
};

/**
 * Handle the Edit menu event from the feature action node menu.
 *
 * @param {!MenuEvent<layerMenu.Context>} event The menu event.
 */
const onEditEvent_ = function(event) {
  var context = event.getContext();
  var filterActionNodes = getFeatureActionNodes(context);
  if (filterActionNodes.length == 1) {
    var entry = /** @type {FilterActionEntry} */ (filterActionNodes[0].getEntry());
    if (entry) {
      editEntry(entry.getType(), entry);
    }
  }
};

/**
 * Handle the Export menu event from the feature action node menu.
 *
 * @param {!MenuEvent<layerMenu.Context>} event The menu event.
 */
const onExportEvent_ = function(event) {
  var context = event.getContext();
  var filterActionNodes = getFeatureActionNodes(context);
  if (filterActionNodes.length >= 1) {
    var entries = [];
    var selected = [];
    var exportName;
    for (var i = 0; i < filterActionNodes.length; i++) {
      var entry = /** @type {FilterActionEntry} */ (filterActionNodes[i].getEntry());
      if (entry) {
        entries.push(entry);
        selected.push(entry);
        exportName = getExportName(entry.getType());
      }
    }
    if (entries.length && selected.length) {
      launchFilterActionExport(entries, selected, exportName, FilterActionExportType.SELECTED);
    }
  }
};

/**
 * Handle the Remove menu event from the feature action node menu.
 *
 * @param {!MenuEvent<layerMenu.Context>} event The menu event.
 */
const onRemoveEvent_ = function(event) {
  var context = event.getContext();
  var filterActionNodes = getFeatureActionNodes(context);
  if (filterActionNodes.length == 1) {
    var entry = /** @type {FilterActionEntry} */ (filterActionNodes[0].getEntry());
    if (entry) {
      var cmd = filterAction.removeEntryCmd(entry);
      CommandProcessor.getInstance().addCommand(cmd);
    }
  }
};

/**
 * Handle the Remove Selected menu event from the feature action node menu.
 *
 * @param {!MenuEvent<layerMenu.Context>} event The menu event.
 */
const onRemoveSelectedEvent_ = function(event) {
  var context = event.getContext();
  var filterActionNodes = getFeatureActionNodes(context);
  if (filterActionNodes.length > 1) {
    var rmCmds = [];
    for (var i = 0; i < filterActionNodes.length; i++) {
      var entry = /** @type {FilterActionEntry} */ (filterActionNodes[i].getEntry());
      if (entry) {
        var rmCmd = filterAction.removeEntryCmd(entry);
        rmCmds.push(rmCmd);
      }
    }
    if (rmCmds.length) {
      var cmd = new ParallelCommand();
      // The remove commands must be ordered by index for reverting
      cmd.setCommands(rmCmds.sort(function(a, b) {
        if (a.index > b.index) {
          return 1;
        }
        if (a.index < b.index) {
          return -1;
        }
        return 0;
      }));
      cmd.title = 'Remove feature action nodes' + (rmCmds.length > 1 ? 's' : '');
      CommandProcessor.getInstance().addCommand(cmd);
    }
  }
};

/**
 * Handle the Toggle On menu event from the feature action node menu.
 *
 * @param {!MenuEvent<layerMenu.Context>} event The menu event.
 */
const onToggleOnEvent_ = function(event) {
  var context = event.getContext();
  var filterActionNodes = getFeatureActionNodes(context);
  if (filterActionNodes.length >= 1) {
    for (var i = 0; i < filterActionNodes.length; i++) {
      filterActionNodes[i].setState(TriState.ON);
    }
  }
};

/**
 * Handle the Toggle Off menu event from the feature action node menu.
 *
 * @param {!MenuEvent<layerMenu.Context>} event The menu event.
 */
const onToggleOffEvent_ = function(event) {
  var context = event.getContext();
  var filterActionNodes = getFeatureActionNodes(context);
  if (filterActionNodes.length >= 1) {
    for (var i = 0; i < filterActionNodes.length; i++) {
      filterActionNodes[i].setState(TriState.OFF);
    }
  }
};

exports = {
  MENU,
  EventType,
  setup,
  dispose,
  getFeatureActionNodes
};

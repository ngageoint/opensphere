goog.provide('plugin.im.action.feature.node');

goog.require('os.command.ParallelCommand');
goog.require('os.im.action');
goog.require('os.im.action.FilterActionEntry');
goog.require('os.im.action.filter');
goog.require('os.ui.menu.Menu');
goog.require('os.ui.menu.MenuItem');
goog.require('os.ui.menu.MenuItemType');
goog.require('os.ui.state.menu');


/**
 * Application feature action node menu.
 * @type {(os.ui.menu.Menu<undefined>|undefined)}
 */
plugin.im.action.feature.node.MENU = undefined;


/**
 * Feature action node menu event types.
 * @enum {string}
 */
plugin.im.action.feature.node.EventType = {
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
plugin.im.action.feature.node.setup = function() {
  if (!plugin.im.action.feature.node.MENU) {
    plugin.im.action.feature.node.MENU = new os.ui.menu.Menu(new os.ui.menu.MenuItem({
      type: os.ui.menu.MenuItemType.ROOT,
      children: [{
        label: 'Copy',
        eventType: plugin.im.action.feature.node.EventType.COPY,
        tooltip: 'Copy the action',
        icons: ['<i class="fa fa-copy fa-fw"></i>'],
        beforeRender: plugin.im.action.feature.node.visibleIfSelected_,
        handler: plugin.im.action.feature.node.onCopyEvent_,
        metricKey: os.im.action.Metrics.COPY
      },
      {
        label: 'Edit',
        eventType: plugin.im.action.feature.node.EventType.EDIT,
        tooltip: 'Edit the action',
        icons: ['<i class="fa fa-pencil fa-fw"></i>'],
        beforeRender: plugin.im.action.feature.node.visibleIfOneSelected_,
        handler: plugin.im.action.feature.node.onEditEvent_,
        metricKey: os.im.action.Metrics.EDIT
      },
      {
        label: 'Export Selected',
        eventType: plugin.im.action.feature.node.EventType.EXPORT,
        tooltip: 'Export the action',
        icons: ['<i class="fa fa-fw fa-download"></i>'],
        beforeRender: plugin.im.action.feature.node.visibleIfSelected_,
        handler: plugin.im.action.feature.node.onExportEvent_,
        metricKey: os.im.action.Metrics.EXPORT
      },
      {
        label: 'Remove',
        eventType: plugin.im.action.feature.node.EventType.REMOVE,
        tooltip: 'Remove the action',
        icons: ['<i class="fa fa-fw fa-times"></i>'],
        beforeRender: plugin.im.action.feature.node.visibleIfOneSelected_,
        handler: plugin.im.action.feature.node.onRemoveEvent_,
        metricKey: os.im.action.Metrics.REMOVE
      },
      {
        label: 'Remove Selected',
        eventType: plugin.im.action.feature.node.EventType.REMOVE_SELECTED,
        tooltip: 'Removes selected actions',
        icons: ['<i class="fa fa-fw fa-times"></i>'],
        beforeRender: plugin.im.action.feature.node.visibleIfMultiSelected_,
        handler: plugin.im.action.feature.node.onRemoveSelectedEvent_,
        metricKey: plugin.im.action.feature.Metrics.REMOVE_SELECTED
      },
      {
        label: 'Toggle On',
        eventType: plugin.im.action.feature.node.EventType.TOGGLE_ON,
        tooltip: 'Toggles the actions on',
        icons: ['<i class="fa fa-fw fa-check-square-o"></i>'],
        beforeRender: plugin.im.action.feature.node.visibleIfCanToggleOn_,
        handler: plugin.im.action.feature.node.onToggleOnEvent_,
        metricKey: plugin.im.action.feature.Metrics.TOGGLE_ON
      },
      {
        label: 'Toggle Off',
        eventType: plugin.im.action.feature.node.EventType.TOGGLE_OFF,
        tooltip: 'Toggles the actions off',
        icons: ['<i class="fa fa-fw fa-square-o"></i>'],
        beforeRender: plugin.im.action.feature.node.visibleIfCanToggleOff_,
        handler: plugin.im.action.feature.node.onToggleOffEvent_,
        metricKey: plugin.im.action.feature.Metrics.TOGGLE_OFF
      }]
    }));
  }
};


/**
 * Disposes feature action node menu
 */
plugin.im.action.feature.node.dispose = function() {
  goog.dispose(plugin.im.action.feature.node.MENU);
  plugin.im.action.feature.node.MENU = undefined;
};


/**
 * Gets the filter action nodes out of an array of nodes.
 * @param {Array<os.structs.ITreeNode>} context The array of nodes.
 * @return {!Array<os.ui.im.action.FilterActionNode>} The array of filter action nodes.
 */
plugin.im.action.feature.node.getFeatureActionNodes = function(context) {
  var filterActionNodes = [];
  if (context) {
    context.forEach(os.im.action.filter.isFilterActionNode.bind(this, filterActionNodes));
  }

  return filterActionNodes;
};


/**
 * Show the feature action node menu item.
 * @param {os.ui.menu.layer.Context} context The menu context.
 * @private
 * @this {os.ui.menu.MenuItem}
 */
plugin.im.action.feature.node.visibleIfSelected_ = function(context) {
  var filterActionNodes = plugin.im.action.feature.node.getFeatureActionNodes(context);
  this.visible = filterActionNodes.length > 0;
};


/**
 * Show the feature action node menu item if a single item is selected.
 * @param {os.ui.menu.layer.Context} context The menu context.
 * @private
 * @this {os.ui.menu.MenuItem}
 */
plugin.im.action.feature.node.visibleIfOneSelected_ = function(context) {
  var filterActionNodes = plugin.im.action.feature.node.getFeatureActionNodes(context);
  this.visible = filterActionNodes.length == 1;
};


/**
 * Show the feature action node menu item if multiple items are selected.
 * @param {os.ui.menu.layer.Context} context The menu context.
 * @private
 * @this {os.ui.menu.MenuItem}
 */
plugin.im.action.feature.node.visibleIfMultiSelected_ = function(context) {
  var filterActionNodes = plugin.im.action.feature.node.getFeatureActionNodes(context);
  this.visible = filterActionNodes.length > 1;
};


/**
 * Show the feature action node menu item if can toggle it on.
 * @param {os.ui.menu.layer.Context} context The menu context.
 * @private
 * @this {os.ui.menu.MenuItem}
 */
plugin.im.action.feature.node.visibleIfCanToggleOn_ = function(context) {
  this.visible = false;

  var filterActionNodes = plugin.im.action.feature.node.getFeatureActionNodes(context);
  if (filterActionNodes.length == 1) {
    if (filterActionNodes[0].getState() == os.structs.TriState.ON) {
      this.visible = false;
    } else {
      this.visible = true;
    }
  } else if (filterActionNodes.length > 1) {
    for (var i = 0; i < filterActionNodes.length; i++) {
      if (filterActionNodes[i].getState() == os.structs.TriState.OFF) {
        this.visible = true;
        break;
      }
    }
  }
};


/**
 * Show the feature action node menu item if can toggle it off.
 * @param {os.ui.menu.layer.Context} context The menu context.
 * @private
 * @this {os.ui.menu.MenuItem}
 */
plugin.im.action.feature.node.visibleIfCanToggleOff_ = function(context) {
  this.visible = false;

  var filterActionNodes = plugin.im.action.feature.node.getFeatureActionNodes(context);
  if (filterActionNodes.length == 1) {
    if (filterActionNodes[0].getState() == os.structs.TriState.OFF) {
      this.visible = false;
    } else {
      this.visible = true;
    }
  } else if (filterActionNodes.length > 1) {
    for (var i = 0; i < filterActionNodes.length; i++) {
      if (filterActionNodes[i].getState() == os.structs.TriState.ON) {
        this.visible = true;
        break;
      }
    }
  }
};


/**
 * Handle the Copy menu event from the feature action node menu.
 * @param {!os.ui.menu.MenuEvent<os.ui.menu.layer.Context>} event The menu event.
 * @private
 */
plugin.im.action.feature.node.onCopyEvent_ = function(event) {
  var context = event.getContext();
  var filterActionNodes = plugin.im.action.feature.node.getFeatureActionNodes(context);
  if (filterActionNodes.length == 1) {
    var entry = /** @type {os.im.action.FilterActionEntry} */ (filterActionNodes[0].getEntry());
    var parentIndex = os.structs.getIndexInParent(filterActionNodes[0]);
    if (entry) {
      var cmd = os.im.action.filter.copyEntryCmd(entry, parentIndex == -1 ? undefined : parentIndex + 1);
      os.commandStack.addCommand(cmd);
    }
  } else if (filterActionNodes.length > 1) {
    var cpCmds = [];
    for (var i = 0; i < filterActionNodes.length; i++) {
      var entry = /** @type {os.im.action.FilterActionEntry} */ (filterActionNodes[i].getEntry());
      var parentIndex = os.structs.getIndexInParent(filterActionNodes[i]);
      if (entry) {
        var cpCmd = os.im.action.filter.copyEntryCmd(entry, parentIndex == -1 ? undefined : parentIndex + 1);
        cpCmds.push(cpCmd);
      }
    }
    if (cpCmds.length) {
      var cmd = new os.command.ParallelCommand();
      cmd.setCommands(cpCmds);
      cmd.title = 'Copy feature action nodes' + (cpCmds.length > 1 ? 's' : '');
      os.command.CommandProcessor.getInstance().addCommand(cmd);
    }
  }
};


/**
 * Handle the Edit menu event from the feature action node menu.
 * @param {!os.ui.menu.MenuEvent<os.ui.menu.layer.Context>} event The menu event.
 * @private
 */
plugin.im.action.feature.node.onEditEvent_ = function(event) {
  var context = event.getContext();
  var filterActionNodes = plugin.im.action.feature.node.getFeatureActionNodes(context);
  if (filterActionNodes.length == 1) {
    var entry = /** @type {os.im.action.FilterActionEntry} */ (filterActionNodes[0].getEntry());
    if (entry) {
      plugin.im.action.feature.editEntry(entry.getType(), entry);
    }
  }
};


/**
 * Handle the Export menu event from the feature action node menu.
 * @param {!os.ui.menu.MenuEvent<os.ui.menu.layer.Context>} event The menu event.
 * @private
 */
plugin.im.action.feature.node.onExportEvent_ = function(event) {
  var context = event.getContext();
  var filterActionNodes = plugin.im.action.feature.node.getFeatureActionNodes(context);
  if (filterActionNodes.length >= 1) {
    var entries = [];
    var selected = [];
    var exportName;
    for (var i = 0; i < filterActionNodes.length; i++) {
      var entry = /** @type {os.im.action.FilterActionEntry} */ (filterActionNodes[i].getEntry());
      if (entry) {
        entries.push(entry);
        selected.push(entry);
        exportName = plugin.im.action.feature.getExportName(entry.getType());
      }
    }
    if (entries.length && selected.length) {
      os.ui.im.action.launchFilterActionExport(entries, selected,
          exportName, os.ui.im.action.FilterActionExportType.SELECTED);
    }
  }
};


/**
 * Handle the Remove menu event from the feature action node menu.
 * @param {!os.ui.menu.MenuEvent<os.ui.menu.layer.Context>} event The menu event.
 * @private
 */
plugin.im.action.feature.node.onRemoveEvent_ = function(event) {
  var context = event.getContext();
  var filterActionNodes = plugin.im.action.feature.node.getFeatureActionNodes(context);
  if (filterActionNodes.length == 1) {
    var entry = /** @type {os.im.action.FilterActionEntry} */ (filterActionNodes[0].getEntry());
    if (entry) {
      var cmd = os.im.action.filter.removeEntryCmd(entry);
      os.commandStack.addCommand(cmd);
    }
  }
};


/**
 * Handle the Remove Selected menu event from the feature action node menu.
 * @param {!os.ui.menu.MenuEvent<os.ui.menu.layer.Context>} event The menu event.
 * @private
 */
plugin.im.action.feature.node.onRemoveSelectedEvent_ = function(event) {
  var context = event.getContext();
  var filterActionNodes = plugin.im.action.feature.node.getFeatureActionNodes(context);
  if (filterActionNodes.length > 1) {
    var rmCmds = [];
    for (var i = 0; i < filterActionNodes.length; i++) {
      var entry = /** @type {os.im.action.FilterActionEntry} */ (filterActionNodes[i].getEntry());
      if (entry) {
        var rmCmd = os.im.action.filter.removeEntryCmd(entry);
        rmCmds.push(rmCmd);
      }
    }
    if (rmCmds.length) {
      var cmd = new os.command.ParallelCommand();
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
      os.command.CommandProcessor.getInstance().addCommand(cmd);
    }
  }
};


/**
 * Handle the Toggle On menu event from the feature action node menu.
 * @param {!os.ui.menu.MenuEvent<os.ui.menu.layer.Context>} event The menu event.
 * @private
 */
plugin.im.action.feature.node.onToggleOnEvent_ = function(event) {
  var context = event.getContext();
  var filterActionNodes = plugin.im.action.feature.node.getFeatureActionNodes(context);
  if (filterActionNodes.length >= 1) {
    for (var i = 0; i < filterActionNodes.length; i++) {
      filterActionNodes[i].setState(os.structs.TriState.ON);
    }
  }
};


/**
 * Handle the Toggle Off menu event from the feature action node menu.
 * @param {!os.ui.menu.MenuEvent<os.ui.menu.layer.Context>} event The menu event.
 * @private
 */
plugin.im.action.feature.node.onToggleOffEvent_ = function(event) {
  var context = event.getContext();
  var filterActionNodes = plugin.im.action.feature.node.getFeatureActionNodes(context);
  if (filterActionNodes.length >= 1) {
    for (var i = 0; i < filterActionNodes.length; i++) {
      filterActionNodes[i].setState(os.structs.TriState.OFF);
    }
  }
};

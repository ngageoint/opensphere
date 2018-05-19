goog.provide('plugin.im.action.feature.node.menu');

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
plugin.im.action.feature.node.menu.MENU = undefined;


/**
 * Feature action node menu event types.
 * @enum {string}
 */
plugin.im.action.feature.node.menu.EventType = {
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
plugin.im.action.feature.node.menu.setup = function() {
  if (!plugin.im.action.feature.node.menu.MENU) {
    plugin.im.action.feature.node.menu.MENU = new os.ui.menu.Menu(new os.ui.menu.MenuItem({
      type: os.ui.menu.MenuItemType.ROOT,
      children: [{
        label: 'Copy',
        eventType: plugin.im.action.feature.node.menu.EventType.COPY,
        tooltip: 'Copy the action',
        icons: ['<i class="fa fa-copy fa-fw"></i>'],
        beforeRender: plugin.im.action.feature.node.menu.visibleIfSelected_,
        handler: plugin.im.action.feature.node.menu.onCopyEvent_,
        metricKey: os.im.action.Metrics.COPY
      },
      {
        label: 'Edit',
        eventType: plugin.im.action.feature.node.menu.EventType.EDIT,
        tooltip: 'Edit the action',
        icons: ['<i class="fa fa-pencil fa-fw"></i>'],
        beforeRender: plugin.im.action.feature.node.menu.visibleIfOneSelected_,
        handler: plugin.im.action.feature.node.menu.onEditEvent_,
        metricKey: os.im.action.Metrics.EDIT
      },
      {
        label: 'Export Selected',
        eventType: plugin.im.action.feature.node.menu.EventType.EXPORT,
        tooltip: 'Export the action',
        icons: ['<i class="fa fa-fw fa-download"></i>'],
        beforeRender: plugin.im.action.feature.node.menu.visibleIfSelected_,
        handler: plugin.im.action.feature.node.menu.onExportEvent_,
        metricKey: os.im.action.Metrics.EXPORT
      },
      {
        label: 'Remove',
        eventType: plugin.im.action.feature.node.menu.EventType.REMOVE,
        tooltip: 'Remove the action',
        icons: ['<i class="fa fa-fw fa-times"></i>'],
        beforeRender: plugin.im.action.feature.node.menu.visibleIfOneSelected_,
        handler: plugin.im.action.feature.node.menu.onRemoveEvent_,
        metricKey: os.im.action.Metrics.REMOVE
      },
      {
        label: 'Remove Selected',
        eventType: plugin.im.action.feature.node.menu.EventType.REMOVE_SELECTED,
        tooltip: 'Removes selected actions',
        icons: ['<i class="fa fa-fw fa-times"></i>'],
        beforeRender: plugin.im.action.feature.node.menu.visibleIfMultiSelected_,
        handler: plugin.im.action.feature.node.menu.onRemoveSelectedEvent_,
        metricKey: plugin.im.action.feature.Metrics.REMOVE_SELECTED
      },
      {
        label: 'Toggle On',
        eventType: plugin.im.action.feature.node.menu.EventType.TOGGLE_ON,
        tooltip: 'Toggles the actions on',
        icons: ['<i class="fa fa-fw fa-check-square-o"></i>'],
        beforeRender: plugin.im.action.feature.node.menu.visibleIfCanToggleOn_,
        handler: plugin.im.action.feature.node.menu.onToggleOnEvent_,
        metricKey: plugin.im.action.feature.Metrics.TOGGLE_ON
      },
      {
        label: 'Toggle Off',
        eventType: plugin.im.action.feature.node.menu.EventType.TOGGLE_OFF,
        tooltip: 'Toggles the actions off',
        icons: ['<i class="fa fa-fw fa-square-o"></i>'],
        beforeRender: plugin.im.action.feature.node.menu.visibleIfCanToggleOff_,
        handler: plugin.im.action.feature.node.menu.onToggleOffEvent_,
        metricKey: plugin.im.action.feature.Metrics.TOGGLE_OFF
      }]
    }));
  }
};


/**
 * Disposes feature action node menu
 */
plugin.im.action.feature.node.menu.dispose = function() {
  goog.dispose(plugin.im.action.feature.node.menu.MENU);
  plugin.im.action.feature.node.menu.MENU = undefined;
};


/**
 * Show the feature action node menu item.
 * @param {os.ui.menu.layer.Context} context The menu context.
 * @private
 * @this {os.ui.menu.MenuItem}
 */
plugin.im.action.feature.node.menu.visibleIfSelected_ = function(context) {
  this.visible = false;
  if (context && context.length >= 1) {
    this.visible = true;
  }
};


/**
 * Show the feature action node menu item if a single item is selected.
 * @param {os.ui.menu.layer.Context} context The menu context.
 * @private
 * @this {os.ui.menu.MenuItem}
 */
plugin.im.action.feature.node.menu.visibleIfOneSelected_ = function(context) {
  this.visible = false;
  if (context && context.length == 1) {
    this.visible = true;
  }
};


/**
 * Show the feature action node menu item if multiple items are selected.
 * @param {os.ui.menu.layer.Context} context The menu context.
 * @private
 * @this {os.ui.menu.MenuItem}
 */
plugin.im.action.feature.node.menu.visibleIfMultiSelected_ = function(context) {
  this.visible = false;
  if (context && context.length > 1) {
    this.visible = true;
  }
};


/**
 * Show the feature action node menu item if can toggle it on.
 * @param {os.ui.menu.layer.Context} context The menu context.
 * @private
 * @this {os.ui.menu.MenuItem}
 */
plugin.im.action.feature.node.menu.visibleIfCanToggleOn_ = function(context) {
  this.visible = false;
  if (context && context.length == 1) {
    if (context[0].getState() == os.structs.TriState.ON) {
      this.visible = false;
    } else {
      this.visible = true;
    }
  } else if (context && context.length > 1) {
    for (var i = 0; i < context.length; i++) {
      if (context[i].getState() == os.structs.TriState.OFF) {
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
plugin.im.action.feature.node.menu.visibleIfCanToggleOff_ = function(context) {
  this.visible = false;
  if (context && context.length == 1) {
    if (context[0].getState() == os.structs.TriState.OFF) {
      this.visible = false;
    } else {
      this.visible = true;
    }
  } else if (context && context.length > 1) {
    for (var i = 0; i < context.length; i++) {
      if (context[i].getState() == os.structs.TriState.ON) {
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
plugin.im.action.feature.node.menu.onCopyEvent_ = function(event) {
  var context = event.getContext();
  if (context && context.length == 1) {
    var entry = /** @type {os.im.action.FilterActionEntry} */ (context[0].getEntry());
    if (entry) {
      var cmd = os.im.action.filter.copyEntryCmd(entry);
      os.commandStack.addCommand(cmd);
    }
  } else if (context && context.length > 1) {
    var cpCmds = [];
    for (var i = 0; i < context.length; i++) {
      var entry = /** @type {os.im.action.FilterActionEntry} */ (context[i].getEntry());
      if (entry) {
        var cpCmd = os.im.action.filter.copyEntryCmd(entry);
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
plugin.im.action.feature.node.menu.onEditEvent_ = function(event) {
  var context = event.getContext();
  if (context && context.length == 1) {
    var entry = /** @type {os.im.action.FilterActionEntry} */ (context[0].getEntry());
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
plugin.im.action.feature.node.menu.onExportEvent_ = function(event) {
  var context = event.getContext();
  if (context && context.length >= 1) {
    var entries = [];
    var selected = [];
    var exportName;
    for (var i = 0; i < context.length; i++) {
      var entry = /** @type {os.im.action.FilterActionEntry} */ (context[i].getEntry());
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
plugin.im.action.feature.node.menu.onRemoveEvent_ = function(event) {
  var context = event.getContext();
  if (context && context.length == 1) {
    var entry = /** @type {os.im.action.FilterActionEntry} */ (context[0].getEntry());
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
plugin.im.action.feature.node.menu.onRemoveSelectedEvent_ = function(event) {
  var context = event.getContext();
  if (context && context.length > 1) {
    var rmCmds = [];
    for (var i = 0; i < context.length; i++) {
      var entry = /** @type {os.im.action.FilterActionEntry} */ (context[i].getEntry());
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
plugin.im.action.feature.node.menu.onToggleOnEvent_ = function(event) {
  var context = event.getContext();
  if (context && context.length >= 1) {
    for (var i = 0; i < context.length; i++) {
      context[i].setState(os.structs.TriState.ON);
    }
  }
};


/**
 * Handle the Toggle Off menu event from the feature action node menu.
 * @param {!os.ui.menu.MenuEvent<os.ui.menu.layer.Context>} event The menu event.
 * @private
 */
plugin.im.action.feature.node.menu.onToggleOffEvent_ = function(event) {
  var context = event.getContext();
  if (context && context.length >= 1) {
    for (var i = 0; i < context.length; i++) {
      context[i].setState(os.structs.TriState.OFF);
    }
  }
};

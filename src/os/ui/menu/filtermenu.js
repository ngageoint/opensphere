goog.provide('os.ui.menu.filter');

goog.require('os.MapContainer');
goog.require('os.action.EventType');
goog.require('os.command.FilterEnable');
goog.require('os.command.ParallelCommand');
goog.require('os.command.SequenceCommand');
goog.require('os.ui.filter.FilterEvent');
goog.require('os.ui.filter.ui.filterExportDirective');
goog.require('os.ui.menu.Menu');
goog.require('os.ui.menu.MenuItem');
goog.require('os.ui.menu.MenuItemType');
goog.require('os.ui.query');
goog.require('os.ui.query.cmd.FilterRemove');
goog.require('os.ui.query.cmd.QueryEntries');


/**
 * @type {os.ui.menu.Menu<!Array<!os.structs.TreeNode>>}
 */
os.ui.menu.FILTER = new os.ui.menu.Menu(new os.ui.menu.MenuItem({
  type: os.ui.menu.MenuItemType.ROOT,
  children: [{
    label: 'Show',
    eventType: os.action.EventType.ENABLE,
    tooltip: 'Shows the filter',
    icons: ['<i class="fa fa-fw fa-check-square-o"></i>'],
    sort: 0
  }, {
    label: 'Hide',
    eventType: os.action.EventType.DISABLE,
    tooltip: 'Hides the filter',
    icons: ['<i class="fa fa-fw fa-square-o"></i>'],
    sort: 10
  }, {
    label: 'Turn filter on',
    eventType: os.action.EventType.APPLY,
    tooltip: 'Apply the filter to all areas for the query',
    icons: ['<i class="fa fa-fw fa-filter"></i>'],
    sort: 20
  }, {
    label: 'Turn filter off',
    eventType: os.action.EventType.UNAPPLY,
    tooltip: 'Remove the filter from all areas for the query',
    icons: ['<i class="fa fa-fw fa-ban"></i>'],
    sort: 30
  }, {
    label: 'Remove',
    eventType: os.action.EventType.REMOVE_FILTER,
    tooltip: 'Removes the filter',
    icons: ['<i class="fa fa-fw fa-times"></i>'],
    sort: 40
  }, {
    label: 'Export Filter',
    eventType: os.action.EventType.EXPORT,
    tooltip: 'Export the filter',
    icons: ['<i class="fa fa-fw fa-download"></i>'],
    sort: 50
  }]
}));


/**
 * Sets up the dynamic portions of the menu
 */
os.ui.menu.filter.setup = function() {
  var menu = os.ui.menu.FILTER;

  var genVisible = os.ui.menu.filter.genVisibility;
  var show = menu.getRoot().find(os.action.EventType.ENABLE);
  if (show) {
    show.beforeRender = genVisible(os.ui.menu.filter.hasDisabled_);
  }

  var hide = menu.getRoot().find(os.action.EventType.DISABLE);
  if (hide) {
    hide.beforeRender = genVisible(os.ui.menu.filter.hasEnabled_);
  }

  var apply = menu.getRoot().find(os.action.EventType.APPLY);
  if (apply) {
    apply.beforeRender = genVisible(os.ui.menu.filter.hasUnapplied_);
  }

  var unapply = menu.getRoot().find(os.action.EventType.UNAPPLY);
  if (unapply) {
    unapply.beforeRender = genVisible(os.ui.menu.filter.hasApplied_);
  }

  var ex = menu.getRoot().find(os.action.EventType.EXPORT);
  if (ex) {
    ex.beforeRender = genVisible(os.ui.menu.filter.isFilter_);
  }

  var remove = menu.getRoot().find(os.action.EventType.REMOVE_FILTER);
  if (remove) {
    remove.beforeRender = genVisible(os.ui.menu.filter.isFilter_);
  }

  menu.listen(os.action.EventType.ENABLE, os.ui.menu.filter.onFilter_);
  menu.listen(os.action.EventType.DISABLE, os.ui.menu.filter.onFilter_);
  menu.listen(os.action.EventType.APPLY, os.ui.menu.filter.onFilter_);
  menu.listen(os.action.EventType.UNAPPLY, os.ui.menu.filter.onFilter_);
  menu.listen(os.action.EventType.REMOVE_FILTER, os.ui.menu.filter.onFilter_);
  menu.listen(os.action.EventType.EXPORT, os.ui.menu.filter.onFilter_);
};


/**
 * Creates a function which modifies the menu item visibility before render
 * @param {function(Array<!os.structs.TreeNode>):boolean} func The visibility function
 * @return {function(this:os.ui.menu.MenuItem, Array<!os.structs.TreeNode>)}
 */
os.ui.menu.filter.genVisibility = function(func) {
  /**
   * @param {Array<!os.structs.TreeNode>} nodes
   * @this {os.ui.menu.MenuItem}
   */
  var visibility = function(nodes) {
    this.visible = func(nodes);
  };

  return visibility;
};


/**
 * Disposes filter menu
 */
os.ui.menu.filter.dispose = function() {
  if (os.ui.menu.FILTER) {
    os.ui.menu.FILTER.dispose();
  }
};


/**
 * @param {Array<!os.structs.TreeNode>} nodes
 * @return {Array<!os.filter.FilterEntry>}
 */
os.ui.menu.filter.getFilters = function(nodes) {
  var filters = [];
  if (nodes) {
    for (var i = 0, n = nodes.length; i < n; i++) {
      var node = nodes[i];

      if (node instanceof os.data.FilterNode) {
        filters.push(/** @type {os.data.FilterNode} */ (node).getEntry());
      } else {
        filters = filters.concat(os.ui.menu.filter.getFilters(node.getChildren()));
      }
    }

    goog.array.removeDuplicates(filters);
  }

  return filters;
};


/**
 * Determin if the layer is on
 * @param {string} layerId
 * @return {boolean}
 * @private
 */
os.ui.menu.filter.layerOn_ = function(layerId) {
  return goog.isDefAndNotNull(os.MapContainer.getInstance().getLayer(layerId));
};



/**
 * @param {Array<!os.structs.TreeNode>} context
 * @return {boolean}
 * @private
 */
os.ui.menu.filter.hasEnabled_ = function(context) {
  var filters = os.ui.menu.filter.getFilters(context);
  for (var i = 0, n = filters.length; i < n; i++) {
    if (filters[i].isEnabled() && os.ui.menu.filter.layerOn_(filters[i].getType())) {
      return true;
    }
  }

  return false;
};


/**
 * @param {Array<!os.structs.TreeNode>} context
 * @return {boolean}
 * @private
 */
os.ui.menu.filter.hasDisabled_ = function(context) {
  var filters = os.ui.menu.filter.getFilters(context);
  for (var i = 0, n = filters.length; i < n; i++) {
    if (!filters[i].isEnabled() && os.ui.menu.filter.layerOn_(filters[i].getType())) {
      return true;
    }
  }

  return false;
};


/**
 * @param {Array<!os.structs.TreeNode>} context
 * @return {boolean}
 * @private
 */
os.ui.menu.filter.hasApplied_ = function(context) {
  var filters = os.ui.menu.filter.getFilters(context);
  for (var i = 0, n = filters.length; i < n; i++) {
    if (os.ui.queryManager.hasFilter(filters[i].getId()) && os.ui.menu.filter.layerOn_(filters[i].getType())) {
      return true;
    }
  }

  return false;
};


/**
 * @param {Array<!os.structs.TreeNode>} context
 * @return {boolean}
 * @private
 */
os.ui.menu.filter.hasUnapplied_ = function(context) {
  var filters = os.ui.menu.filter.getFilters(context);
  for (var i = 0, n = filters.length; i < n; i++) {
    if (!os.ui.queryManager.hasFilter(filters[i].getId()) &&
        filters[i].isEnabled() &&
        os.ui.menu.filter.layerOn_(filters[i].getType())) {
      return true;
    }
  }

  return false;
};


/**
 * @param {Array<!os.structs.TreeNode>} context
 * @return {boolean}
 * @private
 */
os.ui.menu.filter.isFilter_ = function(context) {
  var filters = os.ui.menu.filter.getFilters(context);
  return (filters.length > 0);
};


/**
 * Remove all entries for these filters
 * @param {Array<!os.filter.FilterEntry>} filters
 * @return {os.ui.query.cmd.QueryEntries}
 */
os.ui.menu.filter.fixEntries = function(filters) {
  var allEntries = os.ui.queryManager.getEntries(null, null, null, false);

  // Remove the entry for this filter if it exists
  goog.array.forEach(filters, function(filter) {
    var entries = os.ui.queryManager.getEntries(null, null, filter.getId(), false);
    goog.array.forEach(entries, function(entry) {
      goog.array.remove(allEntries, entry);
    });
  });

  return new os.ui.query.cmd.QueryEntries(allEntries, false, undefined, true);
};


/**
 * @param {os.ui.menu.MenuEvent<Array<!os.structs.TreeNode>>} event The menu event
 * @private
 */
os.ui.menu.filter.onFilter_ = function(event) {
  var context = event.getContext();

  if (context) {
    var cmds = [];
    var title = '';
    var filters = os.ui.menu.filter.getFilters(context);

    switch (event.type) {
      case os.action.EventType.DISABLE:
        title = 'Disable filter';
        for (var i = 0, n = filters.length; i < n; i++) {
          cmds.push(new os.command.FilterEnable(filters[i], false));
        }
        break;
      case os.action.EventType.REMOVE_FILTER:
        title = 'Remove filter';
        for (var i = 0, n = filters.length; i < n; i++) {
          cmds.push(new os.ui.query.cmd.FilterRemove(filters[i]));
        }
        break;
      case os.action.EventType.EXPORT:
        event.preventDefault();
        event.stopPropagation();
        os.ui.filterManager.dispatchEvent(new os.ui.filter.FilterEvent(
            os.ui.filter.FilterEventType.EXPORT_FILTER));
        break;
      case os.action.EventType.ENABLE:
      case os.action.EventType.APPLY:
        var entries = [];
        for (var i = 0, n = filters.length; i < n; i++) {
          var filter = filters[i];

          // If the filter is already enabled, dont re-enable (messes up undo)
          if (!filter.isEnabled()) {
            cmds.push(new os.command.FilterEnable(filter, true));
            title = 'Enable and turn on filter';
          } else {
            title = 'Turn on filter';
          }

          // The merge removes all entries for a layerid, so get those first
          entries = entries.concat(os.ui.queryManager.getEntries(filter.getType()));

          // Wipe out old entries and set wildcards
          var entry = {
            'layerId': filter.getType(),
            'areaId': '*',
            'filterId': filter.getId(),
            'includeArea': true,
            'filterGroup': true
          };
          entries.push(entry);
        }
        goog.array.removeDuplicates(entries, undefined, function(filter) {
          return JSON.stringify(filter);
        });
        cmds.push(new os.ui.query.cmd.QueryEntries(entries, true, os.ui.query.ALL_ID, true));
        break;
      case os.action.EventType.UNAPPLY:
        title = 'Turn off filter';
        var allEntries = os.ui.queryManager.getEntries();
        var removeEntries = [];
        for (var i = 0, n = filters.length; i < n; i++) {
          var filter = filters[i];
          removeEntries = removeEntries.concat(os.ui.queryManager.getEntries(null, null, filter.getId()));
        }
        goog.array.removeDuplicates(removeEntries, undefined, function(filter) {
          return JSON.stringify(filter);
        });
        goog.array.forEach(removeEntries, function(entry) {
          goog.array.remove(allEntries, entry);
        });

        cmds.push(new os.ui.query.cmd.QueryEntries(allEntries, false, os.ui.query.ALL_ID, true));
        break;
      default:
        break;
    }

    if (cmds.length > 0) {
      var cmd = new os.command.SequenceCommand();
      cmd.setCommands(cmds);
      cmd.title = title + (cmds.length > 1 ? 's' : '');
      os.command.CommandProcessor.getInstance().addCommand(cmd);
    }
  }
};

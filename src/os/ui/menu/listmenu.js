goog.provide('os.ui.menu.list');

goog.require('os.command.FeaturesVisibility');
goog.require('os.command.InvertSelect');
goog.require('os.command.SelectAll');
goog.require('os.command.SelectNone');
goog.require('os.feature');
goog.require('os.fn');
goog.require('os.instanceOf');
goog.require('os.ui.menu.Menu');
goog.require('os.ui.menu.MenuItem');
goog.require('os.ui.menu.MenuItemType');
goog.require('os.ui.menu.feature');


/**
 * Prefix used on feature list events.
 * @type {string}
 * @const
 */
os.ui.menu.list.PREFIX = 'featureList::';


/**
 * RegExp to remove prefix from feature list events.
 * @type {RegExp}
 * @const
 */
os.ui.menu.list.PREFIX_REGEXP = /^.*?::/;


/**
 * The feature list menu.
 * @type {os.ui.menu.Menu}
 */
os.ui.menu.list.MENU = null;


/**
 * Sets up the feature list menu.
 */
os.ui.menu.list.setup = function() {
  os.ui.menu.list.MENU = new os.ui.menu.Menu(new os.ui.menu.MenuItem({
    type: os.ui.menu.MenuItemType.ROOT,
    children: [{
      label: os.ui.menu.feature.GroupLabel.SELECT,
      type: os.ui.menu.MenuItemType.GROUP,
      sort: 0,
      children: [{
        label: 'Sort Selected',
        eventType: os.action.EventType.SORT_SELECTED,
        tooltip: 'Sorts by the selected items',
        icons: ['<i class="fa fa-fw fa-sort"></i>'],
        handler: os.ui.menu.list.onSortSelected,
        beforeRender: os.ui.menu.list.visibleIfHasSelected,
        metricKey: os.metrics.FeatureList.SORT_SELECTED,
        sort: 4
      }]
    }, {
      label: os.ui.menu.feature.GroupLabel.TOOLS,
      type: os.ui.menu.MenuItemType.GROUP,
      sort: 10,
      children: [{
        label: 'Export...',
        eventType: os.action.EventType.EXPORT,
        tooltip: 'Exports data to a file',
        icons: ['<i class="fa fa-fw fa-download"></i>'],
        beforeRender: os.ui.menu.list.canExport,
        handler: os.ui.menu.list.onExport,
        metricKey: os.metrics.FeatureList.EXPORT
      }, {
        label: 'Go To',
        eventType: os.action.EventType.GOTO,
        tooltip: 'Repositions the map to display features at this level of the tree',
        icons: ['<i class="fa fa-fw fa-fighter-jet"></i>'],
        beforeRender: os.ui.menu.list.visibleIfHasSelected,
        handler: os.ui.menu.list.handleListEvent,
        metricKey: os.metrics.FeatureList.GOTO
      }]
    }]
  }));

  os.ui.menu.feature.addFeatureItems(os.ui.menu.list.MENU, os.ui.menu.list.PREFIX, os.ui.menu.list.handleListEvent);
};


/**
 * Disposes the feature list menu.
 */
os.ui.menu.list.dispose = function() {
  goog.dispose(os.ui.menu.list.MENU);
  os.ui.menu.list.MENU = null;
};


/**
 * Handle list menu event
 * @param {os.ui.menu.MenuEvent} event The menu event.
 */
os.ui.menu.list.handleListEvent = function(event) {
  var source = event ? /** @type {os.source.ISource} */ (event.getContext()) : undefined;
  if (source) {
    var cmd;
    var eventType = event.type.replace(os.ui.menu.list.PREFIX_REGEXP, '');
    switch (eventType) {
      case os.action.EventType.SELECT:
        // omit selection events from the stack to reduce clutter
        new os.command.SelectAll(source.getId()).execute();
        os.metrics.Metrics.getInstance().updateMetric(os.metrics.FeatureList.SELECT_ALL, 1);
        break;
      case os.action.EventType.DESELECT:
        // omit selection events from the stack to reduce clutter
        new os.command.SelectNone(source.getId()).execute();
        os.metrics.Metrics.getInstance().updateMetric(os.metrics.FeatureList.DESELECT_ALL, 1);
        break;
      case os.action.EventType.INVERT:
        // omit selection events from the stack to reduce clutter
        new os.command.InvertSelect(source.getId()).execute();
        os.metrics.Metrics.getInstance().updateMetric(os.metrics.FeatureList.INVERT_SELECTION, 1);
        break;
      case os.action.EventType.HIDE_SELECTED:
        var selected = source.getSelectedItems();
        if (selected.length > 0) {
          cmd = new os.command.FeaturesVisibility(source.getId(), selected, false);
        }
        break;
      case os.action.EventType.HIDE_UNSELECTED:
        var unselected = source.getUnselectedItems();
        if (unselected.length > 0) {
          cmd = new os.command.FeaturesVisibility(source.getId(), unselected, false);
        }
        break;
      case os.action.EventType.DISPLAY_ALL:
        var hidden = source.getHiddenItems();
        if (hidden.length > 0) {
          cmd = new os.command.FeaturesVisibility(source.getId(), hidden, true);
        }
        break;
      case os.action.EventType.REMOVE:
        var selected = source.getSelectedItems();
        if (selected.length > 0) {
          os.feature.removeFeatures(source.getId(), selected);
        }
        break;
      case os.action.EventType.REMOVE_UNSELECTED:
        var unselected = source.getUnselectedItems();
        if (unselected.length > 0) {
          os.feature.removeFeatures(source.getId(), unselected);
        }
        break;
      case os.action.EventType.GOTO:
        var selected = source.getSelectedItems();
        if (selected.length > 0) {
          os.feature.flyTo(selected);
        }
        break;
      default:
        break;
    }

    if (cmd) {
      os.command.CommandProcessor.getInstance().addCommand(cmd);
    }
  }
};


/**
 * Handle the "Export" menu event.
 * @param {os.ui.menu.MenuEvent} event The menu event.
 */
os.ui.menu.list.onExport = function(event) {
  var context = event.getContext();
  if (os.instanceOf(context, os.source.Vector.NAME)) {
    var source = /** @type {!os.source.Vector} */ (context);
    os.ui.ex.startExport([source]);
  }
};


/**
 * Handle the "Sort Selected" menu event.
 * @param {os.ui.menu.MenuEvent} event The menu event.
 */
os.ui.menu.list.onSortSelected = function(event) {
  var target = /** @type {os.ui.slick.SlickGridCtrl} */ (event.target);
  if (target && target.onSortBySelectionChange) {
    target.onSortBySelectionChange();
  }
};


/**
 * @param {os.source.Vector} context
 * @this {os.ui.menu.MenuItem}
 */
os.ui.menu.list.canExport = function(context) {
  this.visible = false;

  if (os.instanceOf(context, os.source.Vector.NAME)) {
    var source = /** @type {!os.source.Vector} */ (context);
    var selected = source.getSelectedItems();
    var items = selected.length > 0 ? selected : source.getFilteredFeatures();
    this.visible = !!items && items.length > 0;
  }
};


/**
 * If a menu context is a vector source with a selection.
 * @param {*} context The menu context.
 * @return {boolean} If the source has a selection.
 */
os.ui.menu.list.hasSelected = function(context) {
  if (os.instanceOf(context, os.source.Vector.NAME)) {
    var source = /** @type {!os.source.Vector} */ (context);
    var selected = source.getSelectedItems();
    return !!selected && selected.length > 0;
  }

  return false;
};


/**
 * Shows a menu item if the menu context is a vector source with a selection.
 * @param {*} context The menu context.
 * @this {os.ui.menu.MenuItem}
 */
os.ui.menu.list.visibleIfHasSelected = function(context) {
  this.visible = os.ui.menu.list.hasSelected(context);
};

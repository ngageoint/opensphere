goog.module('os.ui.menu.list');
goog.module.declareLegacyNamespace();

const googDispose = goog.require('goog.dispose');
const EventType = goog.require('os.action.EventType');
const {instanceOf} = goog.require('os.classRegistry');
const CommandProcessor = goog.require('os.command.CommandProcessor');
const FeaturesVisibility = goog.require('os.command.FeaturesVisibility');
const ColorMethod = goog.require('os.data.histo.ColorMethod');
const {flyTo, getFirstColor, removeFeatures} = goog.require('os.feature');
const Metrics = goog.require('os.metrics.Metrics');
const {FeatureList: FeatureListKeys} = goog.require('os.metrics.keys');
const VectorSource = goog.require('os.source.Vector');
const {toRgbaString} = goog.require('os.style');
const ExportUI = goog.require('os.ui.ex.ExportUI');
const Menu = goog.require('os.ui.menu.Menu');
const MenuItem = goog.require('os.ui.menu.MenuItem');
const MenuItemType = goog.require('os.ui.menu.MenuItemType');
const {GroupLabel, addFeatureItems} = goog.require('os.ui.menu.feature');
const ConfirmColorUI = goog.require('os.ui.window.ConfirmColorUI');

const ISource = goog.requireType('os.source.ISource');
const MenuEvent = goog.requireType('os.ui.menu.MenuEvent');
const SlickGridUI = goog.requireType('os.ui.slick.SlickGridUI');


/**
 * Prefix used on feature list events.
 * @type {string}
 */
const PREFIX = 'featureList::';

/**
 * RegExp to remove prefix from feature list events.
 * @type {RegExp}
 */
const PREFIX_REGEXP = /^.*?::/;

/**
 * The feature list menu.
 * @type {Menu}
 */
let MENU = null;

/**
 * Get the menu.
 * @return {Menu}
 */
const getMenu = () => MENU;

/**
 * Set the menu.
 * @param {Menu} menu The menu.
 */
const setMenu = (menu) => {
  MENU = menu;
};

/**
 * menu list strings
 * @enum {string}
 */
const Strings = {
  COLOR_RESET_LABEL: 'Reset Color',
  COLOR_RESET_TOOLTIP: 'Reset all item(s) to the default color from the Layer\'s Style',
  COLOR_SELECTED_LABEL: 'Color Selected',
  COLOR_SELECTED_TOOLTIP: 'Choose a color for the selected item(s)'
};

/**
 * Sets up the feature list menu.
 */
const setup = function() {
  MENU = new Menu(new MenuItem({
    type: MenuItemType.ROOT,
    children: [{
      label: GroupLabel.SELECT,
      type: MenuItemType.GROUP,
      sort: 0,
      children: [{
        label: 'Sort Selected',
        eventType: EventType.SORT_SELECTED,
        tooltip: 'Sorts by the selected items',
        icons: ['<i class="fa fa-fw fa-sort"></i>'],
        handler: onSortSelected,
        beforeRender: visibleIfHasSelected,
        metricKey: FeatureListKeys.SORT_SELECTED,
        sort: 4
      }]
    }, {
      label: GroupLabel.COLOR,
      type: MenuItemType.GROUP,
      sort: 3,
      children: [{
        label: Strings.COLOR_SELECTED_LABEL,
        eventType: EventType.COLOR_SELECTED,
        tooltip: Strings.COLOR_SELECTED_TOOLTIP,
        icons: ['<i class="fa fa-fw fa-tint"></i>'],
        handler: onColorSelected,
        metricKey: FeatureListKeys.COLOR_SELECTED,
        beforeRender: visibleIfHasSelected,
        sort: 0
      }, {
        label: Strings.COLOR_RESET_LABEL,
        eventType: EventType.RESET_COLOR,
        tooltip: Strings.COLOR_RESET_TOOLTIP,
        icons: ['<i class="fa fa-fw fa-tint"></i>'],
        handler: onResetColor,
        metricKey: FeatureListKeys.RESET_COLOR,
        sort: 10
      }]
    }, {
      label: GroupLabel.TOOLS,
      type: MenuItemType.GROUP,
      sort: 10,
      children: [{
        label: 'Export...',
        eventType: EventType.EXPORT,
        tooltip: 'Exports data to a file',
        icons: ['<i class="fa fa-fw fa-download"></i>'],
        beforeRender: canExport,
        handler: onExport,
        metricKey: FeatureListKeys.EXPORT
      }, {
        label: 'Go To',
        eventType: EventType.GOTO,
        tooltip: 'Repositions the map to display features at this level of the tree',
        icons: ['<i class="fa fa-fw fa-fighter-jet"></i>'],
        beforeRender: visibleIfHasSelected,
        handler: handleListEvent,
        metricKey: FeatureListKeys.GOTO
      }]
    }]
  }));

  addFeatureItems(MENU, PREFIX, handleListEvent);
};

/**
 * Disposes the feature list menu.
 */
const dispose = function() {
  googDispose(MENU);
  MENU = null;
};

/**
 * Handle list menu event
 *
 * @param {MenuEvent} event The menu event.
 */
const handleListEvent = function(event) {
  var source = event ? /** @type {ISource} */ (event.getContext()) : undefined;
  if (source) {
    var cmd;
    var eventType = event.type.replace(PREFIX_REGEXP, '');
    switch (eventType) {
      case EventType.SELECT:
        // don't create and execute a command if it's simple and we don't want it on the stack
        source.selectAll();
        Metrics.getInstance().updateMetric(FeatureListKeys.SELECT_ALL, 1);
        break;
      case EventType.DESELECT:
        // don't create and execute a command if it's simple and we don't want it on the stack
        source.selectNone();
        Metrics.getInstance().updateMetric(FeatureListKeys.DESELECT_ALL, 1);
        break;
      case EventType.INVERT:
        // don't create and execute a command if it's simple and we don't want it on the stack
        /** @type {VectorSource} */ (source).invertSelection();
        Metrics.getInstance().updateMetric(FeatureListKeys.INVERT_SELECTION, 1);
        break;
      case EventType.HIDE_SELECTED:
        var selected = source.getSelectedItems();
        if (selected.length > 0) {
          cmd = new FeaturesVisibility(source.getId(), selected, false);
        }
        break;
      case EventType.HIDE_UNSELECTED:
        var unselected = source.getUnselectedItems();
        if (unselected.length > 0) {
          cmd = new FeaturesVisibility(source.getId(), unselected, false);
        }
        break;
      case EventType.DISPLAY_ALL:
        var hidden = source.getHiddenItems();
        if (hidden.length > 0) {
          cmd = new FeaturesVisibility(source.getId(), hidden, true);
        }
        break;
      case EventType.REMOVE:
        var selected = source.getSelectedItems();
        if (selected.length > 0) {
          removeFeatures(source.getId(), selected);
        }
        break;
      case EventType.REMOVE_UNSELECTED:
        var unselected = source.getUnselectedItems();
        if (unselected.length > 0) {
          removeFeatures(source.getId(), unselected);
        }
        break;
      case EventType.GOTO:
        var selected = source.getSelectedItems();
        if (selected.length > 0) {
          flyTo(selected);
        }
        break;
      default:
        break;
    }

    if (cmd) {
      CommandProcessor.getInstance().addCommand(cmd);
    }
  }
};

/**
 * Handle the "Export" menu event.
 *
 * @param {MenuEvent} event The menu event.
 */
const onExport = function(event) {
  var context = event.getContext();
  if (instanceOf(context, VectorSource.NAME)) {
    var source = /** @type {!VectorSource} */ (context);
    ExportUI.startExport([source]);
  }
};

/**
 * Handle the "Sort Selected" menu event.
 *
 * @param {MenuEvent} event The menu event.
 */
const onSortSelected = function(event) {
  var target = /** @type {SlickGridUI.Controller} */ (event.target);
  if (target && target.onSortBySelectionChange) {
    target.onSortBySelectionChange();
  }
};

/**
 * Handle the "Color Selected" menu event.
 *
 * @param {MenuEvent} event The menu event.
 */
const onColorSelected = function(event) {
  var context = event.getContext();
  if (instanceOf(context, VectorSource.NAME)) {
    var source = /** @type {!VectorSource} */ (context);
    if (source && source.getSelectedItems()) {
      var items = source.getSelectedItems();

      // call the confirm window from this context so it doesn't appear in the wrong tab
      ConfirmColorUI.launchConfirmColor(function(color) {
        source.setColor(items, toRgbaString(color));
      }, getFirstColor(items));
    }
  }
};

/**
 * Handle the "Color Selected" menu event.
 *
 * @param {MenuEvent} event The menu event.
 */
const onResetColor = function(event) {
  var context = event.getContext();
  if (instanceOf(context, VectorSource.NAME)) {
    var source = /** @type {!VectorSource} */ (context);
    if (source) {
      var cm = source.getColorModel();
      if (cm) {
        cm.setColorMethod(ColorMethod.RESET);
      } else {
        source.setColorModel(null);
      }
    }
  }
};

/**
 * @param {VectorSource} context
 * @this {MenuItem}
 */
const canExport = function(context) {
  this.visible = false;

  if (instanceOf(context, VectorSource.NAME)) {
    var source = /** @type {!VectorSource} */ (context);
    var selected = source.getSelectedItems();
    var items = selected.length > 0 ? selected : source.getFilteredFeatures();
    this.visible = !!items && items.length > 0;
  }
};

/**
 * If a menu context is a vector source with a selection.
 *
 * @param {*} context The menu context.
 * @return {boolean} If the source has a selection.
 */
const hasSelected = function(context) {
  if (instanceOf(context, VectorSource.NAME)) {
    var source = /** @type {!VectorSource} */ (context);
    var selected = source.getSelectedItems();
    return !!selected && selected.length > 0;
  }

  return false;
};

/**
 * Shows a menu item if the menu context is a vector source with a selection.
 *
 * @param {*} context The menu context.
 * @this {MenuItem}
 */
const visibleIfHasSelected = function(context) {
  this.visible = hasSelected(context);
};

exports = {
  PREFIX,
  PREFIX_REGEXP,
  getMenu,
  setMenu,
  Strings,
  setup,
  dispose,
  handleListEvent,
  onExport,
  onSortSelected,
  onColorSelected,
  onResetColor,
  canExport,
  hasSelected,
  visibleIfHasSelected
};

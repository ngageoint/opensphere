goog.module('os.ui.menu.map');

const googDispose = goog.require('goog.dispose');
const dispatcher = goog.require('os.Dispatcher');
const EventType = goog.require('os.action.EventType');
const DisplaySetting = goog.require('os.config.DisplaySetting');
const Settings = goog.require('os.config.Settings');
const DataManager = goog.require('os.data.DataManager');
const legend = goog.require('os.legend');
const {getMapContainer} = goog.require('os.map.instance');
const {hasTerrain} = goog.require('os.map.terrain');
const {Map: MapKeys} = goog.require('os.metrics.keys');
const VectorSource = goog.require('os.source.Vector');
const UIEvent = goog.require('os.ui.events.UIEvent');
const UIEventType = goog.require('os.ui.events.UIEventType');
const Menu = goog.require('os.ui.menu.Menu');
const MenuItem = goog.require('os.ui.menu.MenuItem');
const MenuItemType = goog.require('os.ui.menu.MenuItemType');
const ConfirmColorUI = goog.require('os.ui.window.ConfirmColorUI');

const MenuEvent = goog.requireType('os.ui.menu.MenuEvent');


/**
 * @type {Menu<ol.Coordinate>|undefined}
 */
let MENU = undefined;

/**
 * Get the menu.
 * @return {Menu<ol.Coordinate>|undefined}
 */
const getMenu = () => MENU;

/**
 * Set the menu.
 * @param {Menu<ol.Coordinate>|undefined} menu The menu.
 */
const setMenu = (menu) => {
  MENU = menu;
};

/**
 * Sort value used for each map menu group.
 * @enum {number}
 */
const GroupSort = {
  MAP: 0,
  OPTIONS: 5,
  COORDINATE: 10
};

/**
 * Group labels for the map menu.
 * @enum {string}
 */
const GroupLabel = {
  MAP: 'Map',
  OPTIONS: 'Options',
  COORDINATE: 'Coordinate'
};

/**
 * Set up the menu
 */
const setup = function() {
  if (MENU) {
    // already created
    return;
  }

  MENU = new Menu(new MenuItem({
    type: MenuItemType.ROOT,
    children: [{
      label: GroupLabel.MAP,
      type: MenuItemType.GROUP,
      sort: GroupSort.MAP,
      children: [{
        label: 'Reset View',
        eventType: EventType.RESET_VIEW,
        tooltip: 'Resets to the default view',
        icons: ['<i class="fa fa-fw fa-picture-o"></i>'],
        shortcut: 'V',
        sort: 10,
        metricKey: MapKeys.RESET_VIEW_CONTEXT_MENU
      }, {
        label: 'Reset Rotation',
        eventType: EventType.RESET_ROTATION,
        tooltip: 'Resets to the default rotation',
        icons: ['<i class="fa fa-fw fa-compass"></i>'],
        shortcut: 'R',
        sort: 20,
        metricKey: MapKeys.RESET_ROTATION_CONTEXT_MENU
      }, {
        label: 'Toggle 2D/3D View',
        eventType: EventType.TOGGLE_VIEW,
        tooltip: 'Toggle the map view between 2D and 3D views',
        icons: ['<i class="fa fa-fw fa-globe"></i>'],
        sort: 30,
        metricKey: MapKeys.TOGGLE_MODE
      }, {
        label: 'Show Legend',
        eventType: EventType.SHOW_LEGEND,
        tooltip: 'Display the map legend',
        icons: ['<i class="fa fa-fw ' + legend.ICON + '"></i>'],
        sort: 40,
        handler: showLegend,
        metricKey: MapKeys.SHOW_LEGEND_CONTEXT
      }, {
        label: 'Clear Selection',
        eventType: EventType.CLEAR_SELECTION,
        tooltip: 'Clears the selected features across all layers',
        icons: ['<i class="fa fa-fw fa-times-circle"></i>'],
        sort: 50,
        handler: clearSelection,
        metricKey: MapKeys.CLEAR_SELECTION
      }]
    }, {
      label: GroupLabel.OPTIONS,
      type: MenuItemType.GROUP,
      sort: GroupSort.OPTIONS,
      children: [{
        label: 'Background Color',
        eventType: DisplaySetting.BG_COLOR,
        tooltip: 'Change the map background color',
        icons: [],
        beforeRender: updateBGIcon,
        handler: changeColor,
        metricKey: MapKeys.BACKGROUND_COLOR
      }, {
        label: 'Sky',
        eventType: DisplaySetting.ENABLE_SKY,
        type: MenuItemType.CHECK,
        tooltip: 'Show the sky/stars around the 3D globe',
        beforeRender: updateSkyItem,
        handler: onSky
      }, {
        label: 'Terrain',
        eventType: DisplaySetting.ENABLE_TERRAIN,
        type: MenuItemType.CHECK,
        tooltip: 'Show terrain on the 3D globe',
        beforeRender: updateTerrainItem,
        handler: onTerrain
      }]
    }, {
      label: GroupLabel.COORDINATE,
      type: MenuItemType.GROUP,
      visible: false,
      sort: GroupSort.COORDINATE,
      children: [],
      beforeRender: showIfHasCoordinate
    }]
  }));
};

/**
 * Disposes map menu
 */
const dispose = function() {
  googDispose(MENU);
  MENU = undefined;
};

/**
 * Show a menu item if the context is a valid coordinate.
 *
 * @param {ol.Coordinate} coord The coordinate.
 * @this {MenuItem}
 */
const showIfHasCoordinate = function(coord) {
  this.visible = Boolean(coord && coord.length > 1);
};

/**
 * Color the icon for the Background Color menu item.
 *
 * @this {MenuItem}
 */
const updateBGIcon = function() {
  var color = Settings.getInstance().get(DisplaySetting.BG_COLOR, '#000000');
  this.icons[0] = '<i class="fa fa-fw fa-tint" style="color:' + color + '"></i>';
};

/**
 * Show the map legend.
 */
const showLegend = function() {
  var event = new UIEvent(UIEventType.TOGGLE_UI, legend.ID, true, null, MapKeys.SHOW_LEGEND);
  dispatcher.getInstance().dispatchEvent(event);
};

/**
 * Clears selection on all vector sources.
 *
 */
const clearSelection = function() {
  var sources = DataManager.getInstance().getSources();
  for (var i = 0, ii = sources.length; i < ii; i++) {
    var s = sources[i];
    if (s instanceof VectorSource) {
      s.selectNone();
    }
  }
};

/**
 */
const changeColor = function() {
  var color = /** @type {string} */ (Settings.getInstance().get(DisplaySetting.BG_COLOR, '#000000'));
  ConfirmColorUI.launchConfirmColor(onColorChosen, color);
};

/**
 * Handle user selection of the map background color.
 *
 * @param {string} color
 */
const onColorChosen = function(color) {
  Settings.getInstance().set(DisplaySetting.BG_COLOR, color);
};

/**
 * Update the Sky menu item.
 *
 * @this {MenuItem}
 */
const updateSkyItem = function() {
  this.visible = getMapContainer().is3DEnabled();
  this.selected = !!Settings.getInstance().get(DisplaySetting.ENABLE_SKY, false);
};

/**
 * Enable terrain menu option listener.
 *
 * @param {MenuEvent<ol.Coordinate>} event The event.
 * @this {MenuItem}
 */
const onSky = function(event) {
  Settings.getInstance().set(DisplaySetting.ENABLE_SKY, !this.selected);
};

/**
 * Update the Terrain menu item.
 *
 * @this {MenuItem}
 */
const updateTerrainItem = function() {
  this.visible = getMapContainer().is3DEnabled() && hasTerrain();
  this.selected = !!Settings.getInstance().get(DisplaySetting.ENABLE_TERRAIN, false);
};

/**
 * Enable terrain menu option listener.
 *
 * @param {MenuEvent<ol.Coordinate>} event The event.
 * @this {MenuItem}
 */
const onTerrain = function(event) {
  Settings.getInstance().set(DisplaySetting.ENABLE_TERRAIN, !this.selected);
};

exports = {
  getMenu,
  setMenu,
  GroupSort,
  GroupLabel,
  setup,
  dispose,
  showIfHasCoordinate,
  updateBGIcon,
  showLegend,
  updateSkyItem,
  onSky,
  updateTerrainItem,
  onTerrain
};

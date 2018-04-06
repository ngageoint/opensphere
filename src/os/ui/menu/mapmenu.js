goog.provide('os.ui.menu.map');

goog.require('os.action.EventType');
goog.require('os.legend');
goog.require('os.metrics.keys');
goog.require('os.ui.events.UIEvent');
goog.require('os.ui.menu.Menu');
goog.require('os.ui.menu.MenuItem');
goog.require('os.ui.menu.MenuItemType');
goog.require('os.ui.window.confirmColorDirective');

/**
 * @type {os.ui.menu.Menu<ol.Coordinate>|undefined}
 */
os.ui.menu.MAP = undefined;


/**
 * @type {string}
 * @const
 */
os.ui.menu.map.MAP_BG_COLOR_ = 'mapBGColor';


/**
 * @type {string}
 * @const
 */
os.ui.menu.map.BG_COLOR_ = 'bgColor';


/**
 * Set up the menu
 */
os.ui.menu.map.setup = function() {
  if (os.ui.menu.MAP) {
    // already created
    return;
  }

  os.ui.menu.MAP = new os.ui.menu.Menu(new os.ui.menu.MenuItem({
    type: os.ui.menu.MenuItemType.ROOT,
    children: [{
      label: 'Map',
      type: os.ui.menu.MenuItemType.GROUP,
      children: [{
        label: 'Reset View',
        eventType: os.action.EventType.RESET_VIEW,
        tooltip: 'Resets to the default view',
        icons: ['<i class="fa fa-fw fa-picture-o"></i>'],
        shortcut: 'V',
        sort: 10,
        metricKey: os.metrics.keys.Map.RESET_VIEW_CONTEXT_MENU
      }, {
        label: 'Reset Rotation',
        eventType: os.action.EventType.RESET_ROTATION,
        tooltip: 'Resets to the default rotation',
        icons: ['<i class="fa fa-fw fa-compass"></i>'],
        shortcut: 'R',
        sort: 20,
        metricKey: os.metrics.keys.Map.RESET_ROTATION_CONTEXT_MENU
      }, {
        label: 'Toggle 2D/3D View',
        eventType: os.action.EventType.TOGGLE_VIEW,
        tooltip: 'Toggle the map view between 2D and 3D views',
        icons: ['<i class="fa fa-fw fa-globe"></i>'],
        sort: 30,
        metricKey: os.metrics.keys.Map.TOGGLE_MODE
      }, {
        label: 'Show Legend',
        eventType: os.action.EventType.SHOW_LEGEND,
        tooltip: 'Display the map legend',
        icons: ['<i class="fa fa-fw ' + os.legend.ICON + '"></i>'],
        sort: 50,
        handler: os.ui.menu.map.showLegend,
        metricKey: os.metrics.keys.Map.SHOW_LEGEND_CONTEXT
      }, {
        label: 'Clear Selection',
        eventType: os.action.EventType.CLEAR_SELECTION,
        tooltip: 'Clears the selected features across all layers',
        icons: ['<i class="fa fa-fw fa-times-circle"></i>'],
        sort: 60,
        handler: os.ui.menu.map.clearSelection_,
        metricKey: os.metrics.keys.Map.CLEAR_SELECTION
      }]
    }, {
      label: 'Options',
      type: os.ui.menu.MenuItemType.GROUP,
      sort: 5,
      children: [{
        label: 'Background Color',
        eventType: os.ui.menu.map.MAP_BG_COLOR_,
        tooltip: 'Change the map background color',
        icons: [],
        beforeRender: os.ui.menu.map.updateBGIcon,
        handler: os.ui.menu.map.changeColor_,
        metricKey: os.metrics.keys.Map.BACKGROUND_COLOR
      }, {
        label: 'Terrain',
        eventType: os.config.DisplaySetting.ENABLE_TERRAIN,
        type: os.ui.menu.MenuItemType.CHECK,
        tooltip: 'Show terrain on the 3D globe',
        beforeRender: os.ui.menu.map.updateTerrainItem,
        handler: os.ui.menu.map.onTerrain
      }]
    }, {
      label: 'Coordinate',
      type: os.ui.menu.MenuItemType.GROUP,
      visible: false,
      sort: 10,
      children: [],
      beforeRender: os.ui.menu.map.showIfHasCoordinate
    }]
  }));

  os.settings.listen(os.ui.menu.map.BG_COLOR_, os.ui.menu.map.onColorSettingChange_);
};


/**
 * Disposes map menu
 */
os.ui.menu.map.dispose = function() {
  goog.dispose(os.ui.menu.MAP);
  os.ui.menu.MAP = undefined;

  os.settings.unlisten(os.ui.menu.map.BG_COLOR_, os.ui.menu.map.onColorSettingChange_);
};


/**
 * Show a menu item if the context is a valid coordinate.
 * @param {ol.Coordinate} coord The coordinate.
 * @this {os.ui.menu.MenuItem}
 */
os.ui.menu.map.showIfHasCoordinate = function(coord) {
  this.visible = Boolean(coord && coord.length > 1);
};


/**
 * Color the icon for the Background Color menu item.
 * @this {os.ui.menu.MenuItem}
 */
os.ui.menu.map.updateBGIcon = function() {
  var color = os.settings.get(os.ui.menu.map.BG_COLOR_, '#000000');
  this.icons[0] = '<i class="fa fa-fw fa-tint" style="color:' + color + '"></i>';
};


/**
 * Show the map legend.
 */
os.ui.menu.map.showLegend = function() {
  var event = new os.ui.events.UIEvent(os.ui.events.UIEventType.TOGGLE_UI, os.legend.ID, true,
      null, os.metrics.keys.Map.SHOW_LEGEND);
  os.dispatcher.dispatchEvent(event);
};


/**
 * Clears selection on all vector sources.
 * @private
 */
os.ui.menu.map.clearSelection_ = function() {
  var sources = os.osDataManager.getSources();
  for (var i = 0, ii = sources.length; i < ii; i++) {
    var s = sources[i];
    if (s instanceof os.source.Vector) {
      s.selectNone();
    }
  }
};


/**
 * @private
 */
os.ui.menu.map.changeColor_ = function() {
  var map = os.MapContainer.getInstance();
  os.ui.window.launchConfirmColor(os.ui.menu.map.onColorChosen_, map.getBGColor());
};


/**
 * Callback for user selecting a new color.  Simply save the value to settings and let the settings change event
 * do the work.
 * @param {string} color
 * @private
 */
os.ui.menu.map.onColorChosen_ = function(color) {
  os.settings.set(os.ui.menu.map.BG_COLOR_, color);
};


/**
 * Handle change to color in settings
 * @param {!os.events.SettingChangeEvent} event
 * @private
 */
os.ui.menu.map.onColorSettingChange_ = function(event) {
  os.MapContainer.getInstance().setBGColor(/** @type {string} */ (event.newVal));
};


/**
 * Update the Terrain menu item.
 * @this {os.ui.menu.MenuItem}
 */
os.ui.menu.map.updateTerrainItem = function() {
  var mc = os.MapContainer.getInstance();
  this.visible = mc.is3DEnabled() && mc.hasTerrain();
  this.selected = !!os.settings.get(os.config.DisplaySetting.ENABLE_TERRAIN, false);
};


/**
 * Enable terrain menu option listener.
 * @param {os.ui.menu.MenuEvent<ol.Coordinate>} event The event.
 * @this {os.ui.menu.MenuItem}
 */
os.ui.menu.map.onTerrain = function(event) {
  os.settings.set(os.config.DisplaySetting.ENABLE_TERRAIN, !this.selected);
};

goog.provide('os.ui.menu.windows.default');

goog.require('os.config.ServerSettings');
goog.require('os.config.Settings');
goog.require('os.metrics.keys');
goog.require('os.ui.events.UIEvent');
goog.require('os.ui.events.UIEventType');
goog.require('os.ui.menu.windows');
goog.require('os.ui.windowSelector');


/**
 * Settings keys for default windows.
 * @enum {string}
 */
os.ui.menu.windows.default.SettingsKey = {
  LAYERS_DEFAULTS: 'os.layers.defaults'
};


/**
 * Add default windows to the Windows menu.
 */
os.ui.menu.windows.default.setup = function() {
  const settings = os.config.Settings.getInstance();

  os.ui.menu.windows.setup();

  // add windows
  os.ui.menu.windows.addWindow('addData', {
    'icon': 'fa fa-plus',
    'label': 'Add Data',
    'description': 'Add data to the map',
    'x': 'center',
    'y': 'center',
    'width': '800',
    'height': '600',
    'min-width': '565',
    'max-width': '1200',
    'min-height': '300',
    'max-height': '1000',
    'show-close': 'true',
    'help-context': 'addData',
    'html': 'adddata'
  }, true);

  const layersDefaults = /** @type {osx.window.WindowOptions} */ (
    settings.get(os.ui.menu.windows.default.SettingsKey.LAYERS_DEFAULTS, {}));

  const layersWindowOptions = Object.assign({
    'key': 'layers',
    'icon': 'fas fa-layer-group',
    'label': 'Layers',
    'description': 'View and manipulate layers on the map',
    'x': 12,
    'y': 96,
    'width': 400,
    'height': 550,
    'min-width': 300,
    'max-width': 1000,
    'min-height': 350,
    'max-height': 2000,
    'show-close': true,
    'help-context': 'layers',
    'shortcut': 'alt+l',
    'html': '<layerswin tab="layers"></layerswin>',
    'metricKey': os.metrics.keys.Map.SHOW_LAYER_WINDOW
  }, layersDefaults);

  var layers = os.ui.menu.windows.addWindow('layers', layersWindowOptions, true);

  // layers is open by default
  if (layers) {
    os.ui.menu.windows.openWindow('layers');
  }

  os.ui.menu.windows.addWindow('timeline', {
    'icon': 'fa fa-clock-o',
    'label': 'Timeline',
    'metricKey': os.metrics.keys.Timeline.OPEN
  }, true, function() {
    var event = new os.ui.events.UIEvent(os.ui.events.UIEventType.TOGGLE_UI, 'timeline');
    os.dispatcher.dispatchEvent(event);
  });

  os.ui.menu.windows.addWindow('settings', {
    'icon': 'fa fa-gears',
    'label': 'Settings',
    'description': 'Change application settings',
    'x': 'center',
    'y': 'center',
    'width': '1000',
    'height': '500',
    'min-width': '535',
    'max-width': '1000',
    'min-height': '300',
    'max-height': '2000',
    'show-close': 'true',
    'html': 'settings'
  }, true);

  os.ui.menu.windows.addWindow('alerts', {
    'icon': 'fa fa-bell',
    'label': 'Alerts',
    'description': 'View notifications and alerts',
    'x': 'center',
    'y': 'center',
    'width': '500',
    'height': '600',
    'min-width': '300',
    'max-width': '1000',
    'min-height': '300',
    'max-height': '1000',
    'show-close': 'true',
    'html': '<alerts resize-with="' + os.ui.windowSelector.WINDOW + '"></alerts>'
  });

  os.ui.menu.windows.addWindow('clear', {
    'icon': 'fa fa-times',
    'label': 'Clear',
    'description': 'Clear data from the map',
    'x': 'center',
    'y': 'center',
    'width': 300,
    'height': 350,
    'min-width': 300,
    'max-width': 400,
    'min-height': 250,
    'max-height': 500,
    'show-close': true,
    'html': 'clear'
  });

  os.ui.menu.windows.addWindow('history', {
    'icon': 'fa fa-history',
    'label': 'History',
    'description': 'View undo history',
    'x': 'center',
    'y': 'center',
    'width': '500',
    'height': '600',
    'min-width': '300',
    'max-width': '1000',
    'min-height': '300',
    'max-height': '1000',
    'show-close': 'true',
    'html': '<history resize-with="' + os.ui.windowSelector.WINDOW + '"></history>'
  }, false, undefined);

  if (os.settings.get('metrics.enabled', false)) {
    os.ui.menu.windows.addWindow('metrics', {
      'icon': 'fa fa-cubes',
      'label': '{APP} Capabilities',
      'description': 'Explore {APP} Capabilities',
      'x': 'center',
      'y': 'center',
      'width': '500',
      'height': '600',
      'min-width': '300',
      'max-width': '1000',
      'min-height': '300',
      'max-height': '1000',
      'show-close': 'true',
      'html': 'metrics'
    }, false, undefined);
  }

  os.ui.menu.windows.addWindow('legend', {
    'icon': os.legend.ICON,
    'label': 'Legend',
    'description': 'Shows a legend for all the data on the map'
  }, false, os.ui.menu.map.showLegend);

  os.ui.menu.windows.addWindow('log', {
    'icon': 'fa fa-terminal',
    'label': 'Log'
  }, false, function() {
    if (!os.logWindow.isEnabled()) {
      os.logWindow.setEnabled(true);
    }
  });

  os.ui.menu.windows.addWindow('servers', {
    'icon': 'fa fa-database',
    'label': 'Servers'
  }, false, os.ui.menu.windows.default.openServers, 'settings');
};


/**
 * @type {function()}
 */
os.ui.menu.windows.default.openServers = goog.partial(os.ui.menu.windows.openSettingsTo, os.config.ServerSettings.ID);

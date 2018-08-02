goog.provide('os.ui.menu.windows.default');

goog.require('os.config.ServerSettings');
goog.require('os.metrics.keys');
goog.require('os.ui.events.UIEvent');
goog.require('os.ui.events.UIEventType');
goog.require('os.ui.ex.ExportDirective');
goog.require('os.ui.menu.windows');


/**
 * Add default windows to the Windows menu.
 */
os.ui.menu.windows.default.setup = function() {
  os.ui.menu.windows.setup();

  // add windows
  os.ui.menu.windows.addWindow('addData', {
    'icon': 'fa fa-plus green-icon',
    'label': 'Add Data',
    'description': 'Add data to the map',
    'x': 'center',
    'y': 'center',
    'width': '800',
    'height': '600',
    'min-width': '500',
    'max-width': '1200',
    'min-height': '300',
    'max-height': '1000',
    'show-close': 'true',
    'no-scroll': 'true',
    'help-context': 'addData',
    'html': 'adddata'
  }, true);

  var layers = os.ui.menu.windows.addWindow('layers', {
    'key': 'layers',
    'icon': 'orange-icon fa fa-align-justify',
    'label': 'Layers',
    'description': 'View and manipulate layers on the map',
    'x': '20',
    'y': '75',
    'width': '325',
    'height': '550',
    'min-width': '300',
    'max-width': '1000',
    'min-height': '250',
    'max-height': '2000',
    'show-close': 'true',
    'no-scroll': 'true',
    'help-context': 'layers',
    'shortcut': 'alt+l',
    'html': '<layerswin tab="layers"></layerswin>',
    'metricKey': os.metrics.keys.Map.SHOW_LAYER_WINDOW
  }, true);

  // layers is open by default
  if (layers) {
    os.ui.menu.windows.openWindow('layers');
  }

  os.ui.menu.windows.addWindow('timeline', {
    'icon': 'fa fa-clock-o yellow-icon',
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
    'no-scroll': 'true',
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
    'no-scroll': 'false',
    'html': '<alerts resize-with=".window"></alerts>'
  });

  os.ui.menu.windows.addWindow('clear', {
    'icon': 'fa fa-times red-icon',
    'label': 'Clear',
    'description': 'Clear data from the map',
    'x': 'center',
    'y': 'center',
    'width': '300',
    'height': '262',
    'min-width': '300',
    'max-width': '400',
    'min-height': '250',
    'max-height': '500',
    'show-close': 'true',
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
    'no-scroll': 'true',
    'html': '<history resize-with=".window"></history>'
  });

  if (os.settings.get('metrics.enabled', false)) {
    os.ui.menu.windows.addWindow('metrics', {
      'icon': 'orange-icon fa fa-cubes',
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
      'no-scroll': 'true',
      'html': 'metrics'
    });
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
  }, false, os.ui.menu.windows.default.openServers);
};


/**
 * @type {function()}
 */
os.ui.menu.windows.default.openServers = goog.partial(os.ui.menu.windows.openSettingsTo, os.config.ServerSettings.ID);

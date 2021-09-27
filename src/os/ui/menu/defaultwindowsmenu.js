goog.declareModuleId('os.ui.menu.windows.default');

import * as dispatcher from '../../dispatcher.js';
import * as os from '../../os.js';
import UIEvent from '../events/uievent.js';
import UIEventType from '../events/uieventtype.js';
import * as HistoryViewUI from '../history/historyview.js';
import * as LayersWindowUI from '../layerswindow.js';
import windowSelector from '../windowselector.js';
import {showLegend} from './mapmenu.js';
import * as windows from './windowsmenu.js';
const ServerSettings = goog.require('os.config.ServerSettings');
const Settings = goog.require('os.config.Settings');
const legend = goog.require('os.legend');
const {Map: MapKeys, Timeline: TimelineKeys} = goog.require('os.metrics.keys');


/**
 * Settings keys for default windows.
 * @enum {string}
 */
export const SettingsKey = {
  LAYERS_DEFAULTS: 'os.layers.defaults'
};

/**
 * Add default windows to the Windows menu.
 */
export const setup = function() {
  const settings = Settings.getInstance();

  windows.setup();

  // add windows
  windows.addWindow('addData', {
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
    settings.get(SettingsKey.LAYERS_DEFAULTS, {}));

  const layersWindowUI = LayersWindowUI.directiveTag;
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
    'html': `<${layersWindowUI} tab="layers"></${layersWindowUI}>`,
    'metricKey': MapKeys.SHOW_LAYER_WINDOW
  }, layersDefaults);

  var layers = windows.addWindow('layers', layersWindowOptions, true);

  // layers is open by default
  if (layers) {
    windows.openWindow('layers');
  }

  windows.addWindow('timeline', {
    'icon': 'fa fa-clock-o',
    'label': 'Timeline',
    'metricKey': TimelineKeys.OPEN
  }, true, function() {
    var event = new UIEvent(UIEventType.TOGGLE_UI, 'timeline');
    dispatcher.getInstance().dispatchEvent(event);
  });

  windows.addWindow('settings', {
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

  windows.addWindow('alerts', {
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
    'html': '<alerts resize-with="' + windowSelector.WINDOW + '"></alerts>'
  });

  windows.addWindow('clear', {
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

  windows.addWindow('history', {
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
    'html': `<${HistoryViewUI.directiveTag} resize-with="${windowSelector.WINDOW}"></${HistoryViewUI.directiveTag}>`
  }, false, undefined);

  if (Settings.getInstance().get('metrics.enabled', false)) {
    windows.addWindow('metrics', {
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

  windows.addWindow('legend', {
    'icon': legend.ICON,
    'label': 'Legend',
    'description': 'Shows a legend for all the data on the map'
  }, false, showLegend);

  windows.addWindow('log', {
    'icon': 'fa fa-terminal',
    'label': 'Log'
  }, false, function() {
    if (!os.logWindow.isEnabled()) {
      os.logWindow.setEnabled(true);
    }
  });

  windows.addWindow('servers', {
    'icon': 'fa fa-database',
    'label': 'Servers'
  }, false, openServers, 'settings');
};

/**
 * @type {function()}
 */
export const openServers = goog.partial(windows.openSettingsTo, ServerSettings.ID);

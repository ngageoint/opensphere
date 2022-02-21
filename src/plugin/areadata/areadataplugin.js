goog.declareModuleId('plugin.areadata.AreaDataPlugin');

import OSSettings from '../../os/config/settings.js';
import OGCService from '../../os/ogc/ogcservice.js';
import * as registry from '../../os/ogc/registry.js';
import services from '../../os/ogc/services.js';
import AbstractPlugin from '../../os/plugin/abstractplugin.js';
import {AreaImportType} from './areadata.js';


const Settings = OSSettings.getInstance();


/**
 * @type {string}
 * @const
 */
const ID = 'areadata';

/**
 * @type {string}
 * @const
 */
const SERVICES_SETTING = 'areadata.services';

/**
 * Maps a non-minimized MenuItemOptions object, e.g. from settings.json, onto the minimized version
 *
 * WARNING: To avoid turning a common object into an extern, only the primitive properties defined as of 20200812
 * are mapped to a new MenuItemOptions object. Please add new mappings as needed.
 *
 * @param {Object.<string, *>|undefined|null} config
 * @return {MenuItemOptions|undefined}
 */
const minifyMenuItemOptions_ = function(config) {
  if (!config) return undefined;

  return /** @type {MenuItemOptions} */ ({
    eventType: config['eventType'],
    label: config['label'],
    metricKey: config['metricKey'],
    visible: config['visible'],
    enabled: config['enabled'],
    selected: config['selected'],
    icons: config['icons'],
    tooltip: config['tooltip'],
    shortcut: config['shortcut'],
    sort: config['sort']
  });
};

/**
 * Maps a non-minimized os.ui.ogc.OGCListUI.Options object, e.g. from settings.json, onto the minimized version
 * @param {Object.<string, *>|undefined|null} config
 * @return {OGCListUIOptions|undefined}
 */
const minifyListUIOptions_ = function(config) {
  if (!config) return undefined;

  return /** @type {MenuItemOptions} */ ({
    label: config['label'],
    text: config['text'],
    icon: config['icon']
  });
};

/**
 * Plugin to read AreaData services configs into the registry for use by other plugins
 */
export default class AreaDataPlugin extends AbstractPlugin {
  /**
   * constructor
   */
  constructor() {
    super();

    this.id = ID;
  }

  /**
   * @inheritDoc
   */
  init() {
    // Read the settings.json and initialize the Area importer(s)...
    const configs = /** @type {Object<?, pluginx.areadata.AreaMenuItemOptions>} */
      (Settings.get(SERVICES_SETTING, {}));

    // sort by provided order or object keys' natural ordering (alphabetical)
    const values = Object.values(configs || {}) || [];
    const sorted = values.sort((v1, v2) => {
      var s1 = v1.sort || 0;
      var s2 = v2.sort || 0;
      return (s1 - s2); // ascending
    });

    // add in the desired order
    sorted.forEach((settings) => {
      const type = settings.type;
      switch (type) {
        case AreaImportType.OGC:
          this.registerOGCService(settings);
          break;
        default:
          break;
      }
    });
  }

  /**
   * Utility function to create an OGC Service from the settings
   *
   * @param {!pluginx.areadata.AreaMenuItemOptions} settings
   */
  registerOGCService(settings) {
    // parse through the settings and add the configured OGCService to the registry
    if (settings &&
        settings.enabled !== false && // allow null/undefined
        settings.id &&
        settings.type == AreaImportType.OGC &&
        settings.ogcSettings) {
      const lookup = services.getInstance();
      let service;

      if (settings.clazzKey && lookup.has(settings.clazzKey)) { // if there is custom logic/implementation...
        const Clazz = services.getInstance().get(settings.clazzKey);
        service = new Clazz();
      } else { // ... otherwise use the default, configurable UI
        service = new OGCService();
      }

      // configure it
      service.setServiceId(settings.id);
      service.init(settings.ogcSettings);
      service.getQuery().init(minifyListUIOptions_(settings.listUIOptions));

      registry.getInstance().register(
          settings.id,
          service,
          minifyMenuItemOptions_(settings.menuItemOptions) // map the settings.json version to the minified version
      );
    }
  }
}

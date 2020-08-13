goog.module('plugin.areadata.AreaDataPlugin');
goog.module.declareLegacyNamespace();


const AbstractPlugin = goog.require('os.plugin.AbstractPlugin');
const registry = goog.require('os.ogc.registry');
const services = goog.require('os.ogc.services');
const OGCService = goog.require('os.ogc.OGCService');
const {AreaImportType} = goog.require('plugin.areadata');

const OSSettings = goog.require('os.config.Settings');

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
const KEYS_SETTING = 'areadata.keys';

/**
 * Maps a non-minimized os.ui.menu.MenuItemOptions object, e.g. from settings.json, onto the minimized version
 *
 * WARNING: To avoid turning a common object into an extern, only the primitive properties defined as of 20200812
 * are mapped to a new os.ui.menu.MenuItemOptions object. Please add new mappings as needed.
 *
 * @param {Object.<string, *>|undefined|null} config
 * @return {os.ui.menu.MenuItemOptions|undefined}
 */
const minify_ = function(config) {
  if (!config) return undefined;

  return /** @type {os.ui.menu.MenuItemOptions} */ ({
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
 *
 */
class AreaDataPlugin extends AbstractPlugin {
  /**
   *
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
    // NOTE: the "arraylike" object returned by Settings is not iterable; pass it through an Array.from()
    const keys = Array.from(Settings.get(KEYS_SETTING) || '');
    if (keys.length > 0) {
      keys.forEach((key) => {
        const settings = /** @type {pluginx.areadata.AreaMenuItemOptions} */ (Settings.get(key));
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
  }

  /**
   * Utility function to create an OGC Service from the settings
   *
   * @param {!pluginx.areadata.AreaMenuItemOptions} settings
   */
  registerOGCService(settings) {
    // parse through the settings and add the configured OGCService to the registry
    if (settings && settings.id && settings.type == AreaImportType.OGC && settings.ogcSettings) {
      let service;
      if (settings.clazz) { // if there is custom logic...
        const Clazz = services.getInstance().get(settings.clazz);
        service = (Clazz.hasOwnProperty('getInstance')) ? Clazz.getInstance() : new Clazz();
      } else { // ... otherwise use the default, configurable UI
        service = new OGCService();
      }

      // configure it
      service.setServiceId(settings.id);
      service.init(settings.ogcSettings);
      service.getQuery().init(settings.listUIOptions);

      registry.getInstance().register(
          settings.id,
          service,
          minify_(settings.menuItemOptions) // map the settings.json version to the minified version
      );
    }
  }
}


exports = AreaDataPlugin;

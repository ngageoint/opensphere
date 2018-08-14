goog.provide('plugin.ogc.OGCPlugin');

goog.require('os.data.DataManager');
goog.require('os.data.ProviderEntry');
goog.require('os.ogc');
goog.require('os.plugin.AbstractPlugin');
goog.require('os.ui.ProviderImportUI');
goog.require('os.ui.action.Action');
goog.require('os.ui.im.ImportManager');
goog.require('os.ui.ogc.OGCServer');
goog.require('plugin.ogc.GeoServer');
goog.require('plugin.ogc.OGCLayerDescriptor');
goog.require('plugin.ogc.mime');
goog.require('plugin.ogc.ui.geoserverDirective');
goog.require('plugin.ogc.ui.ogcserverDirective');
goog.require('plugin.ogc.wfs.QueryWFSLayerConfig');
goog.require('plugin.ogc.wms.WMSLayerConfig');



/**
 * Provides WMS/WFS layer support, both separately and as a grouped layer combination.
 * @extends {os.plugin.AbstractPlugin}
 * @constructor
 */
plugin.ogc.OGCPlugin = function() {
  plugin.ogc.OGCPlugin.base(this, 'constructor');
  this.id = os.ogc.ID;
};
goog.inherits(plugin.ogc.OGCPlugin, os.plugin.AbstractPlugin);


/**
 * @inheritDoc
 */
plugin.ogc.OGCPlugin.prototype.init = function() {
  var dm = os.dataManager;

  var ogc = new os.data.ProviderEntry(os.ogc.ID, os.ui.ogc.OGCServer, 'OGC Server',
    'OGC Servers provide raster imagery through WMS (Web Map Service) and vector features through WFS'
    + ' (Web Feature Service) servers');

  var geo = new os.data.ProviderEntry(plugin.ogc.mime.GEOSERVER_TYPE, plugin.ogc.GeoServer, 'GeoServer', '');

  // register the ogc provider types
  dm.registerProviderType(ogc);
  dm.registerProviderType(geo);

  // register the ogc descriptor types
  dm.registerDescriptorType(os.ogc.ID, plugin.ogc.OGCLayerDescriptor);

  // register the layer configurations
  var lcm = os.layer.config.LayerConfigManager.getInstance();
  lcm.registerLayerConfig('WMS', plugin.ogc.wms.WMSLayerConfig);
  lcm.registerLayerConfig('WFS', plugin.ogc.wfs.QueryWFSLayerConfig);
  lcm.registerDefaultLayerConfig('WFS', plugin.ogc.getDefaultWfsOptions);

  // register the server forms for adding/editing servers
  var im = os.ui.im.ImportManager.getInstance();
  im.registerImportUI(os.ogc.ID, new os.ui.ProviderImportUI('<ogcserver></ogcserver>'));
  im.registerImportUI(plugin.ogc.mime.GEOSERVER_TYPE,
      new os.ui.ProviderImportUI('<geoserver></geoserver>'));
};


/**
 * Get the default opensphere WFS layer options
 * @return {!Object<string, *>}
 */
plugin.ogc.getDefaultWfsOptions = function() {
  var options = os.ogc.getDefaultWfsOptions();

  // opensphere handles this per-request based on the feature limit imposed by 2D/3D mode, so exclude it from the request
  // parameters
  options['params'].remove('maxfeatures');
  options['params'].remove('outputformat');

  return options;
};


/**
 * Get the maxiumum number of features supported by the application, accounting for 2D/3D modes.
 * @param {string=} opt_key
 * @return {number}
 */
plugin.ogc.getMaxFeatures = function(opt_key) {
  var mode = opt_key || os.settings.get(os.config.DisplaySetting.MAP_MODE) || os.MapMode.VIEW_2D;
  return /** @type {number} */ (os.settings.get('maxFeatures.' + mode, 50000));
};


/**
 * Override the default function.
 */
os.ogc.getMaxFeatures = plugin.ogc.getMaxFeatures;

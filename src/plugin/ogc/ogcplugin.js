goog.provide('plugin.ogc.OGCPlugin');

goog.require('os.data.DataManager');
goog.require('os.data.ProviderEntry');
goog.require('os.ogc');
goog.require('os.ogc.LayerType');
goog.require('os.parse.FileParserConfig');
goog.require('os.plugin.AbstractPlugin');
goog.require('os.ui.ProviderImportUI');
goog.require('os.ui.action.Action');
goog.require('os.ui.im.ImportManager');
goog.require('os.ui.ogc.OGCServer');
goog.require('os.ui.window.GeoServerHelpUI');
goog.require('os.ui.window.OgcServerHelpUI');
goog.require('plugin.ogc.GeoServer');
goog.require('plugin.ogc.OGCLayerDescriptor');
goog.require('plugin.ogc.mime');
goog.require('plugin.ogc.ui.geoserverDirective');
goog.require('plugin.ogc.ui.ogcserverDirective');
goog.require('plugin.ogc.wfs.QueryWFSLayerConfig');
goog.require('plugin.ogc.wms.WMSLayerConfig');
goog.require('plugin.ogc.wmts.WMTSLayerConfig');
goog.require('plugin.ogc.wmts.WMTSServer');



/**
 * Provides WMS/WFS layer support, both separately and as a grouped layer combination.
 *
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

  var wmts = new os.data.ProviderEntry(plugin.ogc.wmts.WMTSServer.TYPE, plugin.ogc.wmts.WMTSServer, 'WMTS Server', '');

  // register the ogc provider types
  dm.registerProviderType(ogc);
  dm.registerProviderType(geo);
  dm.registerProviderType(wmts);

  // register the ogc descriptor types
  dm.registerDescriptorType(os.ogc.ID, plugin.ogc.OGCLayerDescriptor);

  // register the layer configurations
  var lcm = os.layer.config.LayerConfigManager.getInstance();
  lcm.registerLayerConfig(os.ogc.LayerType.WMS, plugin.ogc.wms.WMSLayerConfig);
  lcm.registerLayerConfig(os.ogc.LayerType.WFS, plugin.ogc.wfs.QueryWFSLayerConfig);
  lcm.registerLayerConfig(os.ogc.LayerType.WMTS, plugin.ogc.wmts.WMTSLayerConfig);
  lcm.registerDefaultLayerConfig(os.ogc.LayerType.WFS, plugin.ogc.getDefaultWfsOptions);

  // register the server forms for adding/editing servers
  var im = os.ui.im.ImportManager.getInstance();
  im.registerImportUI(os.ogc.ID, new os.ui.ProviderImportUI('<ogcserver></ogcserver>'));
  im.registerServerType(os.ogc.ID, {
    type: 'ogc',
    config: new os.parse.FileParserConfig(),
    helpUi: os.ui.window.OgcServerHelpUI.directiveTag,
    ui: 'ogcserver',
    label: 'OGC Server'
  });
  im.registerImportUI(plugin.ogc.mime.GEOSERVER_TYPE,
      new os.ui.ProviderImportUI('<geoserver></geoserver>'));
  im.registerServerType(plugin.ogc.mime.GEOSERVER_TYPE, {
    type: 'geoserver',
    config: new os.parse.FileParserConfig(),
    helpUi: os.ui.window.GeoServerHelpUI.directiveTag,
    ui: 'geoserver',
    label: 'GeoServer'
  });
};


/**
 * Get the default opensphere WFS layer options
 *
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

goog.provide('plugin.file.geojson.GeoJSONPlugin');

goog.require('os.data.DataManager');
goog.require('os.data.ProviderEntry');
goog.require('os.layer.config.LayerConfigManager');
goog.require('os.plugin.AbstractPlugin');
goog.require('os.ui.im.ImportManager');
goog.require('plugin.file.geojson.GeoJSONDescriptor');
goog.require('plugin.file.geojson.GeoJSONExporter');
goog.require('plugin.file.geojson.GeoJSONImportUI');
goog.require('plugin.file.geojson.GeoJSONLayerConfig');
goog.require('plugin.file.geojson.GeoJSONParser');
goog.require('plugin.file.geojson.GeoJSONProvider');
goog.require('plugin.file.geojson.GeoJSONSimpleStyleParser');
goog.require('plugin.file.geojson.mime');
goog.require('plugin.file.geojson.mixin');



/**
 * Provides GeoJSON support
 * @extends {os.plugin.AbstractPlugin}
 * @constructor
 */
plugin.file.geojson.GeoJSONPlugin = function() {
  plugin.file.geojson.GeoJSONPlugin.base(this, 'constructor');
  this.id = plugin.file.geojson.GeoJSONPlugin.ID;
};
goog.inherits(plugin.file.geojson.GeoJSONPlugin, os.plugin.AbstractPlugin);


/**
 * @type {string}
 * @const
 */
plugin.file.geojson.GeoJSONPlugin.ID = 'geojson';


/**
 * @type {string}
 * @const
 */
plugin.file.geojson.GeoJSONPlugin.TYPE = 'GeoJSON Layers';


/**
 * @inheritDoc
 */
plugin.file.geojson.GeoJSONPlugin.prototype.init = function() {
  var dm = os.dataManager;

  // register geojson provider type
  dm.registerProviderType(new os.data.ProviderEntry(
      plugin.file.geojson.GeoJSONPlugin.ID,
      plugin.file.geojson.GeoJSONProvider,
      plugin.file.geojson.GeoJSONPlugin.TYPE,
      plugin.file.geojson.GeoJSONPlugin.TYPE));

  // register the geojson descriptor type
  dm.registerDescriptorType(this.id, plugin.file.geojson.GeoJSONDescriptor);

  // register the geojson layer config
  var lcm = os.layer.config.LayerConfigManager.getInstance();
  lcm.registerLayerConfig('GeoJSON', plugin.file.geojson.GeoJSONLayerConfig);

  // register the geojson import ui
  var im = os.ui.im.ImportManager.getInstance();
  im.registerImportDetails('GeoJSON', true);
  im.registerImportUI(plugin.file.geojson.mime.TYPE, new plugin.file.geojson.GeoJSONImportUI());
  im.registerParser(this.id, plugin.file.geojson.GeoJSONSimpleStyleParser);
  im.registerParser(this.id + '-simplespec', plugin.file.geojson.GeoJSONSimpleStyleParser);

  // register the geojson exporter
  os.ui.exportManager.registerExportMethod(new plugin.file.geojson.GeoJSONExporter());
};

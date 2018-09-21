goog.provide('plugin.area.AreaPlugin');

goog.require('os.file.FileManager');
goog.require('os.file.mime.csv');
goog.require('os.mixin.object');
goog.require('os.plugin.AbstractPlugin');
goog.require('os.ui.file.method.ImportMethod');
goog.require('os.ui.im.ImportManager');
goog.require('plugin.area.CSVAreaImportUI');
goog.require('plugin.area.GeoJSONAreaImportUI');
goog.require('plugin.area.KMLAreaImportUI');
goog.require('plugin.area.SHPAreaImportUI');
goog.require('plugin.file.kml.mime');
goog.require('plugin.file.shp.mime');



/**
 * @extends {os.plugin.AbstractPlugin}
 * @constructor
 */
plugin.area.AreaPlugin = function() {
  plugin.area.AreaPlugin.base(this, 'constructor');
  this.id = plugin.area.AreaPlugin.ID;
  this.errorMessage = null;
};
goog.inherits(plugin.area.AreaPlugin, os.plugin.AbstractPlugin);


/**
 * @type {string}
 * @const
 */
plugin.area.AreaPlugin.ID = 'areas';


/**
 * @inheritDoc
 */
plugin.area.AreaPlugin.prototype.init = function() {
  // initialize managers used by the area plugin
  var aim = os.areaImportManager;
  var afm = os.areaFileManager;

  // register file import method
  afm.registerFileMethod(new os.ui.file.method.ImportMethod(false));

  // csv
  aim.registerImportUI(os.file.mime.csv.TYPE, new plugin.area.CSVAreaImportUI());
  aim.registerImportDetails('CSV', true);

  // geojson
  aim.registerImportUI(plugin.file.geojson.mime.TYPE, new plugin.area.GeoJSONAreaImportUI());
  aim.registerImportDetails('GeoJSON', true);

  // kml
  aim.registerImportUI(plugin.file.kml.mime.TYPE, new plugin.area.KMLAreaImportUI());
  aim.registerImportUI(plugin.file.kml.mime.KMZ_TYPE, new plugin.area.KMLAreaImportUI());
  aim.registerImportDetails('KML/KMZ', true);

  // shp
  aim.registerImportUI(plugin.file.shp.mime.TYPE, new plugin.area.SHPAreaImportUI());
  aim.registerImportUI(plugin.file.shp.mime.ZIP_TYPE, new plugin.area.SHPAreaImportUI());
  aim.registerImportDetails('Shapefile (SHP/DBF or ZIP)', true);
};

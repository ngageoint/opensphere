goog.provide('plugin.area.AreaPlugin');

goog.require('os.file.FileManager');
goog.require('os.file.type.KMZTypeMethod');
goog.require('os.mixin.object');
goog.require('os.plugin.AbstractPlugin');
goog.require('os.ui.file.method.ImportMethod');
goog.require('os.ui.im.ImportManager');
goog.require('plugin.area.CSVAreaImportUI');
goog.require('plugin.area.KMLAreaImportUI');
goog.require('plugin.area.SHPAreaImportUI');
goog.require('plugin.file.csv.CSVTypeMethod');
goog.require('plugin.file.kml.type.KMLTypeMethod');
goog.require('plugin.file.shp.type.DBFTypeMethod');
goog.require('plugin.file.shp.type.SHPTypeMethod');
goog.require('plugin.file.shp.type.ZipSHPTypeMethod');



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
  afm.registerContentTypeMethod(new plugin.file.csv.CSVTypeMethod());
  aim.registerImportUI('csv', new plugin.area.CSVAreaImportUI());
  aim.registerImportDetails('CSV', true);

  // kml
  afm.registerContentTypeMethod(new plugin.file.kml.type.KMLTypeMethod());
  afm.registerContentTypeMethod(new os.file.type.KMZTypeMethod());
  aim.registerImportUI('kml', new plugin.area.KMLAreaImportUI());
  aim.registerImportDetails('KML/KMZ', true);

  // shp
  afm.registerContentTypeMethod(new plugin.file.shp.type.SHPTypeMethod());
  afm.registerContentTypeMethod(new plugin.file.shp.type.DBFTypeMethod());
  afm.registerContentTypeMethod(new plugin.file.shp.type.ZipSHPTypeMethod());

  aim.registerImportUI('shp', new plugin.area.SHPAreaImportUI());
  aim.registerImportUI('zipshp', new plugin.area.SHPAreaImportUI());
  aim.registerImportDetails('Shapefile (SHP/DBF or ZIP)', true);
};

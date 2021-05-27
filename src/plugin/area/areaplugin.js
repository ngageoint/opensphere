goog.module('plugin.area.AreaPlugin');
goog.module.declareLegacyNamespace();

const csv = goog.require('os.file.mime.csv');
const AbstractPlugin = goog.require('os.plugin.AbstractPlugin');
const ImportMethod = goog.require('os.ui.file.method.ImportMethod');
const CSVAreaImportUI = goog.require('plugin.area.CSVAreaImportUI');
const GeoJSONAreaImportUI = goog.require('plugin.area.GeoJSONAreaImportUI');
const KMLAreaImportUI = goog.require('plugin.area.KMLAreaImportUI');
const SHPAreaImportUI = goog.require('plugin.area.SHPAreaImportUI');
const pluginFileGeojsonMime = goog.require('plugin.file.geojson.mime');
const pluginFileKmlMime = goog.require('plugin.file.kml.mime');
const mime = goog.require('plugin.file.shp.mime');


/**
 */
class AreaPlugin extends AbstractPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.id = AreaPlugin.ID;
    this.errorMessage = null;
  }

  /**
   * @inheritDoc
   */
  init() {
    // initialize managers used by the area plugin
    var aim = os.areaImportManager;
    var afm = os.areaFileManager;

    // register file import method
    afm.registerFileMethod(new ImportMethod(false));

    // csv
    aim.registerImportUI(csv.TYPE, new CSVAreaImportUI());
    aim.registerImportDetails('CSV', true);

    // geojson
    aim.registerImportUI(pluginFileGeojsonMime.TYPE, new GeoJSONAreaImportUI());
    aim.registerImportDetails('GeoJSON', true);

    // kml
    aim.registerImportUI(pluginFileKmlMime.TYPE, new KMLAreaImportUI());
    aim.registerImportUI(pluginFileKmlMime.KMZ_TYPE, new KMLAreaImportUI());
    aim.registerImportDetails('KML/KMZ', true);

    // shp
    aim.registerImportUI(mime.TYPE, new SHPAreaImportUI());
    aim.registerImportUI(mime.ZIP_TYPE, new SHPAreaImportUI());
    aim.registerImportDetails('Shapefile (SHP/DBF or ZIP)', true);
  }
}


/**
 * @type {string}
 * @const
 */
AreaPlugin.ID = 'areas';


exports = AreaPlugin;

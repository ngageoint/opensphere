goog.declareModuleId('plugin.area.AreaPlugin');

import * as csv from '../../os/file/mime/csv.js';
import AbstractPlugin from '../../os/plugin/abstractplugin.js';
import {getAreaImportManager, getAreaFileManager} from '../../os/query/query.js';
import ImportMethod from '../../os/ui/file/method/importmethod.js';
import * as pluginFileGeojsonMime from '../file/geojson/mime.js';
import * as pluginFileKmlMime from '../file/kml/mime.js';
import * as mime from '../file/shp/mime.js';
import CSVAreaImportUI from './csvareaimportui.js';
import GeoJSONAreaImportUI from './geojsonareaimportui.js';
import KMLAreaImportUI from './kmlareaimportui.js';
import SHPAreaImportUI from './shpareaimportui.js';


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
    var aim = getAreaImportManager();
    var afm = getAreaFileManager();

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


export default AreaPlugin;

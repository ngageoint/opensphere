goog.declareModuleId('plugin.file.shp.SHPPlugin');

import DataManager from '../../../os/data/datamanager.js';
import ProviderEntry from '../../../os/data/providerentry.js';
import LayerConfigManager from '../../../os/layer/config/layerconfigmanager.js';
import AbstractPlugin from '../../../os/plugin/abstractplugin.js';
import exportManager from '../../../os/ui/file/uiexportmanager.js';
import ImportManager from '../../../os/ui/im/importmanager.js';
import * as mime from './mime.js';
import SHPDescriptor from './shpdescriptor.js';
import SHPExporter from './shpexporter.js';
import SHPLayerConfig from './shplayerconfig.js';
import SHPParser from './shpparser.js';
import SHPProvider from './shpprovider.js';
import SHPImportUI from './ui/shpimportui.js';
import ZipSHPImportUI from './ui/zipshpimportui.js';


/**
 * Provides SHP support
 */
export default class SHPPlugin extends AbstractPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.id = SHPPlugin.ID;
  }

  /**
   * @inheritDoc
   */
  init() {
    var dm = DataManager.getInstance();

    // register shp provider type
    dm.registerProviderType(new ProviderEntry(SHPPlugin.ID, SHPProvider, SHPPlugin.TYPE, SHPPlugin.TYPE));

    // register the shp descriptor type
    dm.registerDescriptorType(this.id, SHPDescriptor);

    // register the shp layer config
    var lcm = LayerConfigManager.getInstance();
    lcm.registerLayerConfig(this.id, SHPLayerConfig);

    // register the shp import ui
    var im = ImportManager.getInstance();
    im.registerImportDetails('Shapefile (SHP/DBF or ZIP)', true);
    im.registerImportUI(mime.TYPE, new SHPImportUI());
    im.registerImportUI(mime.ZIP_TYPE, new ZipSHPImportUI());
    im.registerParser(this.id, SHPParser);

    // register the shp exporter
    exportManager.registerExportMethod(new SHPExporter());
  }
}


/**
 * @type {string}
 * @const
 */
SHPPlugin.ID = 'shp';


/**
 * @type {string}
 * @const
 */
SHPPlugin.TYPE = 'SHP Layers';

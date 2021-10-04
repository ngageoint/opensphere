goog.declareModuleId('plugin.file.csv.CSVPlugin');

import DataManager from '../../../os/data/datamanager.js';
import ProviderEntry from '../../../os/data/providerentry.js';
import * as csv from '../../../os/file/mime/csv.js';
import LayerConfigManager from '../../../os/layer/config/layerconfigmanager.js';
import AbstractPlugin from '../../../os/plugin/abstractplugin.js';
import exportManager from '../../../os/ui/file/uiexportmanager.js';
import ImportManager from '../../../os/ui/im/importmanager.js';
import CSVDescriptor from './csvdescriptor.js';
import CSVExporter from './csvexporter.js';
import CSVLayerConfig from './csvlayerconfig.js';
import CSVParser from './csvparser.js';
import CSVProvider from './csvprovider.js';
import CSVImportUI from './ui/csvimportui.js';


/**
 * Provides CSV support
 */
export default class CSVPlugin extends AbstractPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.id = CSVPlugin.ID;
  }

  /**
   * @inheritDoc
   */
  init() {
    var dm = DataManager.getInstance();

    // register csv provider type
    dm.registerProviderType(new ProviderEntry(CSVPlugin.ID, CSVProvider, CSVPlugin.TYPE, CSVPlugin.TYPE));

    // register the csv descriptor type
    dm.registerDescriptorType(this.id, CSVDescriptor);

    // register the csv layer config
    var lcm = LayerConfigManager.getInstance();
    lcm.registerLayerConfig('CSV', CSVLayerConfig);

    // register the csv import ui
    var im = ImportManager.getInstance();
    im.registerImportDetails('CSV', true);
    im.registerImportUI(csv.TYPE, new CSVImportUI());
    im.registerParser(this.id, CSVParser);

    // register the csv exporter
    exportManager.registerExportMethod(new CSVExporter());
  }
}


/**
 * @type {string}
 * @const
 */
CSVPlugin.ID = 'csv';


/**
 * @type {string}
 * @const
 */
CSVPlugin.TYPE = 'CSV Layers';

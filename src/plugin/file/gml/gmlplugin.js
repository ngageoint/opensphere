goog.declareModuleId('plugin.file.gml.GMLPlugin');

import ImportManager from '../../../os/ui/im/importmanager.js';
import GMLDescriptor from './gmldescriptor.js';
import GMLImportUI from './gmlimportui.js';
import GMLLayerConfig from './gmllayerconfig.js';
import * as GMLMixin from './gmlmixin.js';
import GMLParser from './gmlparser.js';
import GMLProvider from './gmlprovider.js';
import * as mime from './mime.js';

const DataManager = goog.require('os.data.DataManager');
const ProviderEntry = goog.require('os.data.ProviderEntry');
const LayerConfigManager = goog.require('os.layer.config.LayerConfigManager');
const AbstractPlugin = goog.require('os.plugin.AbstractPlugin');


// Initialize the GML mixin.
GMLMixin.init();


/**
 * Provides GML support
 */
export default class GMLPlugin extends AbstractPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.id = ID;
  }

  /**
   * @inheritDoc
   */
  init() {
    const dm = DataManager.getInstance();

    // register gml provider type
    dm.registerProviderType(new ProviderEntry(ID, GMLProvider, TYPE, TYPE));

    // register the gml descriptor type
    dm.registerDescriptorType(this.id, GMLDescriptor);

    // register the gml layer config
    const lcm = LayerConfigManager.getInstance();
    lcm.registerLayerConfig(this.id, GMLLayerConfig);

    // register the gml import ui
    const im = ImportManager.getInstance();
    im.registerImportDetails(this.id.toUpperCase(), true);
    im.registerImportUI(mime.TYPE, new GMLImportUI());
    im.registerParser(this.id, GMLParser);
  }
}


/**
 * @type {string}
 */
const ID = 'gml';


/**
 * @type {string}
 */
const TYPE = 'GML Layers';

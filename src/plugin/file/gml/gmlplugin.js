goog.module('plugin.file.gml.GMLPlugin');

const DataManager = goog.require('os.data.DataManager');
const ProviderEntry = goog.require('os.data.ProviderEntry');
const LayerConfigManager = goog.require('os.layer.config.LayerConfigManager');
const AbstractPlugin = goog.require('os.plugin.AbstractPlugin');
const ImportManager = goog.require('os.ui.im.ImportManager');
const GMLDescriptor = goog.require('plugin.file.gml.GMLDescriptor');
const GMLImportUI = goog.require('plugin.file.gml.GMLImportUI');
const GMLLayerConfig = goog.require('plugin.file.gml.GMLLayerConfig');
const GMLMixin = goog.require('plugin.file.gml.GMLMixin');
const GMLParser = goog.require('plugin.file.gml.GMLParser');
const GMLProvider = goog.require('plugin.file.gml.GMLProvider');
const mime = goog.require('plugin.file.gml.mime');


// Initialize the GML mixin.
GMLMixin.init();


/**
 * Provides GML support
 */
class GMLPlugin extends AbstractPlugin {
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


exports = GMLPlugin;

goog.module('plugin.arc.ArcPlugin');
goog.module.declareLegacyNamespace();

const DataManager = goog.require('os.data.DataManager');
const ProviderEntry = goog.require('os.data.ProviderEntry');
const LayerConfigManager = goog.require('os.layer.config.LayerConfigManager');
const net = goog.require('os.net');
const AbstractPlugin = goog.require('os.plugin.AbstractPlugin');
const StateManager = goog.require('os.state.StateManager');
const ImportManager = goog.require('os.ui.im.ImportManager');
const ProviderImportUI = goog.require('os.ui.ProviderImportUI');
const arc = goog.require('plugin.arc');
const ArcImportForm = goog.require('plugin.arc.ArcImportForm');
const {directiveTag: arcImportEl} = goog.require('plugin.arc.ArcImportUI');
const ArcLoader = goog.require('plugin.arc.ArcLoader');
const ArcServer = goog.require('plugin.arc.ArcServer');
const ArcServerHelpUI = goog.require('plugin.arc.ArcServerHelpUI');
const ArcFeatureLayerConfig = goog.require('plugin.arc.layer.ArcFeatureLayerConfig');
const ArcImageLayerConfig = goog.require('plugin.arc.layer.ArcImageLayerConfig');
const ArcLayerDescriptor = goog.require('plugin.arc.layer.ArcLayerDescriptor');
const {registerMimeTypes} = goog.require('plugin.arc.mime');
const ArcTileLayerConfig = goog.require('plugin.arc.layer.ArcTileLayerConfig');
const arcstate = goog.require('plugin.arc.state.v2.arcstate');


/**
 * Plugin for arc server support in opensphere.
 */
class ArcPlugin extends AbstractPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.id = arc.ID;
  }

  /**
   * @inheritDoc
   */
  init() {
    registerMimeTypes();

    var dm = DataManager.getInstance();
    var arcEntry = new ProviderEntry(this.id, ArcServer, 'Arc Server',
        'Arc servers provide feature and tile data.');

    dm.registerProviderType(arcEntry);
    dm.registerDescriptorType(this.id, ArcLayerDescriptor);

    var lcm = LayerConfigManager.getInstance();
    lcm.registerLayerConfig(ArcFeatureLayerConfig.ID, ArcFeatureLayerConfig);
    lcm.registerLayerConfig(ArcTileLayerConfig.ID, ArcTileLayerConfig);
    lcm.registerLayerConfig(ArcImageLayerConfig.ID, ArcImageLayerConfig);

    var im = ImportManager.getInstance();
    im.registerImportUI(this.id, new ProviderImportUI(`<${arcImportEl}></${arcImportEl}>`));
    im.registerServerType(this.id, {
      type: 'arc',
      helpUi: ArcServerHelpUI.directiveTag,
      formUi: ArcImportForm.directiveTag,
      label: 'ArcGIS Server'
    });

    var sm = StateManager.getInstance();
    sm.addLoadFunction(arcstate.load);
    sm.addSaveFunction(arcstate.save);

    // Register a default validator to detect Arc server exceptions.
    net.registerDefaultValidator(arc.getException);

    // Set the base class for loading an Arc server.
    arc.setLoaderClass(ArcLoader);
  }
}

exports = ArcPlugin;

goog.module('plugin.xyz.XYZPlugin');
goog.module.declareLegacyNamespace();

const ConfigDescriptor = goog.require('os.data.ConfigDescriptor');
const ProviderEntry = goog.require('os.data.ProviderEntry');
const LayerConfigManager = goog.require('os.layer.config.LayerConfigManager');
const AbstractPlugin = goog.require('os.plugin.AbstractPlugin');
const ImportManager = goog.require('os.ui.im.ImportManager');
const ProviderImportUI = goog.require('os.ui.ProviderImportUI');
const XYZImport = goog.require('plugin.xyz.XYZImport');
const XYZImportForm = goog.require('plugin.xyz.XYZImportForm');
const XYZLayerConfig = goog.require('plugin.xyz.XYZLayerConfig');
const XYZProviderHelpUI = goog.require('plugin.xyz.XYZProviderHelpUI');


/**
 * Provides map layer support
 */
class XYZPlugin extends AbstractPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.id = 'xyz';
  }

  /**
   * @inheritDoc
   */
  init() {
    var lcm = LayerConfigManager.getInstance();
    lcm.registerLayerConfig('XYZ', XYZLayerConfig);

    var im = ImportManager.getInstance();
    im.registerImportUI(this.id, new ProviderImportUI('<xyzprovider></xyzprovider>'));
    im.registerServerType(this.id, {
      type: 'xyz',
      helpUi: XYZProviderHelpUI.directiveTag,
      formUi: XYZImportForm.directiveTag,
      label: 'XYZ Map Layer'
    });
  }
}

exports = XYZPlugin;

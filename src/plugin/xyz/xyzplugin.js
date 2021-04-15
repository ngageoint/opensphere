goog.module('plugin.xyz.XYZPlugin');
goog.module.declareLegacyNamespace();

const LayerConfigManager = goog.require('os.layer.config.LayerConfigManager');
const AbstractPlugin = goog.require('os.plugin.AbstractPlugin');
const XYZLayerConfig = goog.require('plugin.xyz.XYZLayerConfig');


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
  }
}

exports = XYZPlugin;

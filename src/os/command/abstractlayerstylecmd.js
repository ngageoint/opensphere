goog.module('os.command.AbstractLayerStyle');
goog.module.declareLegacyNamespace();

const AbstractStyle = goog.require('os.command.AbstractStyle');
const osImplements = goog.require('os.implements');
const ILayer = goog.require('os.layer.ILayer');


/**
 * Commands for `os.layer.ILayer` style changes should extend this class.
 *
 *
 * @template T
 */
class AbstractLayerStyle extends AbstractStyle {
  /**
   * Constructor.
   * @param {string} layerId The layer id.
   * @param {T} value The new style value.
   * @param {T=} opt_oldValue The old style value.
   */
  constructor(layerId, value, opt_oldValue) {
    super(layerId, value, opt_oldValue);
    this.updateOldValue();
  }

  /**
   * @inheritDoc
   */
  getLayerConfig(layer) {
    if (osImplements(layer, ILayer.ID)) {
      return /** @type {os.layer.ILayer} */ (layer).getLayerOptions();
    }
    return null;
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    // nothing to do right now
  }
}

exports = AbstractLayerStyle;

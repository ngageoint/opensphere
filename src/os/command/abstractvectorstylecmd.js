goog.module('os.command.AbstractVectorStyle');
goog.module.declareLegacyNamespace();

const asserts = goog.require('goog.asserts');
const AbstractStyle = goog.require('os.command.AbstractStyle');
const OSDataManager = goog.require('os.data.OSDataManager');
const {getMapContainer} = goog.require('os.map.instance');
const osStyle = goog.require('os.style');
const StyleManager = goog.require('os.style.StyleManager');


/**
 * Commands for tile style changes should extend this class
 *
 *
 * @template T
 */
class AbstractVectorStyle extends AbstractStyle {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {T} value
   * @param {T=} opt_oldValue
   */
  constructor(layerId, value, opt_oldValue) {
    super(layerId, value, opt_oldValue);
    this.updateOldValue();
  }

  /**
   * @inheritDoc
   */
  getLayerConfig(layer) {
    return layer ? StyleManager.getInstance().getLayerConfig(layer.getId()) : null;
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    var source = /** @type {os.source.Vector} */ (OSDataManager.getInstance().getSource(this.layerId));
    asserts.assert(source, 'source must be defined');

    // update feature styles. don't use forEachFeature or the rbush will throw an error due to feature changes
    // while iterating
    osStyle.setFeaturesStyle(source.getFeatures());

    // if we are using the timeline with fade enabled, we need to reset objects with this style change
    source.refreshAnimationFade();
  }

  /**
   * @inheritDoc
   */
  finish(config) {
    var layer = /** @type {os.layer.Vector} */ (getMapContainer().getLayer(this.layerId));
    asserts.assert(layer);
    osStyle.notifyStyleChange(layer);
  }
}

exports = AbstractVectorStyle;

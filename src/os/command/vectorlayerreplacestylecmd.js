goog.module('os.command.VectorLayerReplaceStyle');
goog.module.declareLegacyNamespace();

const asserts = goog.require('goog.asserts');
const AbstractVectorStyle = goog.require('os.command.AbstractVectorStyle');
const DataManager = goog.require('os.data.DataManager');
const PropertyChangeEvent = goog.require('os.events.PropertyChangeEvent');
const metrics = goog.require('os.metrics');
const PropertyChange = goog.require('os.source.PropertyChange');
const StyleField = goog.require('os.style.StyleField');
const StyleManager = goog.require('os.style.StyleManager');


/**
 * Set if a layer style should override feature style.
 */
class VectorLayerReplaceStyle extends AbstractVectorStyle {
  /**
   * Constructor.
   * @param {string} layerId The layer id.
   * @param {boolean} value The value.
   */
  constructor(layerId, value) {
    super(layerId, value);
    this.title = 'Force Layer Color';
    this.metricKey = metrics.Layer.FORCE_LAYER_COLOR;
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var config = StyleManager.getInstance().getLayerConfig(this.layerId);
    return config ? !!config[StyleField.REPLACE_STYLE] : false;
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    config[StyleField.REPLACE_STYLE] = value;

    super.applyValue(config, value);

    var source = /** @type {os.source.Vector} */ (DataManager.getInstance().getSource(this.layerId));
    asserts.assert(source, 'source must be defined');

    source.setHighlightedItems(source.getHighlightedItems());
  }

  /**
   * @inheritDoc
   */
  finish(config) {
    // dispatch the replace style change event on the source for the histogram
    var source = DataManager.getInstance().getSource(this.layerId);
    source.dispatchEvent(new PropertyChangeEvent(PropertyChange.REPLACE_STYLE, this.value));
    super.finish(config);
  }
}

exports = VectorLayerReplaceStyle;

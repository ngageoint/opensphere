goog.provide('os.command.VectorLayerReplaceStyle');

goog.require('os.command.AbstractVectorStyle');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.metrics');
goog.require('os.source.PropertyChange');



/**
 * Set if a layer style should override feature style.
 * @param {string} layerId The layer id.
 * @param {boolean} value The value.
 * @extends {os.command.AbstractVectorStyle}
 * @constructor
 */
os.command.VectorLayerReplaceStyle = function(layerId, value) {
  os.command.VectorLayerReplaceStyle.base(this, 'constructor', layerId, value);
  this.title = 'Force Layer Color';
  this.metricKey = os.metrics.Layer.FORCE_LAYER_COLOR;
};
goog.inherits(os.command.VectorLayerReplaceStyle, os.command.AbstractVectorStyle);


/**
 * @inheritDoc
 */
os.command.VectorLayerReplaceStyle.prototype.getOldValue = function() {
  var config = os.style.StyleManager.getInstance().getLayerConfig(this.layerId);
  return config ? !!config[os.style.StyleField.REPLACE_STYLE] : false;
};


/**
 * @inheritDoc
 */
os.command.VectorLayerReplaceStyle.prototype.applyValue = function(config, value) {
  config[os.style.StyleField.REPLACE_STYLE] = value;

  os.command.VectorLayerReplaceStyle.base(this, 'applyValue', config, value);

  var source = /** @type {os.source.Vector} */ (os.osDataManager.getSource(this.layerId));
  goog.asserts.assert(source, 'source must be defined');

  source.setHighlightedItems(source.getHighlightedItems());
};


/**
 * @inheritDoc
 */
os.command.VectorLayerReplaceStyle.prototype.finish = function(config) {
  // dispatch the replace style change event on the source for the histogram
  var source = os.osDataManager.getSource(this.layerId);
  source.dispatchEvent(new os.events.PropertyChangeEvent(os.source.PropertyChange.REPLACE_STYLE, this.value));
  os.command.VectorLayerReplaceStyle.base(this, 'finish', config);
};

goog.provide('os.command.VectorLayerLabel');

goog.require('os.command.AbstractVectorStyle');
goog.require('os.data.OSDataManager');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.metrics');
goog.require('os.source.PropertyChange');
goog.require('os.style.label');



/**
 * Changes the label field for a layer
 * @param {string} layerId
 * @param {Array<os.style.label.LabelConfig>} value
 * @param {Array<os.style.label.LabelConfig>=} opt_oldValue
 * @extends {os.command.AbstractVectorStyle<string>}
 * @constructor
 */
os.command.VectorLayerLabel = function(layerId, value, opt_oldValue) {
  os.command.VectorLayerLabel.base(this, 'constructor', layerId, value, opt_oldValue);
  this.title = 'Change Label';
  this.metricKey = os.metrics.Layer.LABEL_COLUMN_SELECT;
  /**
   * @type {Array<os.style.label.LabelConfig>}
   */
  this.value = value || [os.style.label.cloneConfig()];
};
goog.inherits(os.command.VectorLayerLabel, os.command.AbstractVectorStyle);


/**
 * @inheritDoc
 */
os.command.VectorLayerLabel.prototype.getOldValue = function() {
  var config = os.style.StyleManager.getInstance().getLayerConfig(this.layerId);
  return config && config[os.style.StyleField.LABELS] || [os.style.label.cloneConfig()];
};


/**
 * @inheritDoc
 */
os.command.VectorLayerLabel.prototype.applyValue = function(config, value) {
  config[os.style.StyleField.LABELS] = value;

  os.command.VectorLayerLabel.base(this, 'applyValue', config, value);
};


/**
 * @inheritDoc
 */
os.command.VectorLayerLabel.prototype.finish = function(config) {
  // dispatch the label change event on the source for the export data window
  var source = os.osDataManager.getSource(this.layerId);
  source.dispatchEvent(new os.events.PropertyChangeEvent(os.source.PropertyChange.LABEL, this.value));

  // label overlap will likely change, so update them
  os.style.label.updateShown();
  os.command.VectorLayerLabel.base(this, 'finish', config);
};

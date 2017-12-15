goog.provide('os.command.VectorLayerShowLabel');

goog.require('os.command.AbstractVectorStyle');
goog.require('os.data.OSDataManager');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.metrics');
goog.require('os.source.PropertyChange');
goog.require('os.style.label');



/**
 * Changes if labels are always shown for a layer, or on highlight only.
 * @param {string} layerId
 * @param {boolean} value
 * @param {boolean=} opt_oldValue
 * @extends {os.command.AbstractVectorStyle}
 * @constructor
 */
os.command.VectorLayerShowLabel = function(layerId, value, opt_oldValue) {
  os.command.VectorLayerShowLabel.base(this, 'constructor', layerId, value, opt_oldValue);
  this.metricKey = os.metrics.Layer.LABEL_TOGGLE;
  // make sure the value is a boolean
  this.value = value || false;
  this.title = value ? 'Show Labels' : 'Hide Labels';
};
goog.inherits(os.command.VectorLayerShowLabel, os.command.AbstractVectorStyle);


/**
 * @inheritDoc
 */
os.command.VectorLayerShowLabel.prototype.getOldValue = function() {
  var config = os.style.StyleManager.getInstance().getLayerConfig(this.layerId);
  return config && config[os.style.StyleField.SHOW_LABELS] || false;
};


/**
 * @inheritDoc
 */
os.command.VectorLayerShowLabel.prototype.applyValue = function(config, value) {
  config[os.style.StyleField.SHOW_LABELS] = value;

  if (!value) {
    var source = os.osDataManager.getSource(this.layerId);
    goog.asserts.assert(source);

    var changed = [];
    source.forEachFeature(function(feature) {
      // hide labels for all features in the source
      if (os.feature.hideLabel(feature)) {
        changed.push(feature);
      }
    });

    if (changed.length > 0) {
      os.style.setFeaturesStyle(changed);
      source.dispatchEvent(new os.events.PropertyChangeEvent(os.source.PropertyChange.STYLE, changed));
    }
  }

  os.command.VectorLayerShowLabel.base(this, 'applyValue', config, value);
};


/**
 * @inheritDoc
 */
os.command.VectorLayerShowLabel.prototype.finish = function(config) {
  // label overlap will likely change, so update them
  os.style.label.updateShown();
  os.command.VectorLayerShowLabel.base(this, 'finish', config);
};

goog.provide('os.command.VectorLayerPreset');

goog.require('os.command.AbstractVectorStyle');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.im.action.ImportActionManager');
goog.require('os.metrics.keys');
goog.require('os.object');
goog.require('os.source.PropertyChange');



/**
 * Sets a layer style preset for a layer.
 *
 * @extends {os.command.AbstractVectorStyle}
 * @param {string} layerId
 * @param {osx.layer.Preset} preset
 * @param {osx.layer.Preset=} opt_oldPreset
 * @constructor
 */
os.command.VectorLayerPreset = function(layerId, preset, opt_oldPreset) {
  os.command.VectorLayerPreset.base(this, 'constructor', layerId, preset, opt_oldPreset);
  this.title = 'Change layer preset: ' + (preset ? preset.label : 'Default');
  this.metricKey = os.metrics.Layer.PRESET;
  this.value = preset;
};
goog.inherits(os.command.VectorLayerPreset, os.command.AbstractVectorStyle);


/**
 * @inheritDoc
 */
os.command.VectorLayerPreset.prototype.getOldValue = function() {
  var layer = /** @type {os.layer.Vector} */ (this.getLayer());
  var config = layer.getLayerOptions();
  var oldValue = config['preset'];

  if (!oldValue) {
    // we didn't have a preset so create a copy of the layer options as they exist now and use that as the old value
    oldValue = /** @type {osx.layer.Preset} */ ({
      id: os.layer.preset.DEFAULT_PRESET_ID,
      layerConfig: config
    });
  }

  return oldValue;
};


/**
 * @inheritDoc
 */
os.command.VectorLayerPreset.prototype.applyValue = function(config, value) {
  var layer = this.getLayer();
  var options = layer.getLayerOptions();
  var clonedPreset = os.object.unsafeClone(value);
  var iam = os.im.action.ImportActionManager.getInstance();
  var faIds = clonedPreset && clonedPreset['featureActions'];
  var type = layer.getId();

  // set up the default feature actions
  if (Array.isArray(faIds)) {
    faIds.forEach(function(id) {
      var entry = iam.getActionEntry(id);

      if (entry) {
        entry.setEnabled(true);
      }
    });
  }

  iam.processItems(type);

  // apply the layer config (or remove the preset if the value was null)
  var presetConfig;
  if (clonedPreset) {
    if (clonedPreset.id === os.layer.preset.DEFAULT_PRESET_ID) {
      // reapply the old layer config, but don't keep reference around to it
      delete options['preset'];
      presetConfig = clonedPreset['layerConfig'];
    } else {
      options['preset'] = clonedPreset;
      presetConfig = clonedPreset['layerConfig'];
    }
  } else {
    // the user set it back to Default, so reapply a default config
    delete options['preset'];
    presetConfig = os.object.unsafeClone(os.style.DEFAULT_VECTOR_CONFIG);
  }

  if (presetConfig) {
    layer.restore(presetConfig);
  }

  os.command.VectorLayerPreset.base(this, 'applyValue', config, value);
};


/**
 * @inheritDoc
 */
os.command.VectorLayerPreset.prototype.finish = function(config) {
  // dispatch the color change event on the source for the histogram
  var source = os.osDataManager.getSource(this.layerId);
  source.dispatchEvent(new os.events.PropertyChangeEvent(os.source.PropertyChange.COLOR, this.value));
  os.command.VectorLayerPreset.base(this, 'finish', config);
};

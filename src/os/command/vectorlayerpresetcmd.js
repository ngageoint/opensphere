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
 * @param {!osx.layer.Preset} preset
 * @param {osx.layer.Preset=} opt_oldPreset
 * @constructor
 */
os.command.VectorLayerPreset = function(layerId, preset, opt_oldPreset) {
  os.command.VectorLayerPreset.base(this, 'constructor', layerId, preset, opt_oldPreset);
  this.title = 'Change layer preset: ' + preset.label;
  this.metricKey = os.metrics.Layer.PRESET;
  this.value = preset.layerConfig;

  /**
   * The preset to apply.
   * @type {!osx.layer.Preset}
   * @protected
   */
  this.preset = preset;

  /**
   * The old enabled feature action id's.
   * @type {!Array<string>}
   * @protected
   */
  this.oldFeatureActionIds = this.getOldFeatureActionIds();
};
goog.inherits(os.command.VectorLayerPreset, os.command.AbstractVectorStyle);


/**
 * @inheritDoc
 */
os.command.VectorLayerPreset.prototype.getOldValue = function() {
  var layer = /** @type {os.layer.Vector} */ (this.getLayer());
  return layer ? layer.persist() : undefined;
};


/**
 * Get the old feature action id's.
 * @return {!Array<string>}
 * @protected
 */
os.command.VectorLayerPreset.prototype.getOldFeatureActionIds = function() {
  var oldIds = [];
  var layer = /** @type {os.layer.Vector} */ (this.getLayer());
  if (layer) {
    // save the old enabled feature action id's
    var iam = os.im.action.ImportActionManager.getInstance();
    var entries = iam.getActionEntries(layer.getId());
    entries.reduce(os.im.action.reduceEnabled, oldIds);
  }

  return oldIds;
};


/**
 * @inheritDoc
 */
os.command.VectorLayerPreset.prototype.applyValue = function(config, value) {
  var layer = this.getLayer();
  if (layer) {
    // apply the layer config
    if (value) {
      layer.restore(value);
    }

    this.applyFeatureActions(layer);
  }

  os.command.VectorLayerPreset.base(this, 'applyValue', config, value);
};


/**
 * Update enabled feature actions.
 * @param {!os.layer.ILayer} layer The layer.
 * @protected
 */
os.command.VectorLayerPreset.prototype.applyFeatureActions = function(layer) {
  var iam = os.im.action.ImportActionManager.getInstance();
  var type = layer.getId();

  var faIds = this.state === os.command.State.EXECUTING ? this.preset.featureActions : this.oldFeatureActionIds;
  var faIdMap = {};
  if (faIds) {
    faIds.forEach(function(id) {
      faIdMap[id] = true;
    });
  }

  var entries = iam.getActionEntries(type);
  entries.forEach(function(e) {
    os.im.action.enableFromMap(e, faIdMap);
  });

  iam.processItems(type, undefined, true);
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

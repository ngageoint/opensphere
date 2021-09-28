goog.declareModuleId('os.command.VectorLayerPreset');

import DataManager from '../data/datamanager.js';
import PropertyChangeEvent from '../events/propertychangeevent.js';
import * as action from '../im/action/importaction.js';
import {Layer as LayerKeys} from '../metrics/metricskeys.js';
import PropertyChange from '../source/propertychange.js';
import AbstractVectorStyle from './abstractvectorstylecmd.js';
import State from './state.js';


/**
 * Sets a layer style preset for a layer.
 */
export default class VectorLayerPreset extends AbstractVectorStyle {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {!osx.layer.Preset} preset
   * @param {osx.layer.Preset=} opt_oldPreset
   */
  constructor(layerId, preset, opt_oldPreset) {
    super(layerId, preset, opt_oldPreset);
    this.title = 'Change layer preset: ' + preset.label;
    this.metricKey = LayerKeys.PRESET;
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
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var layer = /** @type {os.layer.Vector} */ (this.getLayer());
    return layer ? layer.persist() : undefined;
  }

  /**
   * Get the old feature action id's.
   * @return {!Array<string>}
   * @protected
   */
  getOldFeatureActionIds() {
    var oldIds = [];
    var layer = /** @type {os.layer.Vector} */ (this.getLayer());
    if (layer) {
      // save the old enabled feature action id's
      var iam = action.getImportActionManager();
      var entries = iam.getActionEntries(layer.getId());
      entries.reduce(action.reduceEnabled, oldIds);
    }

    return oldIds;
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    var layer = this.getLayer();
    if (layer) {
      // apply the layer config
      if (value) {
        layer.restore(value);
      }

      this.applyFeatureActions(layer);
    }

    super.applyValue(config, value);
  }

  /**
   * Update enabled feature actions.
   * @param {!os.layer.ILayer} layer The layer.
   * @protected
   */
  applyFeatureActions(layer) {
    var iam = action.getImportActionManager();
    var type = layer.getId();

    var faIds = this.state === State.EXECUTING ? this.preset.featureActions : this.oldFeatureActionIds;
    var faIdMap = {};
    if (faIds) {
      faIds.forEach(function(id) {
        faIdMap[id] = true;
      });
    }

    var entries = iam.getActionEntries(type);
    entries.forEach(function(e) {
      action.enableFromMap(e, faIdMap);
    });

    iam.processItems(type, undefined, true);
    iam.apply();
  }

  /**
   * @inheritDoc
   */
  finish(config) {
    // dispatch the color change event on the source for the histogram
    var source = DataManager.getInstance().getSource(this.layerId);
    source.dispatchEvent(new PropertyChangeEvent(PropertyChange.COLOR, this.value));
    super.finish(config);
  }
}

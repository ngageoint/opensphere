goog.declareModuleId('os.command.VectorLayerLabel');

import DataManager from '../data/datamanager.js';
import PropertyChangeEvent from '../events/propertychangeevent.js';
import {Layer as LayerKeys} from '../metrics/metricskeys.js';
import PropertyChange from '../source/propertychange.js';
import * as label from '../style/label.js';
import StyleField from '../style/stylefield.js';
import StyleManager from '../style/stylemanager_shim.js';
import AbstractVectorStyle from './abstractvectorstylecmd.js';


/**
 * Changes the label field for a layer
 *
 * @extends {AbstractVectorStyle<string>}
 */
export default class VectorLayerLabel extends AbstractVectorStyle {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {Array<label.LabelConfig>} value
   * @param {Array<label.LabelConfig>=} opt_oldValue
   */
  constructor(layerId, value, opt_oldValue) {
    super(layerId, value, opt_oldValue);
    this.title = 'Change Label';
    this.metricKey = LayerKeys.LABEL_COLUMN_SELECT;
    /**
     * @type {Array<label.LabelConfig>}
     */
    this.value = value || [label.cloneConfig()];
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var config = StyleManager.getInstance().getLayerConfig(this.layerId);
    return config && config[StyleField.LABELS] || [label.cloneConfig()];
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    config[StyleField.LABELS] = value;

    super.applyValue(config, value);
  }

  /**
   * @inheritDoc
   */
  finish(config) {
    // dispatch the label change event on the source for the export data window
    var source = DataManager.getInstance().getSource(this.layerId);
    source.dispatchEvent(new PropertyChangeEvent(PropertyChange.LABEL, this.value));

    // label overlap will likely change, so update them
    label.updateShown();
    super.finish(config);
  }
}

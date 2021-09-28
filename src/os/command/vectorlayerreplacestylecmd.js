goog.declareModuleId('os.command.VectorLayerReplaceStyle');

import DataManager from '../data/datamanager.js';
import PropertyChangeEvent from '../events/propertychangeevent.js';
import {Layer as LayerKeys} from '../metrics/metricskeys.js';
import PropertyChange from '../source/propertychange.js';
import StyleField from '../style/stylefield.js';
import StyleManager from '../style/stylemanager_shim.js';
import AbstractVectorStyle from './abstractvectorstylecmd.js';

const asserts = goog.require('goog.asserts');


/**
 * Set if a layer style should override feature style.
 */
export default class VectorLayerReplaceStyle extends AbstractVectorStyle {
  /**
   * Constructor.
   * @param {string} layerId The layer id.
   * @param {boolean} value The value.
   */
  constructor(layerId, value) {
    super(layerId, value);
    this.title = 'Force Layer Color';
    this.metricKey = LayerKeys.FORCE_LAYER_COLOR;
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

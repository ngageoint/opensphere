goog.declareModuleId('os.command.VectorLayerShowLabel');

import DataManager from '../data/datamanager.js';
import PropertyChangeEvent from '../events/propertychangeevent.js';
import * as osFeature from '../feature/feature.js';
import {Layer as LayerKeys} from '../metrics/metricskeys.js';
import PropertyChange from '../source/propertychange.js';
import * as label from '../style/label.js';
import * as osStyle from '../style/style.js';
import StyleField from '../style/stylefield.js';
import StyleManager from '../style/stylemanager_shim.js';
import AbstractVectorStyle from './abstractvectorstylecmd.js';

const asserts = goog.require('goog.asserts');


/**
 * Changes if labels are always shown for a layer, or on highlight only.
 */
export default class VectorLayerShowLabel extends AbstractVectorStyle {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {boolean} value
   * @param {boolean=} opt_oldValue
   */
  constructor(layerId, value, opt_oldValue) {
    super(layerId, value, opt_oldValue);
    this.metricKey = LayerKeys.LABEL_TOGGLE;
    // make sure the value is a boolean
    this.value = value || false;
    this.title = value ? 'Show Labels' : 'Hide Labels';
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var config = StyleManager.getInstance().getLayerConfig(this.layerId);
    return config && config[StyleField.SHOW_LABELS] || false;
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    config[StyleField.SHOW_LABELS] = value;

    if (!value) {
      var source = DataManager.getInstance().getSource(this.layerId);
      asserts.assert(source);

      var changed = [];
      source.forEachFeature(function(feature) {
        // hide labels for all features in the source
        if (osFeature.hideLabel(feature)) {
          changed.push(feature);
        }
      });

      if (changed.length > 0) {
        osStyle.setFeaturesStyle(changed);
        source.dispatchEvent(new PropertyChangeEvent(PropertyChange.STYLE, changed));
      }
    }

    super.applyValue(config, value);
  }

  /**
   * @inheritDoc
   */
  finish(config) {
    // label overlap will likely change, so update them
    label.updateShown();
    super.finish(config);
  }
}

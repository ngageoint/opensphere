goog.declareModuleId('os.command.VectorLayerShowEllipsoids');

import DataManager from '../data/datamanager.js';
import PropertyChangeEvent from '../events/propertychangeevent.js';
import {Layer as LayerKeys} from '../metrics/metricskeys.js';
import PropertyChange from '../source/propertychange.js';
import StyleField from '../style/stylefield.js';
import StyleManager from '../style/stylemanager_shim.js';
import AbstractVectorStyle from './abstractvectorstylecmd.js';


/**
 * Changes if ellipsoids are shown in 3D mode.
 */
export default class VectorLayerShowEllipsoids extends AbstractVectorStyle {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {boolean} value
   * @param {boolean=} opt_oldValue
   */
  constructor(layerId, value, opt_oldValue) {
    super(layerId, value, opt_oldValue);
    this.metricKey = LayerKeys.VECTOR_ELLIPSOID;

    // make sure the value is a boolean
    this.value = !!value;
    this.title = value ? 'Enable Ellipsoids' : 'Disable Ellipsoids';
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var config = StyleManager.getInstance().getLayerConfig(this.layerId);
    return config != null && config[StyleField.SHOW_ELLIPSOIDS] || false;
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    config[StyleField.SHOW_ELLIPSOIDS] = value;
    super.applyValue(config, value);
  }

  /**
   * @inheritDoc
   */
  finish(config) {
    var source = DataManager.getInstance().getSource(this.layerId);
    if (source) {
      var shape = source.getGeometryShape();
      source.dispatchEvent(new PropertyChangeEvent(PropertyChange.GEOMETRY_SHAPE, shape));
    }

    super.finish(config);
  }
}

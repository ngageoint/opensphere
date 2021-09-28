goog.declareModuleId('os.command.AbstractVectorLayerLOB');

import DataManager from '../data/datamanager.js';
import RecordField from '../data/recordfield.js';
import PropertyChangeEvent from '../events/propertychangeevent.js';
import PropertyChange from '../source/propertychange.js';
import AbstractVectorStyle from './abstractvectorstylecmd.js';


/**
 * Commands for vector line of bearing style changes should extend this class
 *
 *
 * @template T
 */
export default class AbstractVectorLayerLOB extends AbstractVectorStyle {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {T} value
   * @param {T=} opt_oldValue
   */
  constructor(layerId, value, opt_oldValue) {
    super(layerId, value, opt_oldValue);
  }

  /**
   * @inheritDoc
   * @suppress {accessControls}
   */
  applyValue(config, value) {
    var source = DataManager.getInstance().getSource(this.layerId);
    if (source) {
      var features = source.getFeatures();
      for (var i = 0, n = features.length; i < n; i++) { // wipe LOB styles
        features[i].values_[RecordField.LINE_OF_BEARING] = null;
        features[i].values_[RecordField.LINE_OF_BEARING_ERROR_HIGH] = null;
        features[i].values_[RecordField.LINE_OF_BEARING_ERROR_LOW] = null;
        features[i].values_[RecordField.ELLIPSE] = null;
      }
    }
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

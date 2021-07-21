goog.module('os.command.AbstractVectorLayerLOB');
goog.module.declareLegacyNamespace();

const AbstractVectorStyle = goog.require('os.command.AbstractVectorStyle');
const DataManager = goog.require('os.data.DataManager');
const RecordField = goog.require('os.data.RecordField');
const PropertyChangeEvent = goog.require('os.events.PropertyChangeEvent');
const PropertyChange = goog.require('os.source.PropertyChange');


/**
 * Commands for vector line of bearing style changes should extend this class
 *
 *
 * @template T
 */
class AbstractVectorLayerLOB extends AbstractVectorStyle {
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

exports = AbstractVectorLayerLOB;

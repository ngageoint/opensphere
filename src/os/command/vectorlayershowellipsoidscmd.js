goog.module('os.command.VectorLayerShowEllipsoids');
goog.module.declareLegacyNamespace();

const AbstractVectorStyle = goog.require('os.command.AbstractVectorStyle');
const OSDataManager = goog.require('os.data.OSDataManager');
const PropertyChangeEvent = goog.require('os.events.PropertyChangeEvent');
const metrics = goog.require('os.metrics');
const PropertyChange = goog.require('os.source.PropertyChange');
const StyleField = goog.require('os.style.StyleField');
const StyleManager = goog.require('os.style.StyleManager');


/**
 * Changes if ellipsoids are shown in 3D mode.
 */
class VectorLayerShowEllipsoids extends AbstractVectorStyle {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {boolean} value
   * @param {boolean=} opt_oldValue
   */
  constructor(layerId, value, opt_oldValue) {
    super(layerId, value, opt_oldValue);
    this.metricKey = metrics.Layer.VECTOR_ELLIPSOID;

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
    var source = OSDataManager.getInstance().getSource(this.layerId);
    if (source) {
      var shape = source.getGeometryShape();
      source.dispatchEvent(new PropertyChangeEvent(PropertyChange.GEOMETRY_SHAPE, shape));
    }

    super.finish(config);
  }
}

exports = VectorLayerShowEllipsoids;

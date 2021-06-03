goog.module('os.command.VectorLayerCenterShape');
goog.module.declareLegacyNamespace();

const AbstractVectorStyle = goog.require('os.command.AbstractVectorStyle');
const OSDataManager = goog.require('os.data.OSDataManager');
const PropertyChangeEvent = goog.require('os.events.PropertyChangeEvent');
const metrics = goog.require('os.metrics');
const PropertyChange = goog.require('os.source.PropertyChange');
const osStyle = goog.require('os.style');
const kml = goog.require('os.ui.file.kml');


/**
 * Changes the center style of a layer
 *
 * @extends {AbstractVectorStyle<string>}
 */
class VectorLayerCenterShape extends AbstractVectorStyle {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {string} style
   * @param {string=} opt_oldStyle
   */
  constructor(layerId, style, opt_oldStyle) {
    super(layerId, style, opt_oldStyle);
    this.title = 'Change Center Style';

    var type = style ? style.replace(/ /g, '_') : 'Unknown';
    this.metricKey = metrics.Layer.VECTOR_CENTER_SHAPE + metrics.SUB_DELIMITER + type;
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var oldVal;
    var source = OSDataManager.getInstance().getSource(this.layerId);
    if (source) {
      oldVal = source.getCenterGeometryShape();
    }

    return oldVal || osStyle.DEFAULT_CENTER_SHAPE;
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    // if the new shape value isn't defined, config will be set to the default value
    var source = OSDataManager.getInstance().getSource(this.layerId);
    if (source && value) {
      source.setCenterGeometryShape(value);

      // if using the icon shape, make sure the config has an icon defined
      if (value == osStyle.ShapeType.ICON && !osStyle.getConfigIcon(config)) {
        osStyle.setConfigIcon(config, kml.getDefaultIcon());
      }
    }

    super.applyValue(config, value);
  }

  /**
   * @inheritDoc
   */
  finish(config) {
    var source = OSDataManager.getInstance().getSource(this.layerId);
    source.dispatchEvent(new PropertyChangeEvent(PropertyChange.GEOMETRY_CENTER_SHAPE, this.value,
        this.oldValue));

    super.finish(config);
  }
}

exports = VectorLayerCenterShape;

goog.module('os.command.VectorLayerIcon');
goog.module.declareLegacyNamespace();

const AbstractVectorStyle = goog.require('os.command.AbstractVectorStyle');
const OSDataManager = goog.require('os.data.OSDataManager');
const PropertyChangeEvent = goog.require('os.events.PropertyChangeEvent');
const metrics = goog.require('os.metrics');
const PropertyChange = goog.require('os.source.PropertyChange');
const kml = goog.require('os.ui.file.kml');


/**
 * Configure a vector layer to display an icon.
 */
class VectorLayerIcon extends AbstractVectorStyle {
  /**
   * Constructor.
   * @param {string} layerId The layer id.
   * @param {osx.icon.Icon} icon The new icon.
   * @param {osx.icon.Icon=} opt_oldIcon The old icon.
   */
  constructor(layerId, icon, opt_oldIcon) {
    super(layerId, icon, opt_oldIcon);
    this.title = 'Change Icon';
    this.metricKey = metrics.Layer.VECTOR_ICON;
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var config = os.style.StyleManager.getInstance().getLayerConfig(this.layerId);
    return os.style.getConfigIcon(config) || kml.getDefaultIcon();
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    if (value) {
      os.style.setConfigIcon(config, value);
    }

    super.applyValue(config, value);
  }

  /**
   * @inheritDoc
   */
  finish(config) {
    var source = OSDataManager.getInstance().getSource(this.layerId);
    if (source) {
      source.dispatchEvent(new PropertyChangeEvent(PropertyChange.GEOMETRY_SHAPE));
    }

    super.finish(config);
  }
}

exports = VectorLayerIcon;

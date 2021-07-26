goog.module('os.command.VectorLayerIcon');
goog.module.declareLegacyNamespace();

const AbstractVectorStyle = goog.require('os.command.AbstractVectorStyle');
const DataManager = goog.require('os.data.DataManager');
const PropertyChangeEvent = goog.require('os.events.PropertyChangeEvent');
const {Layer: LayerKeys} = goog.require('os.metrics.keys');
const PropertyChange = goog.require('os.source.PropertyChange');
const osStyle = goog.require('os.style');
const StyleManager = goog.require('os.style.StyleManager');
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
    this.metricKey = LayerKeys.VECTOR_ICON;
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var config = StyleManager.getInstance().getLayerConfig(this.layerId);
    return osStyle.getConfigIcon(config) || kml.getDefaultIcon();
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    if (value) {
      osStyle.setConfigIcon(config, value);
    }

    super.applyValue(config, value);
  }

  /**
   * @inheritDoc
   */
  finish(config) {
    var source = DataManager.getInstance().getSource(this.layerId);
    if (source) {
      source.dispatchEvent(new PropertyChangeEvent(PropertyChange.GEOMETRY_SHAPE));
    }

    super.finish(config);
  }
}

exports = VectorLayerIcon;

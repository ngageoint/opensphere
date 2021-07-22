goog.module('os.command.FeatureIcon');
goog.module.declareLegacyNamespace();

const AbstractFeatureStyle = goog.require('os.command.AbstractFeatureStyle');
const PropertyChangeEvent = goog.require('os.events.PropertyChangeEvent');
const {Layer: LayerKeys} = goog.require('os.metrics.keys');
const osStyle = goog.require('os.style');
const kml = goog.require('os.ui.file.kml');

const Feature = goog.requireType('ol.Feature');


/**
 * Configure a feature to display an icon.
 */
class FeatureIcon extends AbstractFeatureStyle {
  /**
   * Constructor.
   * @param {string} layerId The layer id.
   * @param {string} featureId The feature id.
   * @param {osx.icon.Icon} icon The new icon.
   * @param {osx.icon.Icon=} opt_oldIcon The old icon.
   */
  constructor(layerId, featureId, icon, opt_oldIcon) {
    super(layerId, featureId, icon, opt_oldIcon);
    this.title = 'Change Feature Icon';
    this.metricKey = LayerKeys.FEATURE_ICON;
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var feature = /** @type {Feature} */ (this.getFeature());
    if (feature == null) {
      return null;
    }

    var configs = /** @type {Array<Object>|Object|undefined} */ (this.getFeatureConfigs(feature));
    if (Array.isArray(configs)) {
      configs = configs.length > 1 ? configs[1] : configs[0];
    }

    return osStyle.getConfigIcon(configs) || kml.getDefaultIcon();
  }

  /**
   * @inheritDoc
   */
  applyValue(configs, value) {
    if (value) {
      var config = configs.length > 1 ? configs[1] : configs[0]; // using 1 is specific to tracks
      osStyle.setConfigIcon(config, value);
    }

    super.applyValue(configs, value);
  }

  /**
   * @inheritDoc
   */
  finish(configs) {
    // dispatch the color change event on the source for the histogram
    var feature = this.getFeature();

    feature.dispatchEvent(new PropertyChangeEvent('colors'));

    super.finish(configs);
  }
}

exports = FeatureIcon;

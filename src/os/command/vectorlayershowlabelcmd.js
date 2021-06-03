goog.module('os.command.VectorLayerShowLabel');
goog.module.declareLegacyNamespace();

const AbstractVectorStyle = goog.require('os.command.AbstractVectorStyle');
const OSDataManager = goog.require('os.data.OSDataManager');
const PropertyChangeEvent = goog.require('os.events.PropertyChangeEvent');
const metrics = goog.require('os.metrics');
const PropertyChange = goog.require('os.source.PropertyChange');
const label = goog.require('os.style.label');


/**
 * Changes if labels are always shown for a layer, or on highlight only.
 */
class VectorLayerShowLabel extends AbstractVectorStyle {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {boolean} value
   * @param {boolean=} opt_oldValue
   */
  constructor(layerId, value, opt_oldValue) {
    super(layerId, value, opt_oldValue);
    this.metricKey = metrics.Layer.LABEL_TOGGLE;
    // make sure the value is a boolean
    this.value = value || false;
    this.title = value ? 'Show Labels' : 'Hide Labels';
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var config = os.style.StyleManager.getInstance().getLayerConfig(this.layerId);
    return config && config[os.style.StyleField.SHOW_LABELS] || false;
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    config[os.style.StyleField.SHOW_LABELS] = value;

    if (!value) {
      var source = OSDataManager.getInstance().getSource(this.layerId);
      goog.asserts.assert(source);

      var changed = [];
      source.forEachFeature(function(feature) {
        // hide labels for all features in the source
        if (os.feature.hideLabel(feature)) {
          changed.push(feature);
        }
      });

      if (changed.length > 0) {
        os.style.setFeaturesStyle(changed);
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

exports = VectorLayerShowLabel;

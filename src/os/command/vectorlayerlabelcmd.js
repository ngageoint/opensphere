goog.module('os.command.VectorLayerLabel');
goog.module.declareLegacyNamespace();

const AbstractVectorStyle = goog.require('os.command.AbstractVectorStyle');
const OSDataManager = goog.require('os.data.OSDataManager');
const PropertyChangeEvent = goog.require('os.events.PropertyChangeEvent');
const metrics = goog.require('os.metrics');
const PropertyChange = goog.require('os.source.PropertyChange');
const StyleField = goog.require('os.style.StyleField');
const StyleManager = goog.require('os.style.StyleManager');
const label = goog.require('os.style.label');


/**
 * Changes the label field for a layer
 *
 * @extends {AbstractVectorStyle<string>}
 */
class VectorLayerLabel extends AbstractVectorStyle {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {Array<label.LabelConfig>} value
   * @param {Array<os.style.label.LabelConfig>=} opt_oldValue
   */
  constructor(layerId, value, opt_oldValue) {
    super(layerId, value, opt_oldValue);
    this.title = 'Change Label';
    this.metricKey = metrics.Layer.LABEL_COLUMN_SELECT;
    /**
     * @type {Array<label.LabelConfig>}
     */
    this.value = value || [label.cloneConfig()];
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var config = StyleManager.getInstance().getLayerConfig(this.layerId);
    return config && config[StyleField.LABELS] || [label.cloneConfig()];
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    config[StyleField.LABELS] = value;

    super.applyValue(config, value);
  }

  /**
   * @inheritDoc
   */
  finish(config) {
    // dispatch the label change event on the source for the export data window
    var source = OSDataManager.getInstance().getSource(this.layerId);
    source.dispatchEvent(new PropertyChangeEvent(PropertyChange.LABEL, this.value));

    // label overlap will likely change, so update them
    label.updateShown();
    super.finish(config);
  }
}

exports = VectorLayerLabel;

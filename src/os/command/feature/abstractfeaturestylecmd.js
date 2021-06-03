goog.module('os.command.AbstractFeatureStyle');
goog.module.declareLegacyNamespace();

const GoogEvent = goog.require('goog.events.Event');
const dispatcher = goog.require('os.Dispatcher');
const EventType = goog.require('os.action.EventType');
const AbstractStyle = goog.require('os.command.AbstractStyle');
const State = goog.require('os.command.State');
const OSDataManager = goog.require('os.data.OSDataManager');


/**
 * Commands for feature style changes should extend this class
 * @template T
 */
class AbstractFeatureStyle extends AbstractStyle {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {string} featureId
   * @param {T} value
   * @param {T=} opt_oldValue
   */
  constructor(layerId, featureId, value, opt_oldValue) {
    super(layerId, value, opt_oldValue);

    /**
     * @type {string}
     * @protected
     */
    this.featureId = featureId;
    this.updateOldValue();
  }

  /**
   * @inheritDoc
   */
  canExecute() {
    if (!this.featureId) {
      this.state = State.ERROR;
      this.details = 'Feature id not provided.';
      return false;
    }

    return super.canExecute();
  }

  /**
   * @inheritDoc
   */
  applyValue(configs, value) {
    var feature = /** @type {ol.Feature} */ (this.getFeature());
    var source = OSDataManager.getInstance().getSource(this.layerId);
    goog.asserts.assert(source, 'source must be defined');

    // update feature styles. don't use forEachFeature or the rbush will throw an error due to feature changes
    // while iterating
    os.style.setFeatureStyle(/** @type {!ol.Feature} */ (feature));
    dispatcher.getInstance().dispatchEvent(EventType.SAVE_FEATURE);
    // feature.dispatchEvent(new os.events.PropertyChangeEvent('icons'));

    // if we are using the timeline with fade enabled, we need to reset objects with this style change
    source.refreshAnimationFade();
  }

  /**
   * @inheritDoc
   */
  finish(configs) {
    dispatcher.getInstance().dispatchEvent(new GoogEvent(EventType.REFRESH));
    var feature = /** @type {ol.Feature} */ (this.getFeature());
    var layer = os.MapContainer.getInstance().getLayer(this.layerId);
    goog.asserts.assert(layer, 'layer must be defined');
    os.style.notifyStyleChange(layer, [feature]);
  }

  /**
   * Get the layer configuration.
   *
   * @param {ol.Feature} feature
   * @return {Array<Object>}
   * @protected
   */
  getFeatureConfigs(feature) {
    var configs = /** @type {Array<Object>|Object|undefined} */ (feature.get(os.style.StyleType.FEATURE));

    if (Array.isArray(configs)) {
      return configs;
    } else if (configs) {
      return [configs];
    }
    return null;
  }

  /**
   * @inheritDoc
   */
  setValue(value) {
    goog.asserts.assert(value != null, 'style value must be defined');

    var feature = /** @type {ol.Feature} */ (this.getFeature());
    var configs = this.getFeatureConfigs(feature);
    goog.asserts.assert(configs, 'feature config must be defined');

    this.applyValue(configs, value);
    this.finish(configs);
  }

  /**
   * Gets the feature
   *
   * @return {ol.Feature}
   */
  getFeature() {
    var feature = null;

    if (this.layerId != null && this.featureId != null) {
      var source = OSDataManager.getInstance().getSource(this.layerId);
      goog.asserts.assert(source, 'source must be defined');

      feature = source.getFeatureById(this.featureId);
      goog.asserts.assert(feature, 'feature must be defined');
    }

    return feature;
  }
}

exports = AbstractFeatureStyle;

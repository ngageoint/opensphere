goog.provide('os.command.AbstractFeatureStyle');

goog.require('goog.events.Event');
goog.require('os.action.EventType');
goog.require('os.command.AbstractStyle');
goog.require('os.command.ICommand');
goog.require('os.command.State');
goog.require('os.layer.PropertyChange');


/**
 * Commands for feature style changes should extend this class
 *
 * @param {string} layerId
 * @param {string} featureId
 * @param {T} value
 * @param {T=} opt_oldValue
 *
 * @extends {os.command.AbstractStyle}
 * @constructor
 * @template T
 */
os.command.AbstractFeatureStyle = function(layerId, featureId, value, opt_oldValue) {
  /**
   * @type {string}
   * @protected
   */
  this.featureId = featureId;

  os.command.AbstractFeatureStyle.base(this, 'constructor', layerId, value, opt_oldValue);
};
goog.inherits(os.command.AbstractFeatureStyle, os.command.AbstractStyle);


/**
 * @inheritDoc
 */
os.command.AbstractFeatureStyle.prototype.canExecute = function() {
  if (!this.featureId) {
    this.state = os.command.State.ERROR;
    this.details = 'Feature id not provided.';
    return false;
  }

  return os.command.AbstractFeatureStyle.superClass_.canExecute.call(this);
};


/**
 * @inheritDoc
 */
os.command.AbstractFeatureStyle.prototype.applyValue = function(configs, value) {
  var feature = /** @type {ol.Feature} */ (this.getFeature());
  var source = os.osDataManager.getSource(this.layerId);
  goog.asserts.assert(source, 'source must be defined');

  // update feature styles. don't use forEachFeature or the rbush will throw an error due to feature changes
  // while iterating
  os.style.setFeatureStyle(/** @type {!ol.Feature} */ (feature));
  os.dispatcher.dispatchEvent(os.action.EventType.SAVE_FEATURE);
  // feature.dispatchEvent(new os.events.PropertyChangeEvent('icons'));

  // if we are using the timeline with fade enabled, we need to reset objects with this style change
  source.refreshAnimationFade();
};


/**
 * @inheritDoc
 */
os.command.AbstractFeatureStyle.prototype.finish = function(configs) {
  os.dispatcher.dispatchEvent(new goog.events.Event(os.action.EventType.REFRESH));
  var feature = /** @type {ol.Feature} */ (this.getFeature());
  var layer = os.MapContainer.getInstance().getLayer(this.layerId);
  goog.asserts.assert(layer, 'layer must be defined');
  os.style.notifyStyleChange(layer, [feature]);
};


/**
 * Get the layer configuration.
 *
 * @param {ol.Feature} feature
 * @return {Array<Object>}
 * @protected
 */
os.command.AbstractFeatureStyle.prototype.getFeatureConfigs = function(feature) {
  var configs = /** @type {Array<Object>|Object|undefined} */ (feature.get(os.style.StyleType.FEATURE));

  if (Array.isArray(configs)) {
    return configs;
  } else if (configs) {
    return [configs];
  }
  return null;
};


/**
 * @inheritDoc
 */
os.command.AbstractFeatureStyle.prototype.setValue = function(value) {
  goog.asserts.assert(value != null, 'style value must be defined');

  var feature = /** @type {ol.Feature} */ (this.getFeature());
  var configs = this.getFeatureConfigs(feature);
  goog.asserts.assert(configs, 'feature config must be defined');

  this.applyValue(configs, value);
  this.finish(configs);
};


/**
 * Gets the feature
 *
 * @return {ol.Feature}
 */
os.command.AbstractFeatureStyle.prototype.getFeature = function() {
  var source = os.osDataManager.getSource(this.layerId);
  goog.asserts.assert(source, 'source must be defined');

  var feature = source.getFeatureById(this.featureId);
  goog.asserts.assert(feature, 'feature must be defined');

  return feature;
};

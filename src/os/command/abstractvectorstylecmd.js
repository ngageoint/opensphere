goog.provide('os.command.AbstractVectorStyle');

goog.require('os.command.AbstractStyle');
goog.require('os.data.OSDataManager');
goog.require('os.style');
goog.require('os.style.StyleManager');



/**
 * Commands for tile style changes should extend this class
 *
 * @param {string} layerId
 * @param {T} value
 * @param {T=} opt_oldValue
 *
 * @extends {os.command.AbstractStyle}
 * @constructor
 * @template T
 */
os.command.AbstractVectorStyle = function(layerId, value, opt_oldValue) {
  os.command.AbstractVectorStyle.base(this, 'constructor', layerId, value, opt_oldValue);
};
goog.inherits(os.command.AbstractVectorStyle, os.command.AbstractStyle);


/**
 * @inheritDoc
 */
os.command.AbstractVectorStyle.prototype.getLayerConfig = function(layer) {
  return layer ? os.style.StyleManager.getInstance().getLayerConfig(layer.getId()) : null;
};


/**
 * @inheritDoc
 */
os.command.AbstractVectorStyle.prototype.applyValue = function(config, value) {
  var source = /** @type {os.source.Vector} */ (os.osDataManager.getSource(this.layerId));
  goog.asserts.assert(source, 'source must be defined');

  // update feature styles. don't use forEachFeature or the rbush will throw an error due to feature changes
  // while iterating
  os.style.setFeaturesStyle(source.getFeatures());

  // if we are using the timeline with fade enabled, we need to reset objects with this style change
  source.refreshAnimationFade();
};


/**
 * @inheritDoc
 */
os.command.AbstractVectorStyle.prototype.finish = function(config) {
  var layer = /** @type {os.layer.Vector} */ (os.MapContainer.getInstance().getLayer(this.layerId));
  goog.asserts.assert(layer);
  os.style.notifyStyleChange(layer);
};

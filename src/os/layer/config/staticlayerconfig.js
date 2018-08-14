goog.provide('os.layer.config.StaticLayerConfig');
goog.require('goog.asserts');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.layer.Vector');
goog.require('os.layer.config.AbstractLayerConfig');
goog.require('os.source.Vector');



/**
 * Config for a layer containing static data.
 * @extends {os.layer.config.AbstractLayerConfig}
 * @constructor
 * @template T
 */
os.layer.config.StaticLayerConfig = function() {
  os.layer.config.StaticLayerConfig.base(this, 'constructor');
  this.log = os.layer.config.StaticLayerConfig.LOGGER_;

  /**
   * @type {boolean}
   * @protected
   */
  this.animate = false;

  /**
   * @type {Array<!ol.Feature>}
   * @protected
   */
  this.data = null;
};
goog.inherits(os.layer.config.StaticLayerConfig, os.layer.config.AbstractLayerConfig);


/**
 * Id for this layer config
 * @type {string}
 * @const
 */
os.layer.config.StaticLayerConfig.ID = 'static';


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.layer.config.StaticLayerConfig.LOGGER_ = goog.log.getLogger('os.layer.config.StaticLayerConfig');


/**
 * @inheritDoc
 */
os.layer.config.StaticLayerConfig.prototype.initializeConfig = function(options) {
  os.layer.config.StaticLayerConfig.base(this, 'initializeConfig', options);

  this.animate = goog.isDef(options['animate']) ? options['animate'] : false;

  if (goog.isArray(options['data'])) {
    // make sure the array was created in this context
    this.data = options['data'] = options['data'] instanceof Array ? options['data'] :
        goog.array.clone(options['data']);
  } else {
    this.data = null;
  }
};


/**
 * @inheritDoc
 */
os.layer.config.StaticLayerConfig.prototype.createLayer = function(options) {
  this.initializeConfig(options);

  var source = this.getSource(options);
  source.setId(this.id);
  source.setTitle(this.title);
  source.setTimeEnabled(this.animate);

  var layer = this.getLayer(source, options);
  this.restore(layer, options);

  if (goog.isDefAndNotNull(options['explicitType'])) {
    layer.setExplicitType(/** @type {string} */ (options['explicitType']));
  }

  if (this.data) {
    source.addFeatures(this.data);
  }

  return layer;
};


/**
 * Restores the layer from the options
 * @param {os.layer.Vector} layer
 * @param {Object.<string, *>} options
 * @protected
 */
os.layer.config.StaticLayerConfig.prototype.restore = function(layer, options) {
  if (options) {
    layer.restore(options);
  }
};


/**
 * @param {ol.source.Vector} source The layer source.
 * @param {Object<string, *>} options
 * @return {os.layer.Vector}
 * @protected
 */
os.layer.config.StaticLayerConfig.prototype.getLayer = function(source, options) {
  return new os.layer.Vector({
    source: source
  });
};


/**
 * @param {Object.<string, *>} options Layer configuration options.
 * @return {os.source.Vector}
 * @protected
 */
os.layer.config.StaticLayerConfig.prototype.getSource = function(options) {
  return new os.source.Vector(undefined);
};

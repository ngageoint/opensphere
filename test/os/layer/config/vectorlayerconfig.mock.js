goog.provide('os.layer.config.MockVectorLayerConfig');

goog.require('os.layer.Vector');
goog.require('os.layer.config.AbstractLayerConfig');
goog.require('os.source.Vector');


/**
 * @constructor
 */
os.layer.config.MockVectorLayerConfig = function() {
  goog.base(this);
};
goog.inherits(os.layer.config.MockVectorLayerConfig, os.layer.config.AbstractLayerConfig);


/**
 * @type {string}
 * @const
 */
os.layer.config.MockVectorLayerConfig.TYPE = 'MockVectorLayerConfig';


/**
 * @param {Object} options The layer options.
 * @return {os.layer.Vector}
 */
os.layer.config.MockVectorLayerConfig.prototype.createLayer = function(options) {
  var layer = new os.layer.Vector({
    source: new os.source.Vector()
  });

  if (options['id']) {
    layer.setId(options['id']);
  }

  return layer;
};

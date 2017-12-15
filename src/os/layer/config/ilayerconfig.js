goog.provide('os.layer.config.ILayerConfig');
goog.require('ol.layer.Layer');



/**
 * @interface
 */
os.layer.config.ILayerConfig = function() {};


/**
 * @param {Object.<string, *>} options Layer configuration options.
 * @return {ol.layer.Layer}
 */
os.layer.config.ILayerConfig.prototype.createLayer;

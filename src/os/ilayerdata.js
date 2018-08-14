goog.provide('os.ILayerData');
goog.require('ol.layer.Layer');



/**
 * @interface
 */
os.ILayerData = function() {};


/**
 * The map layer tied to the command.
 * @type {ol.layer.Layer}
 */
os.ILayerData.prototype.layer;


/**
 * The configuration for the map layer.
 * @type {Object}
 */
os.ILayerData.prototype.layerOptions;

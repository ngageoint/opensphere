goog.provide('os.LayerData');
goog.require('os.ILayerData');



/**
 * A data set of nodes and links
 * @implements {os.ILayerData}
 * @constructor
 */
os.LayerData = function() {};


/**
 * @inheritDoc
 */
os.LayerData.prototype.layer = null;


/**
 * @inheritDoc
 */
os.LayerData.prototype.layerOptions = null;

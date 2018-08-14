goog.provide('os.ui.ogc.wms.AbstractWMSLayerParser');

goog.require('os.ui.ogc.IOGCDescriptor');
goog.require('os.ui.ogc.wms.IWMSLayer');
goog.require('os.ui.ogc.wms.IWMSLayerParser');



/**
 * @implements {os.ui.ogc.wms.IWMSLayerParser}
 * @constructor
 */
os.ui.ogc.wms.AbstractWMSLayerParser = function() {};


/**
 * @inheritDoc
 */
os.ui.ogc.wms.AbstractWMSLayerParser.prototype.parseLayerId = function(node) {
  return /** @type {string} */ (node['Name']);
};


/**
 * @inheritDoc
 */
os.ui.ogc.wms.AbstractWMSLayerParser.prototype.parseLayerTitle = function(node) {
  return /** @type {string}{ */ (node['Title']);
};


/**
 * @inheritDoc
 */
os.ui.ogc.wms.AbstractWMSLayerParser.prototype.parseLayer = goog.abstractMethod;


/**
 * @param {Object} node The JSON object node for the layer
 * @param {os.ui.ogc.wms.IWMSLayer} layer The layer
 */
os.ui.ogc.wms.AbstractWMSLayerParser.prototype.addAttribution = function(node, layer) {
  if (node) {
    var text = /** @type {string} */ (goog.object.getValueByKeys(node, ['Attribution', 'Title']) || '');

    if (text) {
      var link = /** @type {string} */ (goog.object.getValueByKeys(node, ['Attribution', 'OnlineResource']) || '');

      if (link) {
        text = '<a href="' + link + '" target="_blank">' + text + '</a>';
      }

      layer.setAttribution(os.ui.sanitize(text));
    }
  }
};


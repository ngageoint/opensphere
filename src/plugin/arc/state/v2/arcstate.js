goog.provide('plugin.arc.state.v2.arcstate');

goog.require('ol.xml');
goog.require('os.ogc.spatial');
goog.require('os.state.v2.FilterTag');
goog.require('os.xml');


/**
 * @fileoverview This class provides a couple of Arc state pre/post processor functions to alter Arc tile layers for
 * compatibility with legacy applications.
 */


/**
 * opensphere uses the `<layer type="arctile">` to directly fetch a layer config for LayerConfigManager. The load
 * function performs this alteration by looking at all `<layer type="wms">` elements, checking if they have a
 * `<provider>ArcMap</provider>` element under them, and changing the type on the layer element to arctile.
 * @param {!Element} el
 */
plugin.arc.state.v2.arcstate.load = function(el) {
  var wmsLayers = el.querySelectorAll('layer[type="wms"]');
  for (var i = 0, ii = wmsLayers.length; i < ii; i++) {
    var layer = wmsLayers[i];
    var providerEle = layer.querySelector('provider');
    if (providerEle) {
      var content = ol.xml.getAllTextContent(providerEle, true).trim();
      if (content === 'ArcMap') {
        // we found an Arc layer, modify it to match what opensphere expects
        goog.dom.removeNode(providerEle);
        layer.setAttribute('type', plugin.arc.layer.ArcTileLayerConfig.ID);
      }
    }

    var urlElement = layer.querySelector('url');
    if (urlElement) {
      var url = ol.xml.getAllTextContent(urlElement, true).trim();
      if (goog.string.endsWith(url, '/export')) {
        // prune off the /export since OL3's TileArcGISRestSource doesn't like it
        var newUrl = url.substring(0, url.length - 7);
        goog.dom.setTextContent(urlElement, newUrl);
      }
    }
  }

  var arcFeatureLayers = el.querySelectorAll('layer[type="arc"]');
  for (var j = 0, jj = arcFeatureLayers.length; j < jj; j++) {
    // change feature layer type to match the ArcFeatureLayerConfig ID
    var featureLayer = arcFeatureLayers[j];
    featureLayer.setAttribute('type', plugin.arc.layer.ArcFeatureLayerConfig.ID);
  }
};


/**
 * In legacy apps, all tile layers are considered to be of type WMS, while the `<provider>` tag in the layer
 * determines what the actual type is (i.e. Arc vs. OGC WMS). The save function facilities this by changing
 * the `<layer type="arctile">` that opensphere writes natively to `<layer type="wms">` and placing a
 * `<provider>ArcMap</provider>` tag inside.
 * @param {!Element} el
 */
plugin.arc.state.v2.arcstate.save = function(el) {
  var arcTileLayers = el.querySelectorAll('layer[type="' + plugin.arc.layer.ArcTileLayerConfig.ID + '"]');
  for (var i = 0, ii = arcTileLayers.length; i < ii; i++) {
    var layer = arcTileLayers[i];
    // change the type from arctile to wms
    layer.setAttribute('type', 'wms');
    // add the provider element with ArcMap for content
    os.xml.appendElement('provider', layer, 'ArcMap');

    // check whether the URL ends with /export
    var urlElement = layer.querySelector('url');
    if (urlElement) {
      var url = ol.xml.getAllTextContent(urlElement, true).trim();
      if (!goog.string.endsWith(url, '/export')) {
        // add /export to the end since 2D expects that
        var newUrl = url + '/export';
        goog.dom.setTextContent(urlElement, newUrl);
      }
    }
  }

  var arcFeatureLayers = el.querySelectorAll('layer[type="' + plugin.arc.layer.ArcFeatureLayerConfig.ID + '"]');
  for (var j = 0, jj = arcFeatureLayers.length; j < jj; j++) {
    // change feature layer type to match what 2D expects
    var featureLayer = arcFeatureLayers[j];
    featureLayer.setAttribute('type', 'arc');
  }
};

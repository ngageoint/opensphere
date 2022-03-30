goog.declareModuleId('plugin.arc.state.v2.arcstate');

import {getAllTextContent} from 'ol/src/xml.js';
import * as xml from '../../../../os/xml.js';
import ArcFeatureLayerConfig from '../../layer/arcfeaturelayerconfig.js';
import ArcTileLayerConfig from '../../layer/arctilelayerconfig.js';

const dom = goog.require('goog.dom');
const googString = goog.require('goog.string');


/**
 * opensphere uses the `<layer type="arctile">` to directly fetch a layer config for LayerConfigManager. The load
 * function performs this alteration by looking at all `<layer type="wms">` elements, checking if they have a
 * `<provider>ArcMap</provider>` element under them, and changing the type on the layer element to arctile.
 *
 * @param {!Element} el
 */
export const load = function(el) {
  var wmsLayers = el.querySelectorAll('layer[type="wms"]');
  for (var i = 0, ii = wmsLayers.length; i < ii; i++) {
    var layer = wmsLayers[i];
    var providerEle = layer.querySelector('provider');
    if (providerEle) {
      var content = getAllTextContent(providerEle, true).trim();
      if (content === 'ArcMap') {
        // we found an Arc layer, modify it to match what opensphere expects
        dom.removeNode(providerEle);
        layer.setAttribute('type', ArcTileLayerConfig.ID);
      }
    }

    var urlElement = layer.querySelector('url');
    if (urlElement) {
      var url = getAllTextContent(urlElement, true).trim();
      if (googString.endsWith(url, '/export')) {
        // prune off the /export since OL3's TileArcGISRestSource doesn't like it
        var newUrl = url.substring(0, url.length - 7);
        dom.setTextContent(urlElement, newUrl);
      }
    }
  }

  var arcFeatureLayers = el.querySelectorAll('layer[type="arc"]');
  for (var j = 0, jj = arcFeatureLayers.length; j < jj; j++) {
    // change feature layer type to match the ArcFeatureLayerConfig ID
    var featureLayer = arcFeatureLayers[j];
    featureLayer.setAttribute('type', ArcFeatureLayerConfig.ID);
  }
};

/**
 * In legacy apps, all tile layers are considered to be of type WMS, while the `<provider>` tag in the layer
 * determines what the actual type is (i.e. Arc vs. OGC WMS). The save function facilities this by changing
 * the `<layer type="arctile">` that opensphere writes natively to `<layer type="wms">` and placing a
 * `<provider>ArcMap</provider>` tag inside.
 *
 * @param {!Element} el
 */
export const save = function(el) {
  var arcTileLayers = el.querySelectorAll('layer[type="' + ArcTileLayerConfig.ID + '"]');
  for (var i = 0, ii = arcTileLayers.length; i < ii; i++) {
    var layer = arcTileLayers[i];
    // change the type from arctile to wms
    layer.setAttribute('type', 'wms');
    // add the provider element with ArcMap for content
    xml.appendElement('provider', layer, 'ArcMap');

    // check whether the URL ends with /export
    var urlElement = layer.querySelector('url');
    if (urlElement) {
      var url = getAllTextContent(urlElement, true).trim();
      if (!googString.endsWith(url, '/export')) {
        // add /export to the end since 2D expects that
        var newUrl = url + '/export';
        dom.setTextContent(urlElement, newUrl);
      }
    }
  }

  var arcFeatureLayers = el.querySelectorAll('layer[type="' + ArcFeatureLayerConfig.ID + '"]');
  for (var j = 0, jj = arcFeatureLayers.length; j < jj; j++) {
    // change feature layer type to match what 2D expects
    var featureLayer = arcFeatureLayers[j];
    featureLayer.setAttribute('type', 'arc');
  }
};

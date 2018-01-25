/**
 * @fileoverview Helpers for functional programming with the opensphere/openlayers API
 */

goog.provide('os.fn');

goog.require('ol.extent');
goog.require('ol.layer.Layer');
goog.require('os.extent');
goog.require('os.geo');


/**
 * @param {*} item The item
 * @return {boolean} Whether or not the item is truthy
 */
os.fn.filterFalsey = function(item) {
  return !!item;
};


/**
 * Reduce layers to a combined extent.
 *
 * @example
 * var extent = layers.reduce(os.fn.reduceExtentFromLayers, ol.extent.createEmpty());
 *
 * @param {!ol.Extent} extent The extent
 * @param {!(os.layer.ILayer|ol.layer.Layer)} layer The layer
 * @return {!ol.Extent} The combined extent
 */
os.fn.reduceExtentFromLayers = function(extent, layer) {
  if (layer instanceof ol.layer.Layer) {
    var olayer = /** @type {ol.layer.Layer} */ (layer);
    var ex = olayer.getExtent();

    if (!ex) {
      var source = olayer.getSource();

      // We are explicitly ignoring tile sources. Extents from tile layers are
      // often automatically computed from the underlying vector data in the back-end WMS
      // or Arc services. For many sources this results in a large, but not quite
      // full-world, extent.
      //
      // Will: I'll argue that it is the user's fault if they select a tile layer and do
      //    something with its extent (generally zoom I guess?) and that the check should
      //    be removed entirely.
      if (source instanceof ol.source.Vector) {
        ex = /** @type {ol.source.Vector} */ (source).getExtent();
      }
    }

    if (ex) {
      ol.extent.extend(extent, ex);
    }
  }

  return extent;
};


/**
 * @param {!ol.Extent} extent The extent
 * @param {?(ol.geom.Geometry|{geometry: ol.geom.Geometry})} geometry The geometry
 * @return {!ol.Extent} The combined extent
 */
os.fn.reduceExtentFromGeometries = function(extent, geometry) {
  if (geometry) {
    var geom = geometry instanceof ol.geom.Geometry ? geometry : geometry.geometry;

    if (geom) {
      ol.extent.extend(extent, os.extent.getFunctionalExtent(geom));
    }
  }

  return extent;
};


/**
 * @param {undefined|null|ol.Feature} feature The feature
 * @return {undefined|ol.geom.Geometry} The geom
 */
os.fn.mapFeatureToGeometry = function(feature) {
  return feature ? feature.getGeometry() : undefined;
};


/**
 * Map a tree node to a layer.
 * @param {os.structs.ITreeNode} node The tree node.
 * @return {os.layer.ILayer|undefined} layer The layer, or undefined if not a layer node.
 */
os.fn.mapNodeToLayer = function(node) {
  return node instanceof os.data.LayerNode ? node.getLayer() : undefined;
};


/**
 * Map tree node(s) to layers.
 * @param {Array<os.structs.ITreeNode>|os.structs.ITreeNode|undefined} nodes The tree nodes.
 * @return {!Array<!os.layer.ILayer>} layers The layers.
 */
os.fn.nodesToLayers = function(nodes) {
  if (!nodes) {
    return [];
  }

  if (!goog.isArray(nodes)) {
    nodes = [nodes];
  }

  return nodes.map(os.fn.mapNodeToLayer).filter(os.fn.filterFalsey);
};



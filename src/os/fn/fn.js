/**
 * @fileoverview Helpers for functional programming with the opensphere/openlayers API
 */

goog.provide('os.fn');

goog.require('ol.extent');
goog.require('ol.geom.GeometryType');
goog.require('ol.layer.Layer');
goog.require('os.extent');


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

      if (source instanceof ol.source.Vector ||
          source instanceof ol.source.UrlTile) {
        ex = (/** @type {ol.source.Vector|ol.source.UrlTile} */ (source)).getExtent();
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
 * @param {?(ol.geom.Geometry|{geometry: ol.geom.Geometry})|undefined} geometry The geometry
 * @return {!ol.Extent} The combined extent
 */
os.fn.reduceExtentFromGeometries = function(extent, geometry) {
  if (geometry) {
    var geom = /** @type {ol.geom.Geometry} */ (
      /** @type {ol.geom.Geometry} */ (geometry).getType ? geometry : geometry.geometry);

    if (geom) {
      ol.extent.extend(extent, os.extent.getFunctionalExtent(geom));
    }
  }

  return extent;
};


/**
 * @param {!Array<number>} extent
 * @param {?ol.geom.Geometry|undefined} geometry
 * @return {!Array<number>}
 */
os.fn.reduceAltitudeExtentFromGeometries = function(extent, geometry) {
  if (geometry) {
    var type = geometry.getType();

    if (type === ol.geom.GeometryType.GEOMETRY_COLLECTION) {
      var geoms = /** @type {ol.geom.GeometryCollection} */ (geometry).getGeometriesArray();
      extent = geoms.reduce(os.fn.reduceAltitudeExtentFromGeometries, extent);
    } else {
      geometry = /** @type {ol.geom.SimpleGeometry} */ (geometry);
      var flats = geometry.getFlatCoordinates();
      var stride = geometry.getStride();

      for (var i = 0, n = flats.length; i < n; i += stride) {
        var alt = flats[i + 2] || 0;
        extent[0] = Math.min(extent[0], alt);
        extent[1] = Math.max(extent[1], alt);
      }
    }
  }

  return extent;
};


/**
 * @param {undefined|null|ol.layer.Layer} layer The layer
 * @return {undefined|ol.source.Source} The source, if any
 */
os.fn.mapLayerToSource = function(layer) {
  return layer ? layer.getSource() : undefined;
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
 *
 * @param {undefined|null|os.structs.ITreeNode} node The tree node.
 * @return {os.layer.ILayer|undefined} layer The layer, or undefined if not a layer node.
 */
os.fn.mapNodeToLayer = function(node) {
  return node instanceof os.data.LayerNode ? node.getLayer() : undefined;
};


/**
 * Map tree node(s) to layers.
 *
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



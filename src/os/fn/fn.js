/**
 * @fileoverview Helpers for functional programming with the opensphere/openlayers API
 */
goog.declareModuleId('os.fn');

import * as olExtent from 'ol/src/extent.js';
import GeometryType from 'ol/src/geom/GeometryType.js';
import Layer from 'ol/src/layer/Layer.js';
import UrlTile from 'ol/src/source/UrlTile.js';
import OLVectorSource from 'ol/src/source/Vector.js';

import * as osExtent from '../extent.js';
import osImplements from '../implements.js';
import ILayerProvider from '../layer/ilayerprovider.js';

const {default: ILayer} = goog.requireType('os.layer.ILayer');
const {default: ITreeNode} = goog.requireType('os.structs.ITreeNode');


/**
 * @param {*} item The item
 * @return {boolean} Whether or not the item is truthy
 */
export const filterFalsey = function(item) {
  return !!item;
};

/**
 * Reduce layers to a combined extent.
 *
 * @example
 * var extent = layers.reduce(os.fn.reduceExtentFromLayers, olExtent.createEmpty());
 *
 * @param {!ol.Extent} extent The extent
 * @param {!(ILayer|Layer)} layer The layer
 * @return {!ol.Extent} The combined extent
 */
export const reduceExtentFromLayers = function(extent, layer) {
  if (layer instanceof Layer) {
    var olayer = /** @type {Layer} */ (layer);
    var ex = olayer.getExtent();

    if (!ex) {
      var source = olayer.getSource();

      if (source instanceof OLVectorSource ||
          source instanceof UrlTile) {
        ex = (/** @type {OLVectorSource|UrlTile} */ (source)).getExtent();
      }
    }

    if (ex) {
      olExtent.extend(extent, ex);
    }
  }

  return extent;
};

/**
 * @param {!ol.Extent} extent The extent
 * @param {?(Geometry|{geometry: Geometry})|undefined} geometry The geometry
 * @return {!ol.Extent} The combined extent
 */
export const reduceExtentFromGeometries = function(extent, geometry) {
  if (geometry) {
    var geom = /** @type {Geometry} */ (
      /** @type {Geometry} */ (geometry).getType ? geometry : geometry.geometry);

    if (geom) {
      olExtent.extend(extent, osExtent.getFunctionalExtent(geom));
    }
  }

  return extent;
};

/**
 * @param {!Array<number>} extent
 * @param {?Geometry|undefined} geometry
 * @return {!Array<number>}
 */
export const reduceAltitudeExtentFromGeometries = function(extent, geometry) {
  if (geometry) {
    var type = geometry.getType();

    if (type === GeometryType.GEOMETRY_COLLECTION) {
      var geoms = /** @type {GeometryCollection} */ (geometry).getGeometriesArray();
      extent = geoms.reduce(reduceAltitudeExtentFromGeometries, extent);
    } else {
      geometry = /** @type {SimpleGeometry} */ (geometry);
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
 * @param {undefined|null|Layer} layer The layer
 * @return {undefined|Source} The source, if any
 */
export const mapLayerToSource = function(layer) {
  return layer ? layer.getSource() : undefined;
};

/**
 * @param {undefined|null|Feature} feature The feature
 * @return {undefined|Geometry} The geom
 */
export const mapFeatureToGeometry = function(feature) {
  return feature ? feature.getGeometry() : undefined;
};

/**
 * Map a tree node to a layer.
 *
 * @param {undefined|null|ITreeNode} node The tree node.
 * @return {ILayer|undefined} layer The layer, or undefined if not a layer node.
 */
export const mapNodeToLayer = function(node) {
  return osImplements(node, ILayerProvider.ID) ? /** @type {ILayerProvider} */ (node).getLayer() : undefined;
};

/**
 * Map tree node(s) to layers.
 *
 * @param {Array<ITreeNode>|ITreeNode|undefined} nodes The tree nodes.
 * @return {!Array<!ILayer>} layers The layers.
 */
export const nodesToLayers = function(nodes) {
  if (!nodes) {
    return [];
  }

  if (!Array.isArray(nodes)) {
    nodes = [nodes];
  }

  return nodes.map(mapNodeToLayer).filter(filterFalsey);
};

/**
 * An empty function that accepts no arguments.
 * Useful for features that offer optional callbacks.
 * @return {undefined}
 */
export const noop = function() {
  // No Operation
};

goog.declareModuleId('plugin.arc.ArcJSONParser');

import Feature from 'ol/src/Feature.js';
import LinearRing from 'ol/src/geom/LinearRing.js';
import LineString from 'ol/src/geom/LineString.js';
import MultiPoint from 'ol/src/geom/MultiPoint.js';
import MultiPolygon from 'ol/src/geom/MultiPolygon.js';
import Point from 'ol/src/geom/Point.js';
import Polygon from 'ol/src/geom/Polygon.js';
import * as text from '../../os/file/mime/text.js';
import * as geo2 from '../../os/geo/geo2.js';

const Disposable = goog.require('goog.Disposable');
const googString = goog.require('goog.string');

/**
 * Parses an arc JSON data source
 *
 * @implements {IParser<Feature>}
 */
class ArcJSONParser extends Disposable {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * @type {?Array<Object>}
     * @private
     */
    this.features_ = null;
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();
    this.cleanup();
  }

  /**
   * @inheritDoc
   */
  setSource(source) {
    var features = null;

    if (source instanceof ArrayBuffer) {
      source = text.getText(source) || null;
    }

    if (typeof source === 'string') {
      var json = JSON.parse(source);
      features = json['features'];
    } else if (goog.isObject(source)) {
      features = source['features'];
    }

    if (features) {
      if (this.features_) {
        this.features_ = this.features_.concat(features);
      } else {
        this.features_ = features;
      }
    }
  }

  /**
   * @inheritDoc
   */
  cleanup() {
    this.features_ = null;
  }

  /**
   * @inheritDoc
   */
  hasNext() {
    return this.features_ != null && this.features_.length > 0;
  }

  /**
   * @inheritDoc
   */
  parseNext() {
    if (this.features_) {
      var features = [];

      for (var i = 0, ii = this.features_.length; i < ii; i++) {
        var feature = new Feature();
        var item = this.features_[i];

        // try to get the ID from the item or just use a random string
        var id = /** @type {string} */ (item['id']) || googString.getRandomString();
        feature.setId(id);

        // parse the geometry
        var itemGeometry = /** @type {Object} */ (item['geometry']);
        if (itemGeometry) {
          var olGeom = null;

          if (itemGeometry['x'] && itemGeometry['y']) {
            olGeom = this.parsePointGeometry_(itemGeometry);
          } else if (itemGeometry['paths']) {
            olGeom = this.parseLineStringGeometry_(itemGeometry);
          } else if (itemGeometry['rings']) {
            olGeom = this.parsePolygonGeometry_(itemGeometry);
          } else if (itemGeometry['points']) {
            olGeom = this.parseMultiPointGeometry_(itemGeometry);
          } else if (itemGeometry['xmin']) {
            olGeom = this.parseBBOXGeometry_(itemGeometry);
          }

          if (olGeom) {
            feature.setGeometry(olGeom.osTransform());
          }
        }

        // parse the feature attributes
        var attributes = /** @type {Object} */ (item['attributes']);
        if (attributes) {
          for (var key in attributes) {
            var value = attributes[key];
            feature.set(key, value);
          }
        }

        features.push(feature);
      }

      this.features_ = null;
      return features;
    }

    return null;
  }

  /**
   * Parses a point geometry out from an Arc Geometry.
   *
   * @param {Object} item
   * @return {Point}
   * @private
   */
  parsePointGeometry_(item) {
    var coords = [item['x'], item['y']];
    return new Point(coords);
  }

  /**
   * Parses a LineString geometry out from an Arc Geometry.
   *
   * @param {Object} item
   * @return {LineString}
   * @private
   */
  parseLineStringGeometry_(item) {
    var coords = item['paths'];
    return new LineString(coords[0]);
  }

  /**
   * Parses a Polygon geometry out from an Arc Geometry.
   *
   * @param {Object} item
   * @return {Polygon|MultiPolygon}
   * @private
   */
  parsePolygonGeometry_(item) {
    var rings = item['rings'];
    var polygons = [];
    for (var i = 0; i < rings.length; i++) {
      if (geo2.computeWindingOrder(rings[i]) == geo2.WindingOrder.CLOCKWISE) {
        polygons.push(new Polygon([rings[i]]));
      }
    }
    for (var i = 0; i < rings.length; i++) {
      if (geo2.computeWindingOrder(rings[i]) == geo2.WindingOrder.COUNTER_CLOCKWISE) {
        var x = rings[i][0][0];
        var y = rings[i][0][1];
        for (var j = 0; j < polygons.length; j++) {
          if (polygons[j].containsXY(x, y)) {
            polygons[j].appendLinearRing(new LinearRing(rings[i]));
            break;
          }
        }
      }
    }

    if (polygons.length > 1) {
      var multi = new MultiPolygon([]);
      for (var i = 0; i < polygons.length; i++) {
        multi.appendPolygon(polygons[i]);
      }
      return multi;
    }
    return polygons[0];
  }

  /**
   * Parses a MultiPoint geometry out from an Arc Geometry.
   *
   * @param {Object} item
   * @return {MultiPoint}
   * @private
   */
  parseMultiPointGeometry_(item) {
    var coords = item['points'];
    return new MultiPoint(coords);
  }

  /**
   * Parses a MultiPoint geometry out from an Arc Geometry.
   *
   * @param {Object} item
   * @return {Polygon}
   * @private
   */
  parseBBOXGeometry_(item) {
    var coords = [[
      [item['xmin'], item['ymin']],
      [item['xmin'], item['ymax']],
      [item['xmax'], item['ymax']],
      [item['xmax'], item['ymin']],
      [item['xmin'], item['ymin']]
    ]];
    return new Polygon(coords);
  }
}

export default ArcJSONParser;

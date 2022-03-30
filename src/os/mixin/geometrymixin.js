goog.declareModuleId('os.mixin.geometry');

import {returnOrUpdate, createEmpty, createOrUpdateEmpty, getWidth, extend} from 'ol/src/extent.js';
import Circle from 'ol/src/geom/Circle.js';
import Geometry from 'ol/src/geom/Geometry.js';
import GeometryCollection from 'ol/src/geom/GeometryCollection.js';
import LinearRing from 'ol/src/geom/LinearRing.js';
import LineString from 'ol/src/geom/LineString.js';
import MultiLineString from 'ol/src/geom/MultiLineString.js';
import MultiPoint from 'ol/src/geom/MultiPoint.js';
import MultiPolygon from 'ol/src/geom/MultiPolygon.js';
import Point from 'ol/src/geom/Point.js';
import Polygon from 'ol/src/geom/Polygon.js';
import SimpleGeometry from 'ol/src/geom/SimpleGeometry.js';
import {get, equivalent} from 'ol/src/proj.js';

import GeometryField from '../geom/geometryfield.js';
import * as osMap from '../map/map.js';
import {merge} from '../object/object.js';
import {EPSG4326} from '../proj/proj.js';

const log = goog.require('goog.log');

const Logger = goog.requireType('goog.log.Logger');


/**
 * Logger
 * @type {Logger}
 */
const geometryLogger = log.getLogger('ol.geom.Geometry');


/**
 * @param {ol.Extent=} opt_extent
 * @return {ol.Extent} The extent normalized from 0 to 360 rather than -180 to 180
 */
Geometry.prototype.getAntiExtent = function(opt_extent) {
  var rev = this.getRevision();
  if (this.antiExtentRevision_ != rev) {
    this.antiExtent_ = this.computeAntiExtent(this.antiExtent_ || createEmpty());
    this.antiExtentRevision_ = rev;
  }
  return returnOrUpdate(this.antiExtent_, opt_extent);
};


/**
 * @abstract
 * @param {ol.Extent} extent
 * @return {ol.Extent}
 * @protected
 */
Geometry.prototype.computeAntiExtent = function(extent) {};


/**
 * @type {ol.Extent}
 * @private
 */
Geometry.prototype.antiExtent_ = null;


/**
 * @type {number}
 * @private
 */
Geometry.prototype.antiExtentRevision_ = NaN;


/**
 * @inheritDoc
 */
SimpleGeometry.prototype.computeAntiExtent = function(extent) {
  createOrUpdateEmpty(extent);
  var coords = this.getFlatCoordinates();
  var stride = this.getStride();
  var proj = osMap.PROJECTION;
  var projExtent = proj.getExtent();
  var projWidth = getWidth(projExtent);
  var projCenter = projExtent[0] + projWidth / 2;

  for (var i = 0, n = coords.length; i < n; i += stride) {
    var x = coords[i];
    x += x < projCenter ? projWidth : 0;
    var y = coords[i + 1];

    extent[0] = Math.min(extent[0], x);
    extent[1] = Math.min(extent[1], y);
    extent[2] = Math.max(extent[2], x);
    extent[3] = Math.max(extent[3], y);
  }

  return extent;
};


/**
 * @inheritDoc
 * @suppress {accessControls}
 */
GeometryCollection.prototype.computeAntiExtent = function(extent) {
  createOrUpdateEmpty(extent);
  var geometries = this.geometries_;
  for (var i = 0, n = geometries.length; i < n; i++) {
    extend(extent, geometries[i].getAntiExtent());
  }

  return extent;
};


/**
 * Transforms the geometry to the selected application projection.
 *
 * @param {ol.ProjectionLike=} opt_projection The current projection of the geometry. Defaults to EPSG:4326.
 * @return {Geometry}
 */
Geometry.prototype.osTransform = function(opt_projection) {
  opt_projection = opt_projection || EPSG4326;

  var pFrom = get(opt_projection);
  var pTo = osMap.PROJECTION;

  if (!pFrom) {
    log.warning(geometryLogger,
        '"' + opt_projection + '" was not defined as a projection in the application!');
  } else if (!equivalent(pFrom, pTo)) {
    return this.transform(pFrom, pTo);
  }

  return this;
};


/**
 * Transforms to EPSG:4326/LatLon
 *
 * @return {Geometry}
 */
Geometry.prototype.toLonLat = function() {
  var pFrom = osMap.PROJECTION;
  var pTo = get(EPSG4326);

  if (!equivalent(pFrom, pTo)) {
    return this.transform(pFrom, pTo);
  }

  return this;
};

(function() {
  var oldPoints = MultiPoint.prototype.getPoints;

  /**
   * @return {Array<Point>}
   * @suppress {accessControls}
   */
  MultiPoint.prototype.getPoints = function() {
    var points = oldPoints.call(this);
    if (this.values_) {
      for (var i = 0, n = points.length; i < n; i++) {
        if (points[i].values_ == null) {
          points[i].values_ = {};
        }
        Object.assign(points[i].values_, this.values_);
      }
    }
    return points;
  };

  var oldLines = MultiLineString.prototype.getLineStrings;

  /**
   * @return {Array<LineString>}
   * @suppress {accessControls}
   */
  MultiLineString.prototype.getLineStrings = function() {
    var lines = oldLines.call(this);
    if (this.values_) {
      for (var i = 0, n = lines.length; i < n; i++) {
        if (lines[i].values_ == null) {
          lines[i].values_ = {};
        }
        Object.assign(lines[i].values_, this.values_);
      }
    }
    return lines;
  };


  var oldPolys = MultiPolygon.prototype.getPolygons;

  /**
   * @return {Array<Polygon>}
   * @suppress {accessControls}
   */
  MultiPolygon.prototype.getPolygons = function() {
    var polys = oldPolys.call(this);
    if (this.values_) {
      for (var i = 0, n = polys.length; i < n; i++) {
        if (polys[i].values_ == null) {
          polys[i].values_ = {};
        }
        Object.assign(polys[i].values_, this.values_);
      }
    }
    return polys;
  };
})();


(function() {
  var oldTransform = Geometry.prototype.transform;

  /**
   * @param {ol.ProjectionLike} sourceProjection
   * @param {ol.ProjectionLike} destinationProjection
   * @return {Geometry} Always returns this (not a clone).
   */
  Geometry.prototype.transform = function(sourceProjection, destinationProjection) {
    const currentProjection = /** @type {string|undefined} */ (
      this.get(GeometryField.PROJECTION)) || sourceProjection;
    const destinationCode = typeof destinationProjection === 'string' ?
      destinationProjection : destinationProjection.getCode();
    this.set(GeometryField.PROJECTION, destinationCode);
    return oldTransform.call(this, currentProjection, destinationProjection);
  };


  /**
   * Openlayers' implementation does not actually clone the underlying geometries
   *
   * @return {!GeometryCollection} The clone
   * @override
   */
  GeometryCollection.prototype.clone = function() {
    // at the time of this writing, GeometryCollection.prototype.getGeometries() returns a new
    // list of cloned geometries (even though that seems ridiculous and inconsistent to me)
    return new GeometryCollection(this.getGeometries());
  };

  var classes = [
    Circle,
    GeometryCollection,
    LinearRing,
    LineString,
    MultiLineString,
    MultiPoint,
    MultiPolygon,
    Point,
    Polygon
  ];

  classes.forEach(function(cls) {
    if (cls && cls.prototype && cls.prototype.clone) {
      var origClone = cls.prototype.clone;

      /**
       * Overridden to clone values in addition to coordinates
       *
       * @override
       */
      cls.prototype.clone = function() {
        var geom = origClone.call(this);
        if (this.values_) {
          if (!geom.values_) {
            geom.values_ = {};
          }
          merge(this.values_, geom.values_);
        }
        return geom;
      };
    }
  });
})();

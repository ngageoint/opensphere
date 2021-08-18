goog.module('os.mixin.geometry');
goog.module.declareLegacyNamespace();

const log = goog.require('goog.log');
const olExtent = goog.require('ol.extent');
const Circle = goog.require('ol.geom.Circle');
const Geometry = goog.require('ol.geom.Geometry');
const GeometryCollection = goog.require('ol.geom.GeometryCollection');
const LineString = goog.require('ol.geom.LineString');
const LinearRing = goog.require('ol.geom.LinearRing');
const MultiLineString = goog.require('ol.geom.MultiLineString');
const MultiPoint = goog.require('ol.geom.MultiPoint');
const MultiPolygon = goog.require('ol.geom.MultiPolygon');
const Point = goog.require('ol.geom.Point');
const Polygon = goog.require('ol.geom.Polygon');
const SimpleGeometry = goog.require('ol.geom.SimpleGeometry');
const olProj = goog.require('ol.proj');
const GeometryField = goog.require('os.geom.GeometryField');
const osMap = goog.require('os.map');
const {merge} = goog.require('os.object');
const {EPSG4326} = goog.require('os.proj');

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
    this.antiExtent_ = this.computeAntiExtent(this.antiExtent_ || olExtent.createEmpty());
    this.antiExtentRevision_ = rev;
  }
  return olExtent.returnOrUpdate(this.antiExtent_, opt_extent);
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
  olExtent.createOrUpdateEmpty(extent);
  var coords = this.getFlatCoordinates();
  var stride = this.getStride();
  var proj = osMap.PROJECTION;
  var projExtent = proj.getExtent();
  var projWidth = olExtent.getWidth(projExtent);
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
  olExtent.createOrUpdateEmpty(extent);
  var geometries = this.geometries_;
  for (var i = 0, n = geometries.length; i < n; i++) {
    olExtent.extend(extent, geometries[i].getAntiExtent());
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

  var pFrom = olProj.get(opt_projection);
  var pTo = osMap.PROJECTION;

  if (!pFrom) {
    log.warning(geometryLogger,
        '"' + opt_projection + '" was not defined as a projection in the application!');
  } else if (!olProj.equivalent(pFrom, pTo)) {
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
  var pTo = olProj.get(EPSG4326);

  if (!olProj.equivalent(pFrom, pTo)) {
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
    for (var i = 0, n = points.length; i < n; i++) {
      Object.assign(points[i].values_, this.values_);
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
    for (var i = 0, n = lines.length; i < n; i++) {
      Object.assign(lines[i].values_, this.values_);
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
    for (var i = 0, n = polys.length; i < n; i++) {
      Object.assign(polys[i].values_, this.values_);
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
        merge(this.values_, geom.values_);
        return geom;
      };
    }
  });
})();

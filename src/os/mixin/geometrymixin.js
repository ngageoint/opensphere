goog.provide('os.mixin.geometry');

goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('ol.extent');
goog.require('ol.geom.Circle');
goog.require('ol.geom.Geometry');
goog.require('ol.geom.GeometryCollection');
goog.require('ol.geom.LineString');
goog.require('ol.geom.LinearRing');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.geom.SimpleGeometry');
goog.require('ol.proj');
goog.require('ol.proj.projections');
goog.require('os.map');
goog.require('os.proj');


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
ol.geom.Geometry.LOGGER_ = goog.log.getLogger('ol.geom.Geometry');


/**
 * @param {ol.Extent=} opt_extent
 * @return {ol.Extent} The extent normalized from 0 to 360 rather than -180 to 180
 */
ol.geom.Geometry.prototype.getAntiExtent = function(opt_extent) {
  var rev = this.getRevision();
  if (this.antiExtentRevision_ != rev) {
    this.antiExtent_ = this.computeAntiExtent(this.antiExtent_ || ol.extent.createEmpty());
    this.antiExtentRevision_ = rev;
  }
  return ol.extent.returnOrUpdate(this.antiExtent_, opt_extent);
};


/**
 * @abstract
 * @param {ol.Extent} extent
 * @return {ol.Extent}
 * @protected
 */
ol.geom.Geometry.prototype.computeAntiExtent = function(extent) {};


/**
 * @type {ol.Extent}
 * @private
 */
ol.geom.Geometry.prototype.antiExtent_ = null;


/**
 * @type {number}
 * @private
 */
ol.geom.Geometry.prototype.antiExtentRevision_ = NaN;


/**
 * @inheritDoc
 */
ol.geom.SimpleGeometry.prototype.computeAntiExtent = function(extent) {
  ol.extent.createOrUpdateEmpty(extent);
  var coords = this.getFlatCoordinates();
  var stride = this.getStride();
  var proj = os.map.PROJECTION;
  var projExtent = proj.getExtent();
  var projWidth = ol.extent.getWidth(projExtent);
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
ol.geom.GeometryCollection.prototype.computeAntiExtent = function(extent) {
  ol.extent.createOrUpdateEmpty(extent);
  var geometries = this.geometries_;
  for (var i = 0, n = geometries.length; i < n; i++) {
    ol.extent.extend(extent, geometries[i].getAntiExtent());
  }

  return extent;
};


/**
 * Transforms the geometry to the selected application projection.
 *
 * @param {ol.ProjectionLike=} opt_projection The current projection of the geometry. Defaults to EPSG:4326.
 * @return {ol.geom.Geometry}
 */
ol.geom.Geometry.prototype.osTransform = function(opt_projection) {
  opt_projection = opt_projection || os.proj.EPSG4326;

  var pFrom = ol.proj.get(opt_projection);
  var pTo = os.map.PROJECTION;

  if (!pFrom) {
    goog.log.warning(ol.geom.Geometry.LOGGER_,
        '"' + opt_projection + '" was not defined as a projection in the application!');
  } else if (!ol.proj.equivalent(pFrom, pTo)) {
    return this.transform(pFrom, pTo);
  }

  return this;
};


/**
 * Transforms to EPSG:4326/LatLon
 *
 * @return {ol.geom.Geometry}
 */
ol.geom.Geometry.prototype.toLonLat = function() {
  var pFrom = os.map.PROJECTION;
  var pTo = ol.proj.get(os.proj.EPSG4326);

  if (!ol.proj.equivalent(pFrom, pTo)) {
    return this.transform(pFrom, pTo);
  }

  return this;
};

(function() {
  var oldPoints = ol.geom.MultiPoint.prototype.getPoints;

  /**
   * @return {Array<ol.geom.Point>}
   * @suppress {accessControls}
   */
  ol.geom.MultiPoint.prototype.getPoints = function() {
    var points = oldPoints.call(this);
    for (var i = 0, n = points.length; i < n; i++) {
      ol.obj.assign(points[i].values_, this.values_);
    }
    return points;
  };

  var oldLines = ol.geom.MultiLineString.prototype.getLineStrings;

  /**
   * @return {Array<ol.geom.LineString>}
   * @suppress {accessControls}
   */
  ol.geom.MultiLineString.prototype.getLineStrings = function() {
    var lines = oldLines.call(this);
    for (var i = 0, n = lines.length; i < n; i++) {
      ol.obj.assign(lines[i].values_, this.values_);
    }
    return lines;
  };


  var oldPolys = ol.geom.MultiPolygon.prototype.getPolygons;

  /**
   * @return {Array<ol.geom.Polygon>}
   * @suppress {accessControls}
   */
  ol.geom.MultiPolygon.prototype.getPolygons = function() {
    var polys = oldPolys.call(this);
    for (var i = 0, n = polys.length; i < n; i++) {
      ol.obj.assign(polys[i].values_, this.values_);
    }
    return polys;
  };
})();



(function() {
  var oldTransform = ol.geom.Geometry.prototype.transform;

  /**
   * @param {ol.ProjectionLike} sourceProjection
   * @param {ol.ProjectionLike} destinationProjection
   * @return {ol.geom.Geometry} Always returns this (not a clone).
   */
  ol.geom.Geometry.prototype.transform = function(sourceProjection, destinationProjection) {
    const currentProjection = /** @type {string|undefined} */ (
      this.get(os.geom.GeometryField.PROJECTION)) || sourceProjection;
    const destinationCode = typeof destinationProjection === 'string' ?
      destinationProjection : destinationProjection.getCode();
    this.set(os.geom.GeometryField.PROJECTION, destinationCode);
    return oldTransform.call(this, currentProjection, destinationProjection);
  };


  /**
   * Openlayers' implementation does not actually clone the underlying geometries
   *
   * @return {!ol.geom.GeometryCollection} The clone
   * @override
   */
  ol.geom.GeometryCollection.prototype.clone = function() {
    // at the time of this writing, GeometryCollection.prototype.getGeometries() returns a new
    // list of cloned geometries (even though that seems ridiculous and inconsistent to me)
    return new ol.geom.GeometryCollection(this.getGeometries());
  };

  var classes = [
    ol.geom.Circle,
    ol.geom.GeometryCollection,
    ol.geom.LinearRing,
    ol.geom.LineString,
    ol.geom.MultiLineString,
    ol.geom.MultiPoint,
    ol.geom.MultiPolygon,
    ol.geom.Point,
    ol.geom.Polygon];

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
        os.object.merge(this.values_, geom.values_);
        return geom;
      };
    }
  });
})();

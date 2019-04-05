goog.provide('os.mixin.geometry');

goog.require('goog.log');
goog.require('goog.log.Logger');
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
 * @param {ol.Extent} extent
 * @return {ol.Extent}
 * @protected
 */
ol.geom.Geometry.prototype.computeAntiExtent = goog.abstractMethod;


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
  var coords = this.getFlatCoordinates();
  var stride = this.getStride();
  var proj = os.map.PROJECTION;
  var projExtent = proj.getExtent();
  var projWidth = ol.extent.getWidth(projExtent);
  var projCenter = projExtent[0] + projWidth / 2;

  extent[0] = Infinity;
  extent[1] = Infinity;
  extent[2] = -Infinity;
  extent[3] = -Infinity;

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
  /**
   * Openlayers' implementation does not actually clone the underlying geometries
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
      cls.prototype.cloneSuper_ = cls.prototype.clone;

      /**
       * Overridden to clone values in addition to coordinates
       * @override
       */
      cls.prototype.clone = function() {
        var geom = this.cloneSuper_();
        os.object.merge(this.values_, geom.values_);
        return geom;
      };
    }
  });
})();

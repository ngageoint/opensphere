goog.provide('os.ogc.filter.OGCSpatialFormatter');
goog.require('ol.geom.GeometryType');
goog.require('ol.geom.Polygon');
goog.require('os.filter.ISpatialFormatter');
goog.require('os.geo');
goog.require('os.ogc.spatial');
goog.require('os.xml');



/**
 * Formats a spatial query for use in an OGC Filter.
 * @param {string=} opt_column
 * @implements {os.filter.ISpatialFormatter}
 * @constructor
 */
os.ogc.filter.OGCSpatialFormatter = function(opt_column) {
  /**
   * @type {string}
   * @private
   */
  this.column_ = opt_column || os.ogc.filter.OGCSpatialFormatter.DEFAULT_COLUMN_;
};


/**
 * @type {string}
 * @const
 * @private
 */
os.ogc.filter.OGCSpatialFormatter.DEFAULT_COLUMN_ = 'GEOM';


/**
 * @inheritDoc
 */
os.ogc.filter.OGCSpatialFormatter.prototype.format = function(feature) {
  var result = '';
  var geometry = this.getGeometry(feature);
  if (geometry) {
    var type = geometry.getType();

    // Encode area name and description to avoid problems with special chars. The
    // name/desc does not matter.
    var name = os.xml.escape(/** @type {string} */ (feature.get('title') || 'New Area'));
    var description = os.xml.escape(/** @type {string} */ (feature.get('description')));

    switch (type) {
      case ol.geom.GeometryType.CIRCLE:
        geometry = /** @type {ol.geom.Circle} */ (geometry);

        var polyCircle = new ol.geom.Polygon([os.geo.interpolateCircle(geometry.getCenter(), geometry.getRadius())]);
        result = os.ogc.spatial.formatGMLIntersection(polyCircle, this.column_, name, description) || '';
        break;
      case ol.geom.GeometryType.MULTI_LINE_STRING:
      case ol.geom.GeometryType.POLYGON:
        geometry = /** @type {ol.geom.Polygon} */ (geometry);
        var coords = geometry.getCoordinates();

        if (coords.length == 1 && os.geo.isRectangular(coords[0], geometry.getExtent())) {
          result = os.ogc.spatial.formatExtent(geometry.getExtent(), this.column_, name, description);
        } else {
          result = os.ogc.spatial.formatGMLIntersection(geometry, this.column_, name, description) || '';
        }
        break;
      case ol.geom.GeometryType.LINE_STRING:
      case ol.geom.GeometryType.MULTI_POLYGON:
        result = os.ogc.spatial.formatGMLIntersection(geometry, this.column_, name, description) || '';
        break;
      default:
        result = os.ogc.spatial.formatExtent(geometry.getExtent(), this.column_, name, description);
        break;
    }
  }

  return result;
};


/**
 * @param {?ol.Feature} feature
 * @return {null|ol.geom.Geometry|undefined}
 * @protected
 */
os.ogc.filter.OGCSpatialFormatter.prototype.getGeometry = function(feature) {
  return feature ? feature.getGeometry() : null;
};


/**
 * Sets the column for the spatial region.
 * @param {?string} value
 */
os.ogc.filter.OGCSpatialFormatter.prototype.setColumn = function(value) {
  this.column_ = value || os.ogc.filter.OGCSpatialFormatter.DEFAULT_COLUMN_;
};


/**
 * @inheritDoc
 */
os.ogc.filter.OGCSpatialFormatter.prototype.supportsMultiple = function() {
  return true;
};


/**
 * @inheritDoc
 */
os.ogc.filter.OGCSpatialFormatter.prototype.wrapMultiple = function(value) {
  return value ? '<Or>' + value + '</Or>' : '';
};

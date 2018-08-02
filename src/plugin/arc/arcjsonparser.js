goog.provide('plugin.arc.ArcJSONParser');

goog.require('goog.Disposable');
goog.require('ol.Feature');
goog.require('ol.geom.LineString');
goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('os.feature');
goog.require('os.parse.IParser');



/**
 * Parses an arc JSON data source
 * @extends {goog.Disposable}
 * @implements {os.parse.IParser<ol.Feature>}
 * @constructor
 */
plugin.arc.ArcJSONParser = function() {
  /**
   * @type {?Array<Object>}
   * @private
   */
  this.features_ = null;
};
goog.inherits(plugin.arc.ArcJSONParser, goog.Disposable);


/**
 * @inheritDoc
 */
plugin.arc.ArcJSONParser.prototype.disposeInternal = function() {
  plugin.arc.ArcJSONParser.base(this, 'disposeInternal');
  this.cleanup();
};


/**
 * @inheritDoc
 */
plugin.arc.ArcJSONParser.prototype.setSource = function(source) {
  var features = null;
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
};


/**
 * @inheritDoc
 */
plugin.arc.ArcJSONParser.prototype.cleanup = function() {
  this.features_ = null;
};


/**
 * @inheritDoc
 */
plugin.arc.ArcJSONParser.prototype.hasNext = function() {
  return goog.isDefAndNotNull(this.features_) && this.features_.length > 0;
};


/**
 * @inheritDoc
 */
plugin.arc.ArcJSONParser.prototype.parseNext = function() {
  if (this.features_) {
    var features = [];

    for (var i = 0, ii = this.features_.length; i < ii; i++) {
      var feature = new ol.Feature();
      var item = this.features_[i];

      // try to get the ID from the item or just use a random string
      var id = /** @type {string} */ (item['id']) || goog.string.getRandomString();
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
};


/**
 * Parses a point geometry out from an Arc Geometry.
 * @param {Object} item
 * @return {ol.geom.Point}
 * @private
 */
plugin.arc.ArcJSONParser.prototype.parsePointGeometry_ = function(item) {
  var coords = [item['x'], item['y']];
  return new ol.geom.Point(coords);
};


/**
 * Parses a LineString geometry out from an Arc Geometry.
 * @param {Object} item
 * @return {ol.geom.LineString}
 * @private
 */
plugin.arc.ArcJSONParser.prototype.parseLineStringGeometry_ = function(item) {
  var coords = item['paths'];
  return new ol.geom.LineString(coords[0]);
};


/**
 * Parses a Polygon geometry out from an Arc Geometry.
 * @param {Object} item
 * @return {ol.geom.Polygon}
 * @private
 */
plugin.arc.ArcJSONParser.prototype.parsePolygonGeometry_ = function(item) {
  var coords = item['rings'];
  return new ol.geom.Polygon(coords);
};


/**
 * Parses a MultiPoint geometry out from an Arc Geometry.
 * @param {Object} item
 * @return {ol.geom.MultiPoint}
 * @private
 */
plugin.arc.ArcJSONParser.prototype.parseMultiPointGeometry_ = function(item) {
  var coords = item['points'];
  return new ol.geom.MultiPoint(coords);
};


/**
 * Parses a MultiPoint geometry out from an Arc Geometry.
 * @param {Object} item
 * @return {ol.geom.Polygon}
 * @private
 */
plugin.arc.ArcJSONParser.prototype.parseBBOXGeometry_ = function(item) {
  var coords = [[
    [item['xmin'], item['ymin']],
    [item['xmin'], item['ymax']],
    [item['xmax'], item['ymax']],
    [item['xmax'], item['ymin']],
    [item['xmin'], item['ymin']]
  ]];
  return new ol.geom.Polygon(coords);
};

goog.provide('plugin.georss.GeoRSSParser');

goog.require('ol.Feature');
goog.require('ol.geom.LineString');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.xml');
goog.require('os.map');
goog.require('os.parse.IParser');


/**
 * Parser for GeoRSS feeds
 * @implements {os.parse.IParser<ol.Feature>}
 * @template T
 * @constructor
 */
plugin.georss.GeoRSSParser = function() {
  /**
   * @type {?Document}
   * @protected
   */
  this.document = null;

  /**
   * @type {?NodeList}
   * @protected
   */
  this.entries = null;

  /**
   * @type {number}
   * @protected
   */
  this.nextIndex = 0;
};


/**
 * @inheritDoc
 */
plugin.georss.GeoRSSParser.prototype.setSource = function(source) {
  if (ol.xml.isDocument(source)) {
    this.document = /** @type {Document} */ (source);
  } else if (goog.isString(source)) {
    this.document = ol.xml.parse(source);
  }

  if (this.document) {
    this.entries = this.document.querySelectorAll('entry');
  }
};


/**
 * @inheritDoc
 */
plugin.georss.GeoRSSParser.prototype.cleanup = function() {
  this.document = null;
  this.entries = null;
  this.nextIndex = 0;
};


/**
 * @inheritDoc
 */
plugin.georss.GeoRSSParser.prototype.hasNext = function() {
  return this.entries != null && this.entries.length > this.nextIndex;
};


/**
 * @inheritDoc
 */
plugin.georss.GeoRSSParser.prototype.parseNext = function() {
  var nextEntry = this.entries[this.nextIndex++];
  var children = nextEntry.childNodes;
  var properties = {};

  for (var i = 0, n = children.length; i < n; i++) {
    var el = /** @type {Element} */ (children[i]);

    if (el.localName === 'link') {
      properties[el.localName] = el.getAttribute('href');
    } else if (el.namespaceURI === 'http://www.georss.org/georss') {
      var geom = plugin.georss.GeoRSSParser.parseGeometry(el);
      if (geom) {
        properties['geometry'] = geom;
      }
    } else {
      properties[el.localName] = el.textContent;
    }
  }

  return new ol.Feature(properties);
};


/**
 * @param {Element} el The element to parse
 * @return {ol.geom.Geometry|undefined} the geometry
 */
plugin.georss.GeoRSSParser.parseGeometry = function(el) {
  switch (el.localName) {
    case 'point':
      return plugin.georss.GeoRSSParser.parsePoint_(el);
    case 'line':
      return plugin.georss.GeoRSSParser.parseLine_(el);
    case 'polygon':
      return plugin.georss.GeoRSSParser.parsePolygon_(el);
    default:
      break;
  }
};


/**
 * @param {Element} el The element to parse
 * @return {ol.geom.Point|undefined} The point geometry
 * @private
 */
plugin.georss.GeoRSSParser.parsePoint_ = function(el) {
  var coords = plugin.georss.GeoRSSParser.parseCoords_(el);

  if (!coords || coords.length === 0) {
    // no coords found!
    return;
  }

  return new ol.geom.Point(coords[0]);
};


/**
 * @param {Element} el The element to parse
 * @return {ol.geom.LineString|undefined} The line geometry
 * @private
 */
plugin.georss.GeoRSSParser.parseLine_ = function(el) {
  var coords = plugin.georss.GeoRSSParser.parseCoords_(el);

  if (!coords) {
    // no coords found!
    return;
  }

  if (coords.length < 2) {
    // need at least 2 coords for line!
    return;
  }

  return new ol.geom.LineString(coords);
};


/**
 * @param {Element} el The element to parse
 * @return {ol.geom.Polygon|undefined} The polygon geometry
 * @private
 */
plugin.georss.GeoRSSParser.parsePolygon_ = function(el) {
  var coords = plugin.georss.GeoRSSParser.parseCoords_(el);

  if (!coords) {
    // no coords found!
    return;
  }

  if (coords.length < 3) {
    // need at least 3 coords for polygon!
    return;
  }

  return new ol.geom.Polygon([coords]);
};


/**
 * @param {Element} el The element to parse
 * @return {Array<ol.Coordinate>|undefined} The array of coordinates
 * @private
 */
plugin.georss.GeoRSSParser.parseCoords_ = function(el) {
  var parts = el.textContent.trim().split(/\s+/);

  if (parts.length % 2 !== 0) {
    // odd amount of numbers, cannot produce pairs!
    return;
  }

  var coords = [];
  for (var i = 1, n = parts.length; i < n; i += 2) {
    var lat = parseFloat(parts[i - 1]);
    var lon = parseFloat(parts[i]);

    if (isNaN(lat) || isNaN(lon)) {
      // could not parse all lat/lons of coordinates!
      return;
    }

    var coord = [lon, lat];

    // convert to the application projection
    coords.push(ol.proj.fromLonLat(coord, os.map.PROJECTION));
  }

  return coords;
};


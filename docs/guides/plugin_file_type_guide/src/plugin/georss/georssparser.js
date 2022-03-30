goog.declareModuleId('plugin.georss.GeoRSSParser');

import Feature from 'ol/src/Feature.js';
import LineString from 'ol/src/geom/LineString.js';
import Point from 'ol/src/geom/Point.js';
import Polygon from 'ol/src/geom/Polygon.js';
import {isDocument, parse} from 'ol/src/xml.js';

import {PROJECTION} from 'opensphere/src/os/map/map.js';

const {default: IParser} = goog.requireType('os.parse.IParser');


/**
 * Parser for GeoRSS feeds
 * @implements {IParser<Feature>}
 * @template T
 * @constructor
 */
export default class GeoRSSParser {
  /**
   * Constructor.
   */
  constructor() {
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
  }

  /**
   * @inheritDoc
   */
  setSource(source) {
    if (isDocument(source)) {
      this.document = /** @type {Document} */ (source);
    } else if (typeof source === 'string') {
      this.document = parse(source);
    }

    if (this.document) {
      this.entries = this.document.querySelectorAll('entry');
    }
  }

  /**
   * @inheritDoc
   */
  cleanup() {
    this.document = null;
    this.entries = null;
    this.nextIndex = 0;
  }

  /**
   * @inheritDoc
   */
  hasNext() {
    return this.entries != null && this.entries.length > this.nextIndex;
  }

  /**
   * @inheritDoc
   */
  parseNext() {
    var nextEntry = this.entries[this.nextIndex++];
    var children = nextEntry.childNodes;
    var properties = {};

    for (var i = 0, n = children.length; i < n; i++) {
      var el = /** @type {Element} */ (children[i]);

      if (el.localName === 'link') {
        properties[el.localName] = el.getAttribute('href');
      } else if (el.namespaceURI === 'http://www.georss.org/georss') {
        var geom = parseGeometry(el);
        if (geom) {
          properties['geometry'] = geom;
        }
      } else {
        properties[el.localName] = el.textContent;
      }
    }

    return new Feature(properties);
  }
}

/**
 * @param {Element} el The element to parse
 * @return {ol.geom.Geometry|undefined} the geometry
 */
export const parseGeometry = function(el) {
  switch (el.localName) {
    case 'point':
      return parsePoint(el);
    case 'line':
      return parseLine(el);
    case 'polygon':
      return parsePolygon(el);
    default:
      break;
  }
};

/**
 * @param {Element} el The element to parse
 * @return {Point|undefined} The point geometry
 */
const parsePoint = function(el) {
  var coords = parseCoords(el);

  if (!coords || coords.length === 0) {
    // no coords found!
    return;
  }

  return new Point(coords[0]);
};

/**
 * @param {Element} el The element to parse
 * @return {LineString|undefined} The line geometry
 * @private
 */
const parseLine = function(el) {
  var coords = parseCoords(el);

  if (!coords) {
    // no coords found!
    return;
  }

  if (coords.length < 2) {
    // need at least 2 coords for line!
    return;
  }

  return new LineString(coords);
};

/**
 * @param {Element} el The element to parse
 * @return {Polygon|undefined} The polygon geometry
 */
const parsePolygon = function(el) {
  var coords = parseCoords(el);

  if (!coords) {
    // no coords found!
    return;
  }

  if (coords.length < 3) {
    // need at least 3 coords for polygon!
    return;
  }

  return new Polygon([coords]);
};

/**
 * @param {Element} el The element to parse
 * @return {Array<ol.Coordinate>|undefined} The array of coordinates
 */
const parseCoords = function(el) {
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
    coords.push(ol.proj.fromLonLat(coord, PROJECTION));
  }

  return coords;
};

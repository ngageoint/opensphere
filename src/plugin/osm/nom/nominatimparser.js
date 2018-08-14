goog.provide('plugin.osm.nom.NominatimParser');

goog.require('goog.log');
goog.require('ol.Feature');
goog.require('ol.format.GeoJSON');
goog.require('ol.geom.Point');
goog.require('os.file.mime.text');
goog.require('os.parse.IParser');



/**
 * Parses JSON results from the OSM Nominatim API.
 * @implements {os.parse.IParser<ol.Feature|undefined>}
 * @constructor
 */
plugin.osm.nom.NominatimParser = function() {
  /**
   * Raw JSON results from Nominatim.
   * @type {Array|undefined}
   * @protected
   */
  this.results = undefined;

  /**
   * The index of the next result to parse.
   * @type {number}
   * @protected
   */
  this.nextIndex = 0;

  /**
   * The GeoJSON formatter.
   * @type {ol.format.GeoJSON}
   * @protected
   */
  this.format = new ol.format.GeoJSON();
};


/**
 * Logger for plugin.osm.nom.NominatimParser
 * @type {goog.log.Logger}
 * @private
 * @const
 */
plugin.osm.nom.NominatimParser.LOGGER_ = goog.log.getLogger('plugin.osm.nom.NominatimParser');


/**
 * @inheritDoc
 */
plugin.osm.nom.NominatimParser.prototype.setSource = function(source) {
  this.cleanup();

  if (source instanceof ArrayBuffer) {
    source = os.file.mime.text.getText(source) || null;
  }

  var results;
  if (goog.isString(source)) {
    try {
      results = /** @type {Array} */ (JSON.parse(source));
    } catch (e) {
      goog.log.error(plugin.osm.nom.NominatimParser.LOGGER_, 'Failed parsing response:', e);
      results = undefined;
    }
  } else if (goog.isArray(source)) {
    results = source;
  }

  if (results) {
    this.results = results;
  }
};


/**
 * @inheritDoc
 */
plugin.osm.nom.NominatimParser.prototype.cleanup = function() {
  this.results = undefined;
  this.nextIndex = 0;
};


/**
 * @inheritDoc
 */
plugin.osm.nom.NominatimParser.prototype.hasNext = function() {
  return !!this.results && this.results.length > this.nextIndex;
};


/**
 * @inheritDoc
 */
plugin.osm.nom.NominatimParser.prototype.parseNext = function() {
  var result;

  // unshift is very slow in browsers other than Chrome, so leave the array intact while parsing
  var next = this.results[this.nextIndex++];
  if (next) {
    try {
      // no need to show this in the UI, so remove it
      delete next[plugin.osm.nom.ResultField.BBOX];

      var geoJson = /** @type {Object|undefined} */ (next[plugin.osm.nom.ResultField.GEOJSON]);
      if (geoJson) {
        // parse the geometry from the provided GeoJSON
        var geometry = this.format.readGeometry(geoJson);
        if (geometry) {
          geometry.osTransform();
          next['geometry'] = geometry;
        }

        // no longer need the source GeoJSON, so remove it
        delete next[plugin.osm.nom.ResultField.GEOJSON];
      } else if (next[plugin.osm.nom.ResultField.LON] && next[plugin.osm.nom.ResultField.LAT]) {
        // parse a point from lat/lon
        var lon = Number(next[plugin.osm.nom.ResultField.LON]);
        var lat = Number(next[plugin.osm.nom.ResultField.LAT]);
        if (!isNaN(lon) && !isNaN(lat)) {
          next['geometry'] = new ol.geom.Point([lon, lat]);
        }
      }

      result = new ol.Feature(next);
    } catch (e) {
      goog.log.error(plugin.osm.nom.NominatimParser.LOGGER_, 'Failed reading feature:', e);
    }
  }

  return result;
};

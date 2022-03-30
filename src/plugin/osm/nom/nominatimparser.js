goog.declareModuleId('plugin.osm.nom.NominatimParser');

import Feature from 'ol/src/Feature.js';
import GeoJSON from 'ol/src/format/GeoJSON.js';
import Point from 'ol/src/geom/Point.js';
import {getUid} from 'ol/src/util.js';
import * as text from '../../../os/file/mime/text.js';
import * as nom from './nominatim.js';

const log = goog.require('goog.log');


/**
 * Parses JSON results from the OSM Nominatim API.
 *
 * @implements {IParser<Feature|undefined>}
 */
export default class NominatimParser {
  /**
   * Constructor.
   */
  constructor() {
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
     * @type {GeoJSON}
     * @protected
     */
    this.format = new GeoJSON();
  }

  /**
   * @inheritDoc
   */
  setSource(source) {
    this.cleanup();

    if (source instanceof ArrayBuffer) {
      source = text.getText(source) || null;
    }

    var results;
    if (typeof source === 'string') {
      try {
        results = /** @type {Array} */ (JSON.parse(source));
      } catch (e) {
        log.error(NominatimParser.LOGGER_, 'Failed parsing response:', e);
        results = undefined;
      }
    } else if (Array.isArray(source)) {
      results = source;
    }

    if (results) {
      this.results = results;
    }
  }

  /**
   * @inheritDoc
   */
  cleanup() {
    this.results = undefined;
    this.nextIndex = 0;
  }

  /**
   * @inheritDoc
   */
  hasNext() {
    return !!this.results && this.results.length > this.nextIndex;
  }

  /**
   * @inheritDoc
   */
  parseNext() {
    var result;

    // unshift is very slow in browsers other than Chrome, so leave the array intact while parsing
    var next = this.results[this.nextIndex++];
    if (next) {
      try {
        // no need to show this in the UI, so remove it
        delete next[nom.ResultField.BBOX];

        var geoJson = /** @type {Object|undefined} */ (next[nom.ResultField.GEOJSON]);
        if (geoJson) {
          // parse the geometry from the provided GeoJSON
          var geometry = this.format.readGeometry(geoJson);
          if (geometry) {
            geometry.osTransform();
            next['geometry'] = geometry;
          }

          // no longer need the source GeoJSON, so remove it
          delete next[nom.ResultField.GEOJSON];
        } else if (next[nom.ResultField.LON] && next[nom.ResultField.LAT]) {
          // parse a point from lat/lon
          var lon = Number(next[nom.ResultField.LON]);
          var lat = Number(next[nom.ResultField.LAT]);
          if (!isNaN(lon) && !isNaN(lat)) {
            next['geometry'] = new Point([lon, lat]);
          }
        }

        result = new Feature(next);
        result.setId(getUid(result) + '');
      } catch (e) {
        log.error(NominatimParser.LOGGER_, 'Failed reading feature:', e);
      }
    }

    return result;
  }
}

/**
 * Logger for plugin.osm.nom.NominatimParser
 * @type {log.Logger}
 * @private
 * @const
 */
NominatimParser.LOGGER_ = log.getLogger('plugin.osm.nom.NominatimParser');

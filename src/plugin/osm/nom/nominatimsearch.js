goog.module('plugin.osm.nom.NominatimSearch');

const Promise = goog.require('goog.Promise');
const Settings = goog.require('os.config.Settings');
const fn = goog.require('os.fn');
const osImplements = goog.require('os.implements');
const Request = goog.require('os.net.Request');
const AbstractUrlSearch = goog.require('os.search.AbstractUrlSearch');
const IGeoSearch = goog.require('os.search.IGeoSearch');
const nom = goog.require('plugin.osm.nom');
const NominatimParser = goog.require('plugin.osm.nom.NominatimParser');
const SearchResult = goog.require('plugin.osm.nom.SearchResult');


/**
 * Search provider for the OSM Nominatim API.
 *
 * @implements {IGeoSearch}
 */
class NominatimSearch extends AbstractUrlSearch {
  /**
   * Constructor.
   * @param {string} name The search provider name.
   */
  constructor(name) {
    super(nom.ID, name);
    this.type = nom.ID;

    /**
     * The geo search extent.
     * @type {Array<number>|undefined}
     * @protected
     */
    this.geoExtent = undefined;
  }

  /**
   * @inheritDoc
   */
  shouldNormalize() {
    return false;
  }

  /**
   * @inheritDoc
   */
  getSearchUrl(term, opt_start, opt_pageSize) {
    var url = /** @type {string} */ (Settings.getInstance().get(nom.SettingKey.URL, ''));
    if (url) {
      if (opt_pageSize) {
        // limit the number of results
        url += '&limit=' + opt_pageSize;
      }

      if (this.geoExtent) {
        // restrict the query to the current extent
        url += '&bounded=1';
        url += '&viewbox=' + this.geoExtent.join(',');
      }
    }

    return url;
  }

  /**
   * @inheritDoc
   */
  onSearchSuccess(evt) {
    var request = /** @type {Request} */ (evt.target);
    var response = /** @type {string} */ (request.getResponse());
    if (response) {
      var parser = new NominatimParser();
      parser.setSource(response);

      while (parser.hasNext()) {
        var next = parser.parseNext();
        if (next) {
          if (Array.isArray(next)) {
            this.results.concat(next.map(function(f) {
              return f ? new SearchResult(f) : undefined;
            }).filter(fn.filterFalsey));
          } else {
            this.results.push(new SearchResult(next));
          }
        }
      }
    }

    // superclass takes care of cleaning up request and sending events
    super.onSearchSuccess(evt);
  }

  /**
   * @inheritDoc
   */
  supportsGeoDistance() {
    return false;
  }

  /**
   * @inheritDoc
   */
  supportsGeoExtent() {
    return true;
  }

  /**
   * @inheritDoc
   */
  supportsGeoShape() {
    return false;
  }

  /**
   * @inheritDoc
   */
  setGeoDistance(center, distance) {
    // not supported
  }

  /**
   * @inheritDoc
   */
  setGeoExtent(extent, opt_center, opt_distance) {
    this.geoExtent = extent;
  }

  /**
   * @inheritDoc
   */
  setGeoShape(shape, opt_center, opt_distance) {
    // not supported
  }
}

osImplements(NominatimSearch, IGeoSearch.ID);


/**
 * Get the top result from Nominatim.
 *
 * @param {string} term The search term.
 * @return {!Promise<(ol.Feature|undefined)>} A promise that resolves to the resulting feature, or is rejected with
 *                                                 any errors.
 */
nom.feelingLucky = function(term) {
  var url = /** @type {string} */ (Settings.getInstance().get(nom.SettingKey.URL, ''));
  if (url) {
    url = url.replace(/{s}/g, term);
    url += '&limit=1';

    var request = new Request(url);
    request.setHeader('Accept', 'application/json, text/plain, */*');

    return request.getPromise().then(nom.parseFirst);
  }

  return Promise.reject('Nominatim service is not configured.');
};


/**
 * Parse the first object in a Nominatim response.
 *
 * @param {*} response The server response.
 * @return {ol.Feature|undefined} The parsed feature, or undefined if none could be parsed.
 */
nom.parseFirst = function(response) {
  if (typeof response === 'string' || Array.isArray(response)) {
    var parser = new NominatimParser();
    parser.setSource(response);

    var next;
    while (!next && parser.hasNext()) {
      next = parser.parseNext();
    }

    if (next) {
      return Array.isArray(next) ? next[0] : next;
    }
  }

  return undefined;
};
exports = NominatimSearch;

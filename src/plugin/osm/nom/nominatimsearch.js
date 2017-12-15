goog.provide('plugin.osm.nom.NominatimSearch');

goog.require('goog.Promise');
goog.require('os.fn');
goog.require('os.net.Request');
goog.require('os.search.AbstractUrlSearch');
goog.require('os.search.IGeoSearch');
goog.require('plugin.osm.nom');
goog.require('plugin.osm.nom.NominatimParser');
goog.require('plugin.osm.nom.SearchResult');


/**
 * Search provider for the OSM Nominatim API.
 * @param {string} name The search provider name.
 * @extends {os.search.AbstractUrlSearch}
 * @implements {os.search.IGeoSearch}
 * @constructor
 */
plugin.osm.nom.NominatimSearch = function(name) {
  plugin.osm.nom.NominatimSearch.base(this, 'constructor', plugin.osm.nom.ID, name);
  this.type = plugin.osm.nom.ID;

  /**
   * The geo search extent.
   * @type {Array<number>|undefined}
   * @protected
   */
  this.geoExtent = undefined;
};
goog.inherits(plugin.osm.nom.NominatimSearch, os.search.AbstractUrlSearch);
os.implements(plugin.osm.nom.NominatimSearch, os.search.IGeoSearch.ID);


/**
 * @inheritDoc
 */
plugin.osm.nom.NominatimSearch.prototype.shouldNormalize = function() {
  return false;
};


/**
 * @inheritDoc
 */
plugin.osm.nom.NominatimSearch.prototype.getSearchUrl = function(term, opt_start, opt_pageSize) {
  var url = /** @type {string} */ (os.settings.get(plugin.osm.nom.SettingKey.URL, ''));
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
};


/**
 * @inheritDoc
 */
plugin.osm.nom.NominatimSearch.prototype.onSearchSuccess = function(evt) {
  var request = /** @type {os.net.Request} */ (evt.target);
  var response = /** @type {string} */ (request.getResponse());
  if (response) {
    var parser = new plugin.osm.nom.NominatimParser();
    parser.setSource(response);

    while (parser.hasNext()) {
      var next = parser.parseNext();
      if (next) {
        if (goog.isArray(next)) {
          this.results.concat(next.map(function(f) {
            return f ? new plugin.osm.nom.SearchResult(f) : undefined;
          }).filter(os.fn.filterFalsey));
        } else {
          this.results.push(new plugin.osm.nom.SearchResult(next));
        }
      }
    }
  }

  // superclass takes care of cleaning up request and sending events
  plugin.osm.nom.NominatimSearch.base(this, 'onSearchSuccess', evt);
};


/**
 * @inheritDoc
 */
plugin.osm.nom.NominatimSearch.prototype.supportsGeoDistance = function() {
  return false;
};


/**
 * @inheritDoc
 */
plugin.osm.nom.NominatimSearch.prototype.supportsGeoExtent = function() {
  return true;
};


/**
 * @inheritDoc
 */
plugin.osm.nom.NominatimSearch.prototype.supportsGeoShape = function() {
  return false;
};


/**
 * @inheritDoc
 */
plugin.osm.nom.NominatimSearch.prototype.setGeoDistance = function(center, distance) {
  // not supported
};


/**
 * @inheritDoc
 */
plugin.osm.nom.NominatimSearch.prototype.setGeoExtent = function(extent, opt_center, opt_distance) {
  this.geoExtent = extent;
};


/**
 * @inheritDoc
 */
plugin.osm.nom.NominatimSearch.prototype.setGeoShape = function(shape, opt_center, opt_distance) {
  // not supported
};


/**
 * Get the top result from Nominatim.
 * @param {string} term The search term.
 * @return {!goog.Promise<(ol.Feature|undefined)>} A promise that resolves to the resulting feature, or is rejected with
 *                                                 any errors.
 */
plugin.osm.nom.feelingLucky = function(term) {
  var url = /** @type {string} */ (os.settings.get(plugin.osm.nom.SettingKey.URL, ''));
  if (url) {
    url = url.replace(/{s}/g, term);
    url += '&limit=1';

    var request = new os.net.Request(url);
    request.setHeader('Accept', 'application/json, text/plain, */*');

    return request.getPromise().then(plugin.osm.nom.parseFirst);
  }

  return goog.Promise.reject('Nominatim service is not configured.');
};


/**
 * Parse the first object in a Nominatim response.
 * @param {*} response The server response.
 * @return {ol.Feature|undefined} The parsed feature, or undefined if none could be parsed.
 */
plugin.osm.nom.parseFirst = function(response) {
  if (goog.isString(response) || goog.isArray(response)) {
    var parser = new plugin.osm.nom.NominatimParser();
    parser.setSource(response);

    var next;
    while (!next && parser.hasNext()) {
      next = parser.parseNext();
    }

    if (next) {
      return goog.isArray(next) ? next[0] : next;
    }
  }

  return undefined;
};

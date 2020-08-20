goog.provide('os.ui.search.place.CoordinateSearch');

goog.require('goog.array');
goog.require('goog.events.Event');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('goog.net.EventType');
goog.require('ol.Feature');
goog.require('ol.geom.Point');
goog.require('os.geo2');
goog.require('os.search.AbstractSearch');
goog.require('os.search.SearchEvent');
goog.require('os.search.SearchEventType');
goog.require('os.ui.search.place');
goog.require('os.ui.search.place.CoordinateResult');



/**
 * Checks if a search term is a coordinate.
 *
 * @extends {os.search.AbstractSearch}
 * @constructor
 */
os.ui.search.place.CoordinateSearch = function() {
  os.ui.search.place.CoordinateSearch.base(this, 'constructor',
      os.ui.search.place.CoordinateSearch.ID, 'Coordinates');
  this.log = os.ui.search.place.CoordinateSearch.LOGGER_;
  this.priority = 100;
  this.type = os.ui.search.place.CoordinateSearch.ID;
};
goog.inherits(os.ui.search.place.CoordinateSearch, os.search.AbstractSearch);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.ui.search.place.CoordinateSearch.LOGGER_ = goog.log.getLogger('os.ui.search.place.CoordinateSearch');


/**
 * The search identifier.
 * @type {string}
 * @const
 */
os.ui.search.place.CoordinateSearch.ID = 'coord';


/**
 * @inheritDoc
 */
os.ui.search.place.CoordinateSearch.prototype.cancel = function() {
  // intentionally empty as this search runs synchronously
};


/**
 * @inheritDoc
 */
os.ui.search.place.CoordinateSearch.prototype.autocomplete = function(term, opt_maxResults) {
  this.term = term;
  this.dispatchEvent(new os.search.SearchEvent(os.search.SearchEventType.AUTOCOMPLETED, this.term, []));
};


/**
 * @inheritDoc
 */
os.ui.search.place.CoordinateSearch.prototype.searchTerm = function(term, opt_start, opt_pageSize) {
  this.term = term;

  var results = [];
  try {
    var location = os.geo.parseLatLon(term);
    if (location) {
      if (location.lat < 90.0 && location.lat > -90.0) {
        location.lon = os.geo2.normalizeLongitude(location.lon, undefined, undefined, os.proj.EPSG4326);
        var feature = os.ui.search.place.createFeature({
          'geometry': new ol.geom.Point([location.lon, location.lat]).osTransform(),
          'label': term
        });
        results.push(new os.ui.search.place.CoordinateResult(feature));
      } else {
        var msg = 'The processed latitude was out of bounds [-90.0, 90.0]. Result for ' +
            term + ':' + JSON.stringify(location);
        throw new Error(msg);
      }
    } else {
      var mgrs = term.replace(/\s+/g, '').toUpperCase();
      if (mgrs.match(os.geo.MGRS_REGEXP)) {
        var coord = osasm.toLonLat(mgrs);
        var feature = os.ui.search.place.createFeature({
          'geometry': new ol.geom.Point(coord).osTransform(),
          'label': term
        });
        results.push(new os.ui.search.place.CoordinateResult(feature));
      }
    }
  } catch (e) {
    goog.log.error(this.log, 'coordinate search failed:', e);
  }

  this.dispatchEvent(new os.search.SearchEvent(os.search.SearchEventType.SUCCESS, term,
      os.search.pageResults(results, opt_start, opt_pageSize), results.length));
  return true;
};

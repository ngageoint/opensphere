goog.module('plugin.pelias.geocoder.Search');

const log = goog.require('goog.log');
const GeoJSON = goog.require('ol.format.GeoJSON');
const olProj = goog.require('ol.proj');
const MapContainer = goog.require('os.MapContainer');
const Settings = goog.require('os.config.Settings');
const osExtent = goog.require('os.extent');
const osMap = goog.require('os.map');
const osProj = goog.require('os.proj');
const AbstractUrlSearch = goog.require('os.search.AbstractUrlSearch');
const {ID} = goog.require('plugin.pelias.geocoder');
const Result = goog.require('plugin.pelias.geocoder.Result');

const Logger = goog.requireType('goog.log.Logger');
const Request = goog.requireType('os.net.Request');


/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('plugin.pelias.geocoder.Search');


/**
 * Searches via the Pelias Geocoder API
 */
class Search extends AbstractUrlSearch {
  /**
   * Constructor.
   * @param {string} name
   */
  constructor(name) {
    super(ID, name);
    this.type = ID;

    /**
     * @type {GeoJSON}
     * @protected
     */
    this.format = new GeoJSON();
  }

  /**
   * @inheritDoc
   */
  getSearchUrl(term, opt_start, opt_pageSize) {
    var settings = Settings.getInstance();
    var url = /** @type {?string} */ (settings.get(['plugin', 'pelias', 'geocoder', 'url']));

    var boundary = /** @type {boolean} */ (settings.get(['plugin', 'pelias', 'geocoder', 'extentParams']));

    if (boundary) {
      // if the view is small enough, we'll apply a bounding rectangle to the search
      // defaults to 200km
      var threshold =
      /** @type {number} */ (settings.get(['plugin', 'pelias', 'geocoder', 'extentThreshold'], 200000));
      var extent = MapContainer.getInstance().getMap().getExtent();

      // translate to lon/lat
      extent = olProj.transformExtent(extent, osMap.PROJECTION, osProj.EPSG4326);
      extent = osExtent.normalize(extent, undefined, undefined, osProj.EPSG4326, extent);
      var distance = osasm.geodesicInverse(extent.slice(0, 2), extent.slice(2, 4)).distance;

      if (distance <= threshold) {
        var boundaryText = '&boundary.rect.min_lat=' + extent[1] +
          '&boundary.rect.min_lon=' + extent[0] +
          '&boundary.rect.max_lat=' + extent[3] +
          '&boundary.rect.max_lon=' + extent[2];
        url += boundaryText;
      }
    }

    // Add the focus.point modifiers to the URL if enabled and we are zoomed in to at least zoom level 4.
    var focuspoint = /** @type {boolean} */ (settings.get(['plugin', 'pelias', 'geocoder', 'focusPoint']));
    if (focuspoint) {
      var threshold = /** @type {number} */ (settings.get(['plugin', 'pelias', 'geocoder', 'focusPointMinZoom'], 4.0));
      var currentZoom = MapContainer.getInstance().getMap().getView().getZoom();
      if (currentZoom >= threshold) {
        var centre = MapContainer.getInstance().getMap().getView().getCenter();
        if (centre) {
          var centreLonLat = olProj.toLonLat(centre, osMap.PROJECTION);
          var focusPointText = '&focus.point.lat=' + centreLonLat[1] + '&focus.point.lon=' + centreLonLat[0];
          url += focusPointText;
        }
      }
    }
    return url;
  }

  /**
   * @param {goog.events.Event} evt
   * @suppress {accessControls}
   * @override
   */
  onSearchSuccess(evt) {
    var request = /** @type {Request} */ (evt.target);

    try {
      var resp = /** @type {Object} */ (JSON.parse(/** @type {string} */ (request.getResponse())));
    } catch (e) {
      log.error(logger, 'The result JSON was malformed', e);
    }

    if (resp) {
      var features = resp['features'];
      var options = {
        featureProjection: osMap.PROJECTION
      };

      if (features) {
        for (var i = 0, n = features.length; i < n; i++) {
          try {
            var extent = features[i]['bbox'];
            var feature = this.format.readFeature(features[i], options);

            if (extent) {
              feature.set('extent', extent, true);
            }

            // attempt to make a single field with the address if it exists
            var props = feature.values_;
            if (props['housenumber'] && props['street'] && props['postalcode']) {
              props['address'] = [
                props['housenumber'] + ' ' + props['street'],
                props['locality'],
                (props['region_a'] || props['region']),
                props['postalcode']].join(', ');
            }

            this.results.push(new Result(feature));
          } catch (e) {
            log.error(logger, 'There was an error parsing a result', e);
          }
        }
      }
    }

    // superclass takes care of cleaning up request listeners and firing the result event
    super.onSearchSuccess(evt);
  }
}

exports = Search;

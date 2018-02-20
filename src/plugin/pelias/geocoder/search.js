goog.provide('plugin.pelias.geocoder.Search');

goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('ol.Feature');
goog.require('ol.format.GeoJSON');
goog.require('ol.geom.Point');
goog.require('os.alert.AlertEventSeverity');
goog.require('os.alert.AlertManager');
goog.require('os.config.Settings');
goog.require('os.geo');
goog.require('os.search.AbstractUrlSearch');
goog.require('plugin.pelias.geocoder.AttrResult');
goog.require('plugin.pelias.geocoder.Result');



/**
 * Searches via the Pelias Geocoder API
 * @param {string} name
 * @extends {os.search.AbstractUrlSearch}
 * @constructor
 */
plugin.pelias.geocoder.Search = function(name) {
  plugin.pelias.geocoder.Search.base(this, 'constructor', plugin.pelias.geocoder.Plugin.ID, name);
  this.type = plugin.pelias.geocoder.Plugin.ID;

  /**
   * @type {ol.format.GeoJSON}
   * @protected
   */
  this.format = new ol.format.GeoJSON();

  /**
   * The logger
   * @type {goog.log.Logger}
   * @private
   */
  this.log_ = plugin.pelias.geocoder.Search.LOGGER_;
};
goog.inherits(plugin.pelias.geocoder.Search, os.search.AbstractUrlSearch);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
plugin.pelias.geocoder.Search.LOGGER_ = goog.log.getLogger('plugin.pelias.geocoder.Search');


/**
 * @inheritDoc
 */
plugin.pelias.geocoder.Search.prototype.getSearchUrl = function(term, opt_start, opt_pageSize) {
  var url = /** @type {?string} */ (os.settings.get(['plugin', 'pelias', 'geocoder', 'url']));

  var boundary = /** @type {boolean} */ (os.settings.get(['plugin', 'pelias', 'geocoder', 'extentParams']));

  if (boundary) {
    // if the view is small enough, we'll apply a bounding rectangle to the search
    // defaults to 200km
    var threshold =
        /** @type {number} */ (os.settings.get(['plugin', 'pelias', 'geocoder', 'extentThreshold'], 200000));
    var extent = os.MapContainer.getInstance().getMap().getExtent();

    // translate to lon/lat
    extent = ol.proj.transformExtent(extent, os.map.PROJECTION, os.proj.EPSG4326);
    extent = plugin.pelias.geocoder.Search.normaliseLongitudeExtent_(extent);
    var distance = osasm.geodesicInverse(extent.slice(0, 2), extent.slice(2, 4)).distance;

    if (distance <= threshold) {
      var boundaryText = '&boundary.rect.min_lat=' + extent[1]
        + '&boundary.rect.min_lon=' + extent[0]
        + '&boundary.rect.max_lat=' + extent[3]
        + '&boundary.rect.max_lon=' + extent[2];
      url += boundaryText;
    }
  }

  // Add the focus.point modifiers to the URL if enabled and we are zoomed in to at least zoom level 4.
  var focuspoint = /** @type {boolean} */ (os.settings.get(['plugin', 'pelias', 'geocoder', 'focusPoint']));
  if (focuspoint) {
    var threshold = /** @type {number} */ (os.settings.get(['plugin', 'pelias', 'geocoder', 'focusPointMinZoom'], 4.0));
    var currentZoom = os.MapContainer.getInstance().getMap().getView().getZoom();
    if (currentZoom >= threshold) {
      var centre = os.MapContainer.getInstance().getMap().getView().getCenter();
      if (centre) {
        var centreLonLat = ol.proj.toLonLat(centre, os.map.PROJECTION);
        var focusPointText = '&focus.point.lat=' + centreLonLat[1] + '&focus.point.lon=' + centreLonLat[0];
        url += focusPointText;
      }
    }
  }
  return url;
};

/**
 * Normalise the longitudes in an extent.
 *
 * @param {ol.Extent} extent The extent to be normalised
 * @return {ol.Extent} The extent with longitudes normalised to [-180,180)
 * @private
 */
plugin.pelias.geocoder.Search.normaliseLongitudeExtent_ = function(extent) {
  var normalisedExtent = extent;
  normalisedExtent[0] = os.geo.normalizeLongitude(extent[0]);
  normalisedExtent[2] = os.geo.normalizeLongitude(extent[2]);
  return normalisedExtent;
};


/**
 * @param {goog.events.Event} evt
 * @suppress {accessControls}
 * @override
 */
plugin.pelias.geocoder.Search.prototype.onSearchSuccess = function(evt) {
  var request = /** @type {os.net.Request} */ (evt.target);

  try {
    var resp = /** @type {Object} */ (JSON.parse(/** @type {string} */ (request.getResponse())));
  } catch (e) {
    goog.log.error(this.log_, 'The result JSON was malformed', e);
  }

  if (resp) {
    var features = resp['features'];
    var options = {
      featureProjection: os.map.PROJECTION
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

          this.results.push(new plugin.pelias.geocoder.Result(feature));
        } catch (e) {
          goog.log.error(this.log_, 'There was an error parsing a result', e);
        }
      }
    }
  }

  // superclass takes care of cleaning up request listeners and firing the result event
  plugin.pelias.geocoder.Search.base(this, 'onSearchSuccess', evt);
};

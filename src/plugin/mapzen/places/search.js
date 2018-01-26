goog.provide('plugin.mapzen.places.Search');

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
goog.require('plugin.mapzen.places.AttrResult');
goog.require('plugin.mapzen.places.Result');



/**
 * Searches via the Mapzen search API
 * @param {string} name
 * @extends {os.search.AbstractUrlSearch}
 * @constructor
 */
plugin.mapzen.places.Search = function(name) {
  plugin.mapzen.places.Search.base(this, 'constructor', plugin.mapzen.places.Plugin.ID, name);
  this.type = plugin.mapzen.places.Plugin.ID;

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
  this.log_ = plugin.mapzen.places.Search.LOGGER_;
};
goog.inherits(plugin.mapzen.places.Search, os.search.AbstractUrlSearch);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
plugin.mapzen.places.Search.LOGGER_ = goog.log.getLogger('plugin.mapzen.places.Search');


/**
 * @inheritDoc
 */
plugin.mapzen.places.Search.prototype.getSearchUrl = function(term, opt_start, opt_pageSize) {
  var url = /** @type {?string} */ (os.settings.get(['plugin', 'mapzen', 'places', 'url']));

  var boundary = /** @type {string} */ (os.settings.get(['plugin', 'mapzen', 'places', 'extentParams']));

  if (boundary) {
    // if the view is small enough, we'll apply a bounding rectangle to the search
    // defaults to 200km
    var threshold = /** @type {number} */ (os.settings.get(['plugin', 'mapzen', 'places', 'extentThreshold'], 200000));
    var extent = os.MapContainer.getInstance().getMap().getExtent();

    // translate to lon/lat
    extent = ol.proj.transformExtent(extent, os.map.PROJECTION, os.proj.EPSG4326);
    var distance = osasm.geodesicInverse(extent.slice(0, 2), extent.slice(2, 4)).distance;

    if (distance <= threshold) {
      url += boundary;
    }
  }

  return url;
};


/**
 * @param {goog.events.Event} evt
 * @suppress {accessControls}
 * @override
 */
plugin.mapzen.places.Search.prototype.onSearchSuccess = function(evt) {
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

          this.results.push(new plugin.mapzen.places.Result(feature));
        } catch (e) {
          goog.log.error(this.log_, 'There was an error parsing a result', e);
        }
      }
    }
  }

  // superclass takes care of cleaning up request listeners and firing the result event
  plugin.mapzen.places.Search.base(this, 'onSearchSuccess', evt);
};

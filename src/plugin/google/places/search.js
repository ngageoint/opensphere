goog.provide('plugin.google.places.Search');

goog.require('ol.Feature');
goog.require('ol.geom.Point');
goog.require('os.alert.AlertEventSeverity');
goog.require('os.alert.AlertManager');
goog.require('os.config.Settings');
goog.require('os.search.AbstractUrlSearch');
goog.require('plugin.google.places.AttrResult');
goog.require('plugin.google.places.Result');



/**
 * Searches Google Places API
 * @param {string} name
 * @extends {os.search.AbstractUrlSearch}
 * @constructor
 */
plugin.google.places.Search = function(name) {
  plugin.google.places.Search.base(this, 'constructor', plugin.google.places.Plugin.ID, name);
  this.type = plugin.google.places.Plugin.ID;
};
goog.inherits(plugin.google.places.Search, os.search.AbstractUrlSearch);


/**
 * @inheritDoc
 */
plugin.google.places.Search.prototype.getSearchUrl = function(term, opt_start, opt_pageSize) {
  var url = /** @type {?string} */ (os.settings.get(['plugin', 'google', 'places', 'url']));

  var boundary = /** @type {string} */ (os.settings.get(['plugin', 'google', 'places', 'nearby']));

  if (boundary) {
    // if the view is small enough, we'll apply a bounding rectangle to the search
    // defaults to 200km
    var threshold = /** @type {number} */ (os.settings.get(['plugin', 'google', 'places', 'extentThreshold'], 200000));
    var extent = os.MapContainer.getInstance().getMap().getExtent();

    // translate to lon/lat
    extent = ol.proj.transformExtent(extent, os.map.PROJECTION, os.proj.EPSG4326);
    var distance = osasm.geodesicInverse(extent.slice(0, 2), extent.slice(2, 4)).distance;

    if (distance <= threshold) {
      url = boundary.replace('{radius}', Math.min(50000, Math.round(distance / 2)).toString());
    }
  }

  return url;
};


/**
 * @inheritDoc
 */
plugin.google.places.Search.prototype.onSearchSuccess = function(evt) {
  var request = /** @type {os.net.Request} */ (evt.target);

  try {
    var resp = /** @type {Object} */ (JSON.parse(/** @type {string} */ (request.getResponse())));

    // handle abnormal status codes
    var stat = /** @type {string} */ (resp['status']);
    var msg = null;
    if (stat === 'OVER_QUERY_LIMIT') {
      msg = 'The ' + this.getName() + ' search has reached the daily request quota. Please wait until after' +
          ' midnight PST or contact the administractor.';
    } else if (stat === 'REQUEST_DENIED' || stat === 'INVALID_REQUEST') {
      msg = 'The ' + this.getName() + ' search is misconfigured. Please contact the administractor.';
    }

    if (msg) {
      os.alert.AlertManager.getInstance().sendAlert(msg, os.alert.AlertEventSeverity.ERROR);
    } else {
      // the terms of service require these to be shown if they exist
      var attributions = resp['html_attributions'];
      if (attributions && attributions.length) {
        // add attribution result at the top
        this.results.push(new plugin.google.places.AttrResult(attributions));
      }

      var results = /** @type {Array} */ (resp['results']);
      var max = /** @type {number} */ (os.settings.get(
          ['plugin', 'google', 'places', 'maxResults'], 5));

      for (var i = 0, n = Math.min(max, results.length); i < n; i++) {
        var result = results[i];

        var options = {};
        options['name'] = result['name'];
        var types = /** @type {Array<string>} */ (result['types']);

        if (types) {
          types = types.map(function(item) {
            return item.replace(/_/g, ' ');
          });
        }

        options['types'] = types;

        // if you hit nearbysearch, you get 'vicinity', but textsearch gives 'formatted_address'
        options['vicinity'] = result['vicinity'] || result['formatted_address'];

        var geom = result['geometry'];
        if (geom) {
          // TODO: are there other types of geometries from this service?
          var loc = geom['location'];

          if (loc) {
            options['geometry'] = new ol.geom.Point([loc['lng'], loc['lat']]).osTransform();
          }
        }

        if (options['geometry']) {
          var feature = new ol.Feature(options);
          this.results.push(new plugin.google.places.Result(feature));
        }
      }
    }
  } catch (e) {
  }

  // superclass takes care of cleaning up request listeners and firing the result event
  plugin.google.places.Search.base(this, 'onSearchSuccess', evt);
};

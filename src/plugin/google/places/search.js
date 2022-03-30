goog.declareModuleId('plugin.google.places.Search');

import Feature from 'ol/src/Feature.js';
import Point from 'ol/src/geom/Point.js';
import {transformExtent} from 'ol/src/proj.js';
import AlertEventSeverity from '../../../os/alert/alerteventseverity.js';
import AlertManager from '../../../os/alert/alertmanager.js';
import Settings from '../../../os/config/settings.js';
import * as osMap from '../../../os/map/map.js';
import MapContainer from '../../../os/mapcontainer.js';
import * as osProj from '../../../os/proj/proj.js';
import AbstractUrlSearch from '../../../os/search/abstracturlsearch.js';
import AttrResult from './attrresult.js';
import Result from './result.js';
import {ID} from './index.js';


/**
 * Searches Google Places API
 */
export default class Search extends AbstractUrlSearch {
  /**
   * Constructor.
   * @param {string} name
   */
  constructor(name) {
    super(ID, name);
    this.type = ID;
  }

  /**
   * @inheritDoc
   */
  getSearchUrl(term, opt_start, opt_pageSize) {
    var settings = Settings.getInstance();
    var url = /** @type {?string} */ (settings.get(['plugin', 'google', 'places', 'url']));

    var boundary = /** @type {string} */ (settings.get(['plugin', 'google', 'places', 'nearby']));

    if (boundary) {
      // if the view is small enough, we'll apply a bounding rectangle to the search
      // defaults to 200km
      var threshold = /** @type {number} */ (settings.get(['plugin', 'google', 'places', 'extentThreshold'], 200000));
      var extent = MapContainer.getInstance().getMap().getExtent();

      // translate to lon/lat
      extent = transformExtent(extent, osMap.PROJECTION, osProj.EPSG4326);
      var distance = osasm.geodesicInverse(extent.slice(0, 2), extent.slice(2, 4)).distance;

      if (distance <= threshold) {
        url = boundary.replace('{radius}', Math.min(50000, Math.round(distance / 2)).toString());
      }
    }

    return url;
  }

  /**
   * @inheritDoc
   */
  onSearchSuccess(evt) {
    var request = /** @type {Request} */ (evt.target);

    try {
      var resp = /** @type {Object} */ (JSON.parse(/** @type {string} */ (request.getResponse())));

      // handle abnormal status codes
      var stat = /** @type {string} */ (resp['status']);
      var msg = null;
      if (stat === 'OVER_QUERY_LIMIT') {
        msg = 'The ' + this.getName() + ' search has reached the daily request quota. Please wait until after' +
            ' midnight PST or contact the administrator.';
      } else if (stat === 'REQUEST_DENIED' || stat === 'INVALID_REQUEST') {
        msg = 'The ' + this.getName() + ' search is misconfigured. Please contact the administrator.';
      }

      if (msg) {
        AlertManager.getInstance().sendAlert(msg, AlertEventSeverity.ERROR);
      } else {
        // the terms of service require these to be shown if they exist
        var attributions = resp['html_attributions'];
        if (attributions && attributions.length) {
          // add attribution result at the top
          this.results.push(new AttrResult(attributions));
        }

        var results = /** @type {Array} */ (resp['results']);
        var max = /** @type {number} */ (Settings.getInstance().get(
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
              options['geometry'] = new Point([loc['lng'], loc['lat']]).osTransform();
            }
          }

          if (options['geometry']) {
            var feature = new Feature(options);
            this.results.push(new Result(feature));
          }
        }
      }
    } catch (e) {
    }

    // superclass takes care of cleaning up request listeners and firing the result event
    super.onSearchSuccess(evt);
  }
}

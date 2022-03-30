goog.declareModuleId('os.ui.search.place.CoordinateSearch');

import Point from 'ol/src/geom/Point.js';

import {parseLatLon} from '../../../geo/geo.js';
import {normalizeLongitude} from '../../../geo/geo2.js';
import {EPSG4326} from '../../../proj/proj.js';
import AbstractSearch from '../../../search/abstractsearch.js';
import {pageResults} from '../../../search/search.js';
import SearchEvent from '../../../search/searchevent.js';
import SearchEventType from '../../../search/searcheventtype.js';
import mgrs from '../../geo/mgrs.js';
import CoordinateResult from './coordinateresult.js';
import {createFeature} from './place.js';

const log = goog.require('goog.log');

const Logger = goog.requireType('goog.log.Logger');


/**
 * Checks if a search term is a coordinate.
 */
export default class CoordinateSearch extends AbstractSearch {
  /**
   * Constructor.
   */
  constructor() {
    super(CoordinateSearch.ID, 'Coordinates');
    this.log = logger;
    this.priority = 100;
    this.type = CoordinateSearch.ID;
  }

  /**
   * @inheritDoc
   */
  cancel() {
    // intentionally empty as this search runs synchronously
  }

  /**
   * @inheritDoc
   */
  autocomplete(term, opt_maxResults) {
    this.term = term;
    this.dispatchEvent(new SearchEvent(SearchEventType.AUTOCOMPLETED, this.term, []));
  }

  /**
   * @inheritDoc
   */
  searchTerm(term, opt_start, opt_pageSize) {
    this.term = term;

    var results = [];
    try {
      var location = parseLatLon(term);
      if (location) {
        if (location.lat < 90.0 && location.lat > -90.0) {
          location.lon = normalizeLongitude(location.lon, undefined, undefined, EPSG4326);
          var feature = createFeature({
            'geometry': new Point([location.lon, location.lat]).osTransform(),
            'label': term
          });
          results.push(new CoordinateResult(feature));
        } else {
          var msg = 'The processed latitude was out of bounds [-90.0, 90.0]. Result for ' +
              term + ':' + JSON.stringify(location);
          throw new Error(msg);
        }
      } else {
        const coord = mgrs(term);
        if (coord) {
          var feature = createFeature({
            'geometry': new Point(coord).osTransform(),
            'label': term
          });
          results.push(new CoordinateResult(feature));
        }
      }
    } catch (e) {
      log.error(this.log, 'coordinate search failed:', e);
    }

    this.dispatchEvent(new SearchEvent(SearchEventType.SUCCESS, term,
        pageResults(results, opt_start, opt_pageSize), results.length));
    return true;
  }
}

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('os.ui.search.place.CoordinateSearch');

/**
 * The search identifier.
 * @type {string}
 * @const
 */
CoordinateSearch.ID = 'coord';

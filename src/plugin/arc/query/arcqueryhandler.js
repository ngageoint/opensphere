goog.declareModuleId('plugin.arc.query.ArcQueryHandler');

import Feature from 'ol/src/Feature.js';
import * as jsts from '../../../os/geo/jsts.js';
import QueryHandler from '../../../os/query/queryhandler.js';
import * as osUiFilter from '../../../os/ui/filter/filter.js';
import ArcFilterModifier from './arcfiltermodifier.js';
import ArcSpatialFormatter from './arcspatialformatter.js';
import ArcSpatialModifier from './arcspatialmodifier.js';

const googArray = goog.require('goog.array');
const dispose = goog.require('goog.dispose');
const log = goog.require('goog.log');
const googObject = goog.require('goog.object');


/**
 * Query handler for Arc queries. This handler differs from the os.ui/OGC equivalents in that it does
 * not support complex combinations. It does the simpler job of writing out separate spatial and attribute
 * filters. From a query parameters perspective, they look something like:
 *
 * ```
 * {
 *   where: <attributeFilter>,
 *   geometry: <spatialFilter>
 * }
 * ```
 */
class ArcQueryHandler extends QueryHandler {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.setModifier(new ArcFilterModifier());
    this.setAreaFormatter(new ArcSpatialFormatter());
    this.spatialRequired = true;

    /**
     * @type {ArcSpatialModifier}
     * @private
     */
    this.spatialModifier_ = new ArcSpatialModifier();
  }

  /**
   * @inheritDoc
   */
  getActiveEntries() {
    var qmEntries = this.getEntries(this.getLayerId());
    var entries = [];

    // clone the entries
    for (var i = 0, n = qmEntries.length; i < n; i++) {
      var entry = googObject.clone(qmEntries[i]);
      entry['spatialRequired'] = this.spatialRequired;
      entries.push(entry);
    }

    // ignore disabled areas
    entries = entries.filter(this.shownAreas, this);
    return /** @type {ActiveEntries} */ ({entries: entries, includes: [], excludes: []});
  }

  /**
   * @inheritDoc
   */
  createFilter() {
    var result = '';

    var activeEntries = this.getActiveEntries();
    var entries = activeEntries.entries;
    entries = entries.filter(this.includes, this);
    entries = entries.filter(this.filters, this);

    if (!entries.length) {
      return result;
    }

    // HACK ALERT: We currently don't support advanced filter combinations for Arc, so we just
    // take the first filter AND/OR grouping and send that
    var and = !!entries[0]['filterGroup'];
    var filters = [];
    var seenIds = {};

    for (var i = 0, n = entries.length; i < n; i++) {
      var entry = entries[i];
      var filterId = /** @type {string} */ (entry['filterId']);
      if (filterId && !seenIds[filterId]) {
        seenIds[filterId] = true;

        var filter = this.getFilter(filterId);
        if (filter) {
          filters.push(filter);
        }
      }
    }

    // write it out as an SQL query clause
    result = osUiFilter.prettyPrint(filters, and, true, true);

    return result;
  }

  /**
   * Creates the multipolygon with holes geometry. This accounts for exclusion areas by either adding them as holes
   * to the inclusions or by full wiping out inclusions if necessary.
   *
   * @return {string}
   */
  createGeometry() {
    var hasInclude = false;
    var seenAreas = {};

    var activeEntries = this.getActiveEntries();
    var entries = activeEntries.entries;
    var bucket = googArray.bucket(entries, function(entry) {
      // track which areaIds we've already seen since the expanded entries are inherently duplicative
      var areaId = entry['areaId'];
      if (this.includes(entry) && !seenAreas[areaId]) {
        seenAreas[areaId] = true;
        hasInclude = true;
        return 'inclusion';
      }

      if (this.excludes(entry) && !seenAreas[areaId]) {
        seenAreas[areaId] = true;
        return 'exclusion';
      }
    }, this);

    if (!hasInclude) {
      return '';
    }

    var areaFeature = null;
    var includeEntries = bucket['inclusion'];
    var excludeEntries = bucket['exclusion'];

    //
    // the following combines all active inclusion/exclusion areas into a single geometry, making formatting for Arc
    // much easier. this will do the following:
    //  - start with a clone of the first area
    //  - add inclusions to the area
    //  - remove exclusions from the area
    //  - format the resulting feature for the request
    //

    for (var i = 0, ii = includeEntries.length; i < ii; i++) {
      var entry = includeEntries[i];
      var areaId = /** @type {string} */ (entry['areaId']);
      var inclusion = areaId ? this.getArea(areaId) : null;

      if (inclusion) {
        try {
          if (!areaFeature) {
            var inclusionGeometry = inclusion.getGeometry();
            if (inclusionGeometry) {
              areaFeature = new Feature(inclusionGeometry.clone());
            }
          } else {
            jsts.addTo(areaFeature, inclusion, true);
          }
        } catch (e) {
          // log errors merging the areas, but try to continue if possible
          log.error(logger, 'error merging inclusion areas', e);
        }
      }
    }

    // don't bother if there wasn't at least one inclusion
    if (areaFeature && excludeEntries) {
      for (var i = 0, ii = excludeEntries.length; i < ii; i++) {
        var entry = excludeEntries[i];
        var areaId = /** @type {string} */ (entry['areaId']);
        var exclusion = areaId ? this.getArea(areaId) : null;

        if (exclusion) {
          try {
            jsts.removeFrom(areaFeature, exclusion, true);
          } catch (e) {
            // if the result is empty, we no longer have anything to query
            if (e.message === jsts.ErrorMessage.EMPTY) {
              areaFeature = null;
              break;
            }

            // otherwise log the error and move on
            log.error(logger, 'error merging exclusion areas', e);
          }
        }
      }
    }

    var result = this.areaFormatter.format(areaFeature);
    dispose(areaFeature);
    return result;
  }

  /**
   * @inheritDoc
   */
  doRefresh() {
    if (!this.spatialRequired || this.spatialModifier_.getReplacement()) {
      this.source.loadRequest();
    }
  }

  /**
   * @inheritDoc
   */
  resetModifiers() {
    var newFilter = this.createFilter();
    this.modifier.setReplacement(newFilter);

    var geometry = this.createGeometry();
    this.spatialModifier_.setReplacement(geometry);

    var request = this.source.getRequest();

    if (request) {
      request.removeModifier(this.modifier);
      request.addModifier(this.modifier);

      request.removeModifier(this.spatialModifier_);
      request.addModifier(this.spatialModifier_);
    }

    if (this.spatialRequired && !geometry) {
      this.source.clear();
    }
  }
}

/**
 * Logger for plugin.arc.query.ArcQueryHandler
 * @type {log.Logger}
 */
const logger = log.getLogger('plugin.arc.query.ArcQueryHandler');


export default ArcQueryHandler;

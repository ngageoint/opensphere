goog.provide('plugin.arc.query.ArcQueryHandler');

goog.require('goog.log');
goog.require('ol.Feature');
goog.require('os.geo.jsts');
goog.require('os.query.QueryHandler');
goog.require('os.ui.filter');
goog.require('plugin.arc.query.ArcFilterModifier');
goog.require('plugin.arc.query.ArcSpatialFormatter');
goog.require('plugin.arc.query.ArcSpatialModifier');



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
 *
 * @constructor
 * @extends {os.query.QueryHandler}
 */
plugin.arc.query.ArcQueryHandler = function() {
  plugin.arc.query.ArcQueryHandler.base(this, 'constructor');
  this.setModifier(new plugin.arc.query.ArcFilterModifier());
  this.setAreaFormatter(new plugin.arc.query.ArcSpatialFormatter());
  this.spatialRequired = true;

  /**
   * @type {plugin.arc.query.ArcSpatialModifier}
   * @private
   */
  this.spatialModifier_ = new plugin.arc.query.ArcSpatialModifier();
};
goog.inherits(plugin.arc.query.ArcQueryHandler, os.query.QueryHandler);


/**
 * Logger for plugin.arc.query.ArcQueryHandler
 * @type {goog.log.Logger}
 * @private
 * @const
 */
plugin.arc.query.ArcQueryHandler.LOGGER_ = goog.log.getLogger('plugin.arc.query.ArcQueryHandler');


/**
 * Get the active query entries for this layer.
 * @return {!Array<!Object<string, string|boolean>>}
 * @protected
 */
plugin.arc.query.ArcQueryHandler.prototype.getActiveEntries = function() {
  var layerId = this.getLayerId();
  var qmEntries = os.ui.queryManager.getEntries(layerId, null, null, true);

  // clone the entries
  var entries = [];
  for (var i = 0, n = qmEntries.length; i < n; i++) {
    var entry = goog.object.clone(qmEntries[i]);
    entry['spatialRequired'] = this.spatialRequired;
    entries.push(entry);
  }

  // ignore disabled areas
  entries = entries.filter(os.ui.query.QueryHandler.shownAreas);

  return entries;
};


/**
 * @inheritDoc
 */
plugin.arc.query.ArcQueryHandler.prototype.createFilter = function() {
  var result = '';

  var entries = this.getActiveEntries();
  entries = entries.filter(os.ui.query.QueryHandler.includes);
  entries = entries.filter(os.ui.query.QueryHandler.filters);

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

      var filter = os.ui.filterManager.getFilter(filterId);
      if (filter) {
        filters.push(filter);
      }
    }
  }

  // write it out as an SQL query clause
  result = os.ui.filter.prettyPrint(filters, and, true, true);

  return result;
};


/**
 * Creates the multipolygon with holes geometry. This accounts for exclusion areas by either adding them as holes
 * to the inclusions or by full wiping out inclusions if necessary.
 * @return {string}
 */
plugin.arc.query.ArcQueryHandler.prototype.createGeometry = function() {
  var hasInclude = false;
  var seenAreas = {};

  var entries = this.getActiveEntries();
  var bucket = goog.array.bucket(entries, function(entry) {
    // track which areaIds we've already seen since the expanded entries are inherently duplicative
    var areaId = entry['areaId'];
    if (os.ui.query.QueryHandler.includes(entry) && !seenAreas[areaId]) {
      seenAreas[areaId] = true;
      hasInclude = true;
      return 'inclusion';
    }

    if (os.ui.query.QueryHandler.excludes(entry) && !seenAreas[areaId]) {
      seenAreas[areaId] = true;
      return 'exclusion';
    }
  });

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
    var inclusion = areaId ? os.ui.areaManager.get(areaId) : null;

    if (inclusion) {
      try {
        if (!areaFeature) {
          var inclusionGeometry = inclusion.getGeometry();
          if (inclusionGeometry) {
            areaFeature = new ol.Feature(inclusionGeometry.clone());
          }
        } else {
          os.geo.jsts.addTo(areaFeature, inclusion, true);
        }
      } catch (e) {
        // log errors merging the areas, but try to continue if possible
        goog.log.error(plugin.arc.query.ArcQueryHandler.LOGGER_, 'error merging inclusion areas', e);
      }
    }
  }

  // don't bother if there wasn't at least one inclusion
  if (areaFeature && excludeEntries) {
    for (var i = 0, ii = excludeEntries.length; i < ii; i++) {
      var entry = excludeEntries[i];
      var areaId = /** @type {string} */ (entry['areaId']);
      var exclusion = areaId ? os.ui.areaManager.get(areaId) : null;

      if (exclusion) {
        try {
          os.geo.jsts.removeFrom(areaFeature, exclusion, true);
        } catch (e) {
          // if the result is empty, we no longer have anything to query
          if (e.message === os.geo.jsts.ErrorMessage.EMPTY) {
            areaFeature = null;
            break;
          }

          // otherwise log the error and move on
          goog.log.error(plugin.arc.query.ArcQueryHandler.LOGGER_, 'error merging exclusion areas', e);
        }
      }
    }
  }

  var result = this.areaFormatter.format(areaFeature);
  goog.dispose(areaFeature);
  return result;
};


/**
 * @inheritDoc
 */
plugin.arc.query.ArcQueryHandler.prototype.doRefresh = function() {
  if (!this.spatialRequired || this.spatialModifier_.getReplacement()) {
    this.source.loadRequest();
  }
};


/**
 * @inheritDoc
 */
plugin.arc.query.ArcQueryHandler.prototype.resetModifiers = function() {
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
};

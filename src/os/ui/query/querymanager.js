goog.provide('os.ui.query.QueryManager');
goog.require('goog.async.Delay');
goog.require('goog.events.EventTarget');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('goog.string');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.ui.filter.FilterManager');
goog.require('os.ui.query');
goog.require('os.ui.query.AreaManager');
goog.require('os.ui.query.ComboNode');



/**
 * @constructor
 * @extends {goog.events.EventTarget}
 */
os.ui.query.QueryManager = function() {
  os.ui.query.QueryManager.base(this, 'constructor');

  /**
   * @protected
   * @type {Array<!Object<string, string|boolean>>}
   */
  this.entries = [];

  /**
   * @protected
   * @type {Array<!Object<string, string|boolean>>}
   */
  this.expandedEntries = [];

  /**
   * @type {Array<os.ui.query.QueryHandler>}
   * @protected
   */
  this.handlers = [];

  /**
   * @type {!Object<string, boolean>}
   * @protected
   */
  this.idsToUpdate = {};

  /**
   * @type {goog.async.Delay}
   * @protected
   */
  this.refreshTimer = new goog.async.Delay(this.onRefreshTimer_, 20, this);

  /**
   * @type {goog.async.Delay}
   * @protected
   */
  this.updateTimer = new goog.async.Delay(this.onUpdateTimer_, 20, this);

  os.ui.areaManager.listen(goog.events.EventType.PROPERTYCHANGE, this.onAreaToggle, false, this);
  os.ui.filterManager.listen(goog.events.EventType.PROPERTYCHANGE, this.onFilterToggle, false, this);

  this.load();
};
goog.inherits(os.ui.query.QueryManager, goog.events.EventTarget);
goog.addSingletonGetter(os.ui.query.QueryManager);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.ui.query.QueryManager.LOGGER_ = goog.log.getLogger('os.ui.query.QueryManager');


/**
 * Saves the entry data
 * @protected
 */
os.ui.query.QueryManager.prototype.save = function() {};


/**
 * Loads the entry data
 * @protected
 */
os.ui.query.QueryManager.prototype.load = function() {};


/**
 * @param {?string=} opt_layerId
 * @param {?string=} opt_areaId
 * @param {?string=} opt_filterId
 * @param {?boolean=} opt_expanded Whether to get from the original list or expanded list
 * @param {?boolean=} opt_includeNegations Whether to include negation entries in the result
 * @return {!Array<!Object<string, string|boolean>>}
 */
os.ui.query.QueryManager.prototype.getEntries = function(opt_layerId, opt_areaId, opt_filterId, opt_expanded,
    opt_includeNegations) {
  var entries = opt_expanded ? this.expandedEntries : this.entries;
  opt_includeNegations = !!opt_includeNegations;

  if (!opt_layerId && !opt_areaId && !opt_filterId) {
    return entries.slice();
  }

  return entries.filter(
      /**
       * @param {!Object<string, string|boolean>} item
       * @param {number} i
       * @param {Array} arr
       * @return {boolean}
       */
      function(item, i, arr) {
        return (opt_includeNegations || !('negate' in item)) &&
            (!opt_layerId || opt_layerId == item['layerId']) &&
            (!opt_areaId || opt_areaId == item['areaId']) &&
            (!opt_filterId || opt_filterId == item['filterId']);
      });
};


/**
 * Ensure new ids are getting updated if they didnt exist before
 * @param {Array<!Object<string, string|boolean>>} oldEntries
 * @param {Array<!Object<string, string|boolean>>} newEntries
 * @private
 */
os.ui.query.QueryManager.prototype.addIdsToUpdate_ = function(oldEntries, newEntries) {
  for (var i = 0; i < newEntries.length; i++) {
    var newEntry = goog.array.findIndex(oldEntries, function(oldEntry) {
      return goog.object.equals(oldEntry, newEntries[i]);
    }) == -1;
    if (newEntry && this.isActive(/** @type {string} */ (newEntries[i]['areaId']))) {
      var layerId = /** @type {string} */ (newEntries[i]['layerId']);
      this.idsToUpdate[layerId] = true;
    }
  }
};


/**
 * Updates local expanded collection before eventing and saving.
 * @private
 */
os.ui.query.QueryManager.prototype.onUpdateTimer_ = function() {
  var expandedEntries = this.getExpanded();
  this.addIdsToUpdate_(this.expandedEntries, expandedEntries);
  this.expandedEntries = expandedEntries;
  this.onRefreshTimer_();
  this.save();
};


/**
 * Adds a query entry
 * @param {string} layerId The layer id
 * @param {string} areaId The area id
 * @param {string} filterId The filter id
 * @param {boolean=} opt_includeArea Whether to include (true) or exclude (false) the area. Defaults to true.
 * @param {boolean=} opt_filterGroup True for All/AND, false for Any/OR. Defaults to true.
 * @param {boolean=} opt_temp
 * @param {boolean=} opt_immediate
 */
os.ui.query.QueryManager.prototype.addEntry = function(layerId, areaId, filterId, opt_includeArea, opt_filterGroup,
    opt_temp, opt_immediate) {
  var current = this.getEntries(layerId, areaId, filterId);
  var add = current.length === 0 || current[0]['includeArea'] !== opt_includeArea ||
      current[0]['filterGroup'] !== opt_filterGroup;

  if (add) {
    this.removeEntries(layerId, areaId, filterId);

    var entry = {
      'layerId': layerId,
      'areaId': areaId,
      'filterId': filterId,
      'includeArea': goog.isDef(opt_includeArea) ? opt_includeArea : true,
      'filterGroup': goog.isDef(opt_filterGroup) ? opt_filterGroup : true
    };

    if (opt_temp) {
      entry['temp'] = true;
    }

    this.entries.push(entry);
    this.idsToUpdate[layerId] = true;
  }

  if (opt_immediate) {
    this.onUpdateTimer_();
  } else {
    this.updateTimer.start();
  }
};


/**
 * Whether or not an active, explicit entry exists. Active means that the layer is currently active. Explicit
 * means that the entry does not contain wildcards.
 * @return {boolean}
 */
os.ui.query.QueryManager.prototype.hasActiveExplicitEntries = function() {
  // An entry containing no wildcards indicates that the advanced area/filter combination was used
  var layerSet = this.getLayerSet();

  for (var i = 0, n = this.entries.length; i < n; i++) {
    var entry = this.entries[i];
    var layerId = entry['layerId'];

    if (layerId !== '*' && layerId in layerSet && entry['areaId'] !== '*' && entry['filterId'] !== '*') {
      return true;
    }
  }

  return false;
};


/**
 * Adds a set of query entries
 * @param {!Array<!Object<string, string|boolean>>} entries
 * @param {boolean=} opt_immediate Whether to apply the update immediately
 * @param {string=} opt_layerHint The layer id to update
 */
os.ui.query.QueryManager.prototype.addEntries = function(entries, opt_immediate, opt_layerHint) {
  var layerId = opt_layerHint ? (opt_layerHint === os.ui.query.ALL_ID ? '*' : opt_layerHint) : undefined;
  if (layerId) {
    // if the layer id was provided, only update that layer
    this.idsToUpdate[layerId] = true;
  }

  for (var i = 0, n = entries.length; i < n; i++) {
    this.entries.push(entries[i]);

    if (!layerId && this.isActive(/** @type {string} */ (entries[i]['areaId']))) {
      this.idsToUpdate[/** @type {!string} */ (entries[i]['layerId'])] = true;
    }
  }

  if (opt_immediate) {
    this.onUpdateTimer_();
  } else {
    this.updateTimer.start();
  }
};


/**
 * Gets the active entries
 * @param {boolean=} opt_expanded Whether to get from the original list or expanded list
 * @return {Array<Object<string, string|boolean>>} entries
 */
os.ui.query.QueryManager.prototype.getActiveEntries = function(opt_expanded) {
  var layerSet = this.getLayerSet();
  var am = os.ui.areaManager;
  var fm = os.ui.filterManager;

  var entries = opt_expanded ? this.expandedEntries : this.entries;
  return entries.filter(
      /**
       * @param {Object<string, string|boolean>} e
       * @param {number} i
       * @param {Array} arr
       * @return {boolean}
       */
      function(e, i, arr) {
        var layerId = /** @type {string} */ (e['layerId']);
        var areaId = /** @type {string} */ (e['areaId']);
        var filterId = /** @type {string} */ (e['filterId']);

        if (layerId && layerId !== '*' && !(layerId in layerSet)) {
          return false;
        }

        var area = am.get(areaId);
        if (areaId && areaId !== '*' && (!area || !area.get('shown'))) {
          return false;
        }

        var filter = fm.getFilter(filterId);
        if (filterId && filterId !== '*' && (!filter || !filter.isEnabled())) {
          return false;
        }

        return true;
      });
};


/**
 * Removes all matching entries
 * @param {?string=} opt_layerId
 * @param {?string=} opt_areaId
 * @param {?string=} opt_filterId
 * @param {boolean=} opt_skipUpdate
 */
os.ui.query.QueryManager.prototype.removeEntries = function(opt_layerId, opt_areaId, opt_filterId, opt_skipUpdate) {
  if (!opt_layerId && !opt_areaId && !opt_filterId) {
    goog.log.fine(os.ui.query.QueryManager.LOGGER_, 'Clearing all query entries');
    this.entries.length = 0;

    if (!opt_skipUpdate) {
      this.idsToUpdate['*'] = true;
      this.updateTimer.start();
    }
    return;
  }

  var i = this.entries.length;
  var count = 0;
  while (i--) {
    var item = this.entries[i];

    if ((!opt_layerId || opt_layerId == item['layerId']) && (!opt_areaId || opt_areaId == item['areaId']) &&
        (!opt_filterId || opt_filterId == item['filterId'])) {
      this.entries.splice(i, 1);

      if (!('negate' in item)) {
        this.idsToUpdate[/** @type {!string} */ (item['layerId'])] = true;
      }
      count++;
    }
  }

  if (count > 0) {
    goog.log.fine(os.ui.query.QueryManager.LOGGER_, 'Removed ' + count + ' entries matching layer: ' + opt_layerId +
        ' area: ' + opt_areaId + ' filter: ' + opt_filterId);
    this.updateTimer.start();
  }
};


/**
 * Removes all entries
 * @param {!Array<Object<string, string|boolean>>} entries
 */
os.ui.query.QueryManager.prototype.removeEntriesArr = function(entries) {
  goog.asserts.assert(goog.isDefAndNotNull(entries));

  var i = this.entries.length;
  var count = 0;

  while (i--) {
    var item = this.entries[i];

    if (entries.indexOf(item) > -1) {
      if (!('negate' in item) && this.isActive(/** @type {string} */ (item['areaId']))) {
        this.idsToUpdate[/** @type {!string} */ (item['layerId'])] = true;
      }

      this.entries.splice(i, 1);
      count++;
    }
  }

  if (count > 0) {
    goog.log.fine(os.ui.query.QueryManager.LOGGER_, 'Removed ' + count + ' entries.');
    this.updateTimer.start();
  }
};


/**
 * Registers a query handler.
 * @param {!os.ui.query.QueryHandler} handler The handler to register
 * @param {boolean=} opt_immediate Whether to force an immediate update
 */
os.ui.query.QueryManager.prototype.registerHandler = function(handler, opt_immediate) {
  goog.asserts.assert(handler);
  this.handlers.push(handler);
  opt_immediate ? this.onUpdateTimer_() : this.updateTimer.start();
};


/**
 * @param {!(os.ui.query.QueryHandler|string)} idOrHandler
 */
os.ui.query.QueryManager.prototype.unregisterHandler = function(idOrHandler) {
  var found = false;

  for (var i = 0, n = this.handlers.length; i < n; i++) {
    if (this.handlers[i] === idOrHandler || this.handlers[i].getLayerId() === idOrHandler) {
      this.handlers.splice(i, 1);
      found = true;
      break;
    }
  }

  if (found) {
    this.updateTimer.start();
  }
};


/**
 * Gets a handler by its layerId
 * @param {string} layerId
 * @return {?os.ui.query.QueryHandler}
 */
os.ui.query.QueryManager.prototype.getHandlerById = function(layerId) {
  for (var i = 0, n = this.handlers.length; i < n; i++) {
    if (this.handlers[i].getLayerId() === layerId) {
      return this.handlers[i];
    }
  }

  return null;
};


/**
 * @param {!(string|ol.Feature)} areaOrId
 * @return {number} 0 for none, 1 for exclusion, 2 for inclusion, 3 for both
 */
os.ui.query.QueryManager.prototype.hasArea = function(areaOrId) {
  var type = typeof areaOrId;
  var id = type == 'string' || type == 'number' ? areaOrId : /** @type {string} */ (areaOrId.getId());
  var am = os.ui.areaManager;

  var incl = false;
  var excl = false;

  for (var i = 0, n = this.entries.length; i < n; i++) {
    var e = this.entries[i];
    var areaId = /** @type {string} */ (e['areaId']);

    if (areaId === id) {
      var area = am.get(areaId);

      if (area && area.get('shown')) {
        if (e['includeArea']) {
          incl = true;
        } else {
          excl = true;
        }
      }
    }
  }

  return incl && excl ? 3 : incl ? 2 : excl ? 1 : 0;
};


/**
 * @param {!(string|os.filter.FilterEntry)} filterOrId
 * @return {boolean}
 */
os.ui.query.QueryManager.prototype.hasFilter = function(filterOrId) {
  var type = typeof filterOrId;
  var id = type == 'string' || type == 'number' ? filterOrId : /** @type {string} */ (filterOrId.getId());
  var fm = os.ui.filterManager;

  for (var i = 0, n = this.entries.length; i < n; i++) {
    var e = this.entries[i];
    var filterId = /** @type {string} */ (e['filterId']);

    if (filterId === id) {
      var filter = fm.getFilter(filterId);
      if (filter && filter.isEnabled()) {
        return true;
      }
    }
  }

  return false;
};


/**
 * Asks if a filter is an And or an Or grouping for a particular layer. If the filter is in a complex state with
 * respect to areas, it will not account for the "both" case.
 * @param {!(string|os.filter.FilterEntry)} filterOrId
 * @param {string=} opt_layerId
 * @return {boolean} true for and, false for or
 */
os.ui.query.QueryManager.prototype.isAnd = function(filterOrId, opt_layerId) {
  var type = typeof filterOrId;
  var id = type == 'string' || type == 'number' ? filterOrId : /** @type {string} */ (filterOrId.getId());

  for (var i = 0, n = this.entries.length; i < n; i++) {
    var e = this.entries[i];
    var filterId = /** @type {string} */ (e['filterId']);
    var layerId = /** @type {string} */ (e['layerId']);

    if ((!opt_layerId || opt_layerId === layerId) && filterId === id) {
      return /** @type {boolean} */ (e['filterGroup']);
    }
  }

  return true;
};


/**
 * Schedules a refresh for the given id
 * @param {!string} id
 */
os.ui.query.QueryManager.prototype.scheduleRefresh = function(id) {
  this.idsToUpdate[id] = true;
  this.refreshTimer.start();
};


/**
 * Handles refresh
 * @private
 */
os.ui.query.QueryManager.prototype.onRefreshTimer_ = function() {
  goog.log.fine(os.ui.query.QueryManager.LOGGER_, 'Refreshing layers');
  this.dispatchEvent(new os.events.PropertyChangeEvent('queries', this.idsToUpdate));
  this.idsToUpdate = {};
};


/**
 * @param {!(string|ol.Feature)} areaOrId
 * @return {boolean} Whether the area is registered as an inclusion or exclusion area
 */
os.ui.query.QueryManager.prototype.isActive = function(areaOrId) {
  return this.hasArea(areaOrId) > 0;
};


/**
 * @param {!(string|ol.Feature)} areaOrId
 * @return {boolean} Whether the area is registered as an inclusion area
 */
os.ui.query.QueryManager.prototype.isInclusion = function(areaOrId) {
  return this.hasArea(areaOrId) > 1;
};


/**
 * @param {!(string|ol.Feature)} areaOrId
 * @return {boolean} Whether the area is registered as an exclusion area
 */
os.ui.query.QueryManager.prototype.isExclusion = function(areaOrId) {
  return this.hasArea(areaOrId) % 2 !== 0;
};


/**
 * Whether or not a particular layer has an inclusion area
 * @param {!string} layerId
 * @return {boolean}
 */
os.ui.query.QueryManager.prototype.hasInclusion = function(layerId) {
  var am = os.ui.areaManager;

  for (var i = 0, n = this.entries.length; i < n; i++) {
    var e = this.entries[i];
    var areaId = /** @type {string} */ (e['areaId']);
    var area = am.get(areaId);

    if (e['layerId'] === layerId && areaId && e['includeArea'] && area && area.get('shown')) {
      return true;
    }
  }

  return false;
};


/**
 * Gets the set of layers
 * @return {Object<string, string>}
 */
os.ui.query.QueryManager.prototype.getLayerSet = function() {
  var layerIds = {};
  for (var i = 0, n = this.handlers.length; i < n; i++) {
    var layerId = this.handlers[i].getLayerId();
    var layerName = this.handlers[i].getLayerName();

    if (layerId) {
      layerIds[layerId] = layerName;
    }
  }

  return layerIds;
};


/**
 * @param {!Array<!Object<string, string|boolean>>} entries
 */
os.ui.query.QueryManager.prototype.onToggle = function(entries) {
  this.updateTimer.start();
  var layers = {};

  for (var i = 0, n = entries.length; i < n; i++) {
    layers[entries[i]['layerId']] = true;
  }

  if ('*' in layers) {
    this.scheduleRefresh('*');
  } else {
    for (var layer in layers) {
      this.scheduleRefresh(layer);
    }
  }
};


/**
 * @param {os.events.PropertyChangeEvent} event
 * @protected
 */
os.ui.query.QueryManager.prototype.onAreaToggle = function(event) {
  var prop = event.getProperty();

  if (prop === 'toggle') {
    var value = event.getNewValue();
    var area = /** @type {!ol.Feature} */ (value);
    goog.asserts.assert(!!area);
    var id = /** @type {string} */ (area.getId());
    this.onToggle(this.getEntries(null, id));
  }
};


/**
 * @param {os.events.PropertyChangeEvent} event
 * @protected
 */
os.ui.query.QueryManager.prototype.onFilterToggle = function(event) {
  var prop = event.getProperty();

  if (prop === 'toggle') {
    var value = event.getNewValue();
    var filter = /** @type {os.filter.FilterEntry} */ (value);
    goog.asserts.assert(!!filter);
    var id = /** @type {string} */ (filter.getId());
    this.onToggle(this.getEntries(null, null, id));
  }
};


/**
 * Gets the array of layer ids
 * @return {!Array<string>}
 */
os.ui.query.QueryManager.prototype.getLayerIds = function() {
  return goog.object.getKeys(this.getLayerSet());
};


/**
 * @param {!Object<string, string|boolean>} e
 * @return {!string}
 * @private
 */
os.ui.query.QueryManager.getKey_ = function(e) {
  var list = [e['layerId'], e['areaId'], e['filterId'], e['includeArea'], e['filterGroup']];

  if ('negate' in e) {
    list.push(e['negate']);
  }

  return list.join('|');
};


/**
 * Expands all wildcards and returns the resulting set of entries.
 *
 * This is the key function that drives the query manager. The query handlers that write out the filters/areas
 * to the server need entries that are as explicit as possible. However, to make the query manager easier to
 * manage, it supports wildcards. This function expands all the wildcards it can find into the most explicit
 * set of entries that it can make with the available information.
 *
 * Note that there is no support for double wildcard filters (meaning filter entries for all layers and all areas).
 *
 * @param {Array<!Object<string, string|boolean>>=} opt_entries
 * @return {!Array<!Object<string, string|boolean>>}
 */
os.ui.query.QueryManager.prototype.getExpanded = function(opt_entries) {
  var entries = opt_entries || this.entries;
  var set = {};
  var key;

  // just grab entries with wildcards
  var wildcards = [];

  for (var i = 0, n = entries.length; i < n; i++) {
    var e = entries[i];

    if (e['layerId'] === '*' || e['areaId'] === '*' || e['filterId'] === '*') {
      wildcards.push(e);
    } else {
      key = os.ui.query.QueryManager.getKey_(e);
      set[key] = e;
    }
  }

  if (!wildcards.length) {
    return this.entries.slice();
  }

  // get all the available layer IDs
  var layerIds = [];
  var seen = {};
  for (i = 0, n = this.handlers.length; i < n; i++) {
    var value = this.handlers[i].getLayerId();

    if (value && !(value in seen)) {
      layerIds.push({'layerId': value});
      seen[value] = true;
    }
  }

  // get all the global inclusion area ids
  var areas = {'*|*': []};
  var negations = {};
  var filterSet = {};
  i = wildcards.length;
  while (i--) {
    e = wildcards[i];

    var areaId = /** @type {string} */ (e['areaId']);
    var layerId = /** @type {string} */ (e['layerId']);
    var filterId = /** @type {string} */ (e['filterId']);
    var includeArea = /** @type {boolean} */ (e['includeArea']);
    var filterGroup = /** @type {boolean} */ (e['filterGroup']);
    var negate = /** @type {boolean} */ (e['negate']);

    if (areaId && areaId !== '*') {
      var id = layerId + '|' + filterId;

      if (!negate) {
        if (!(id in areas)) {
          areas[id] = [];
        }

        areas[id].push({
          'areaId': areaId,
          'includeArea': includeArea
        });
      }

      if (negate || layerId !== '*') {
        if (!(areaId in negations)) {
          negations[areaId] = {};
        }

        negations[areaId][layerId] = true;
      }
    }

    if (filterId && filterId !== '*') {
      if (!(layerId in filterSet)) {
        filterSet[layerId] = [];
      }

      filterSet[layerId].push({
        'filterId': filterId,
        'filterGroup': filterGroup
      });
    }

    if (negate) {
      wildcards.splice(i, 1);
    }
  }

  // handle layer wildcards on filters
  if ('*' in filterSet) {
    var filters = filterSet['*'];
    for (i = 0, n = filters.length; i < n; i++) {
      for (var j = 0, m = layerIds.length; j < m; j++) {
        var filter = goog.object.clone(filters[i]);
        id = layerIds[j];

        if (!(id in filterSet)) {
          filterSet[id] = [];
        }

        filterSet[id].push(filter);
      }
    }

    delete filterSet['*'];
  }

  var pivots = ['layerId', 'areaId', 'filterId'];

  // loop over each pivot
  for (var p = 0, pn = pivots.length; p < pn; p++) {
    var pivot = pivots[p];
    var newWildcards = [];

    // loop over all wildcards
    for (i = 0, n = wildcards.length; i < n; i++) {
      e = wildcards[i];

      // if there's a wildcard on this pivot
      if (e[pivot] === '*') {
        // then pick the proper array of things to expand
        layerId = /** @type {string} */ (e['layerId']);
        var loop = null;

        if (p === 0) {
          areaId = /** @type {string} */ (e['areaId']);

          loop = layerIds;
          if (areaId && areaId !== '*') {
            var notThese = negations[areaId];

            if (notThese) {
              loop = layerIds.filter(function(e) {
                return !(e['layerId'] in notThese);
              });
            }
          }
        } else if (p === 1) {
          var list = areas[layerId + '|*'];
          var all = areas['*|*'];

          list = list ? list.slice() : [];
          all = all ? all.slice() : [];

          // remove any IDs from all that exist in the more specific list or in the negations
          j = all.length;
          while (j--) {
            areaId = /** @type {string} */ (all[j]['areaId']);
            var remove = false;
            m = list.length;

            var negs = negations[areaId];
            if (negs && layerId in negs) {
              remove = true;
            }

            if (!remove) {
              for (var k = 0; k < m; k++) {
                if (list[k]['areaId'] === areaId) {
                  remove = true;
                  break;
                }
              }
            }

            if (remove) {
              all.splice(j, 1);
            }
          }

          loop = list.concat(all);
        } else {
          loop = filterSet[layerId];
        }

        if (loop && loop.length) {
          for (var l = 0, ln = loop.length; l < ln; l++) {
            var clone = goog.object.clone(e);
            var o = loop[l];

            // merge the object into the clone
            for (key in o) {
              clone[key] = o[key];
            }

            // if there's still a wildcard in the entry, defer it for further processing
            var stillWildcard = false;
            for (var pc = 0, pcn = pivots.length; pc < pcn; pc++) {
              if (clone[pivots[pc]] === '*') {
                stillWildcard = true;
                break;
              }
            }

            if (stillWildcard) {
              newWildcards.push(clone);
            } else {
              key = os.ui.query.QueryManager.getKey_(/** @type {!Object<string, string|boolean>} */ (clone));
              set[key] = clone;
            }
          }
        } else if (!e['includeArea'] || !filterSet[layerId]) {
          // preserve areas for layers without filters
          key = os.ui.query.QueryManager.getKey_(e);
          set[key] = e;
        } else {
          newWildcards.push(e);
        }
      } else {
        // wildcard must be on some other pivot, so preserve it
        newWildcards.push(e);
      }
    }

    wildcards = newWildcards;
  }

  return goog.object.getValues(set).concat(newWildcards);
};


/**
 * @type {Array<!string>}
 * @const
 * @private
 */
os.ui.query.QueryManager.sortFields_ = ['layerId', 'areaId', 'filterId', 'includeArea', 'filterGroup'];


/**
 * @param {Object<string, string|boolean>} a
 * @param {Object<string, string|boolean>} b
 * @return {number} per compare method standards
 */
os.ui.query.QueryManager.sortEntries = function(a, b) {
  var fields = os.ui.query.QueryManager.sortFields_;

  var result = 0;
  for (var i = 0, n = fields.length; i < n; i++) {
    result = goog.array.defaultCompare(a[fields[i]], b[fields[i]]);

    if (result) {
      return result;
    }
  }

  return result;
};


/**
 * This gets the tree used when displaying the filter/combination dialog
 *
 * @param {Array<!string>=} opt_pivots
 * @param {number=} opt_pivot
 * @param {os.ui.query.ComboNode=} opt_node
 * @param {boolean=} opt_flatten
 * @param {Object=} opt_layer Optional layer object to include as if it were in the layer set
 * @param {string=} opt_nodeUI
 * @return {os.ui.query.ComboNode}
 */
os.ui.query.QueryManager.prototype.getPivotData = function(opt_pivots, opt_pivot, opt_node, opt_flatten, opt_layer,
    opt_nodeUI) {
  opt_pivot = goog.isDef(opt_pivot) ? opt_pivot : 0;
  opt_pivots = opt_pivots || ['layer', 'area', 'filter'];

  if (opt_pivot >= opt_pivots.length) {
    return null;
  }

  if (!opt_node) {
    opt_node = new os.ui.query.ComboNode(opt_nodeUI);
    opt_node.setId('root');
  }

  var pivot = opt_pivots[opt_pivot].toLowerCase();
  opt_pivot++;
  var filterId = null;
  var layerId = null;
  var i;
  var n;

  var node = opt_node;
  while (node) {
    var entry = node.getEntry();
    if (entry) {
      var eFilterId = /** @type {string} */ (entry['filterId']);

      if (!filterId && eFilterId !== '*') {
        filterId = eFilterId;
      }

      var eLayerId = /** @type {string} */ (entry['layerId']);
      if (!layerId && eLayerId !== '*') {
        layerId = eLayerId;
      }
    }

    node = node.getParent();
  }

  var fqm = os.ui.filterManager;

  if (opt_flatten && opt_pivot == 2 && opt_node.getId() !== '*') {
    for (var j = opt_pivot - 1; j < opt_pivots.length; j++) {
      pivot = opt_pivots[j].toLowerCase();
      var otherPivot = opt_pivots[(j === opt_pivot - 1 ? opt_pivot : j)].toLowerCase();

      node = new os.ui.query.ComboNode(opt_nodeUI);
      node.setId([layerId, pivot, '*'].join('|'));
      node.setLabel(pivot.charAt(0).toUpperCase() + pivot.substring(1) + 's');
      entry = {};
      entry[otherPivot + 'Id'] = '*';
      node.setEntry(entry);

      opt_node.addChild(node);
      this.getPivotData([pivot], 0, node, opt_flatten, opt_layer, opt_nodeUI);
    }

    return opt_node;
  }

  switch (pivot) {
    case 'layer':
      var layerIds = null;
      if (filterId) {
        // only get the layers applicable to this filter
        var filter = fqm.getFilter(filterId);

        if (filter) {
          layerIds = [filter.type];
        }
      } else if (opt_layer) {
        // an optional layer will restrict us down to only getting the pivots for it
        var name = opt_layer['label'];
        var id = opt_layer['id'];
        node = new os.ui.query.ComboNode(opt_nodeUI);
        node.setId(id);
        node.setLabel((!opt_flatten ? 'Layer: ' : '') + name);
        node.setEntry({
          'layerId': id
        });

        opt_node.addChild(node);
        this.getPivotData(opt_pivots, opt_pivot, node, opt_flatten, opt_layer, opt_nodeUI);
      } else {
        // use the layerIds from queryManager
        layerIds = this.getLayerIds();
      }

      if (layerIds) {
        var layerSet = this.getLayerSet();
        for (i = 0, n = layerIds.length; i < n; i++) {
          var layerName = layerSet[layerIds[i]];

          if (layerName) {
            node = new os.ui.query.ComboNode(opt_nodeUI);
            node.setId(layerIds[i]);
            node.setLabel((!opt_flatten ? 'Layer: ' : '') + layerName);
            node.setEntry({
              'layerId': layerIds[i]
            });

            opt_node.addChild(node);
            this.getPivotData(opt_pivots, opt_pivot, node, opt_flatten, opt_layer, opt_nodeUI);
          }
        }
      }
      break;
    case 'area':
      var areas = os.ui.areaManager.getAll();
      for (i = 0, n = areas.length; i < n; i++) {
        if (areas[i].get('shown')) {
          node = new os.ui.query.ComboNode(opt_nodeUI);
          var id = /** @type {string} */ (areas[i].getId());
          node.setId(id);
          node.setLabel((!opt_flatten ? 'Area: ' : '') + /** @type {string} */ (areas[i].get('title')));
          node.setEntry({
            'areaId': id
          });

          opt_node.addChild(node);
          this.getPivotData(opt_pivots, opt_pivot, node, opt_flatten, opt_layer, opt_nodeUI);
        }
      }
      break;
    case 'filter':
      var filters = fqm.getFilters(layerId);

      if (filters && filters.length) {
        for (i = 0, n = filters.length; i < n; i++) {
          if (filters[i].isEnabled()) {
            node = new os.ui.query.ComboNode(opt_nodeUI);
            node.setId(filters[i].getId());
            node.setLabel((!opt_flatten ? 'Filter: ' : '') + filters[i].getTitle());
            node.setEntry({
              'filterId': filters[i].getId(),
              'layerId': layerId
            });

            opt_node.addChild(node);
            this.getPivotData(opt_pivots, opt_pivot, node, opt_flatten, opt_layer, opt_nodeUI);
          }
        }
      }

      // add no filter node
      if (!opt_flatten) {
        node = new os.ui.query.ComboNode(opt_nodeUI);
        node.setLabel('No filters');
        node.setId('nofilters');
        opt_node.addChild(node);
        this.getPivotData(opt_pivots, opt_pivot, node, opt_flatten, opt_layer, opt_nodeUI);
      }

      break;
    default: break;
  }

  var children = opt_node.getChildren();
  if (!opt_flatten && (!children || !children.length)) {
    node = new os.ui.query.ComboNode(opt_nodeUI);
    node.setLabel('No ' + pivot + 's');
    opt_node.addChild(node);
    this.getPivotData(opt_pivots, opt_pivot, node, opt_flatten, opt_layer, opt_nodeUI);
  } else if (children) {
    children.sort(
        /**
         * @param {os.structs.ITreeNode} a
         * @param {os.structs.ITreeNode} b
         * @return {number} per compare function
         */
        function(a, b) {
          var astr = a.getLabel();
          var bstr = b.getLabel();

          if (goog.isString(astr) && goog.isString(bstr)) {
            return goog.string.caseInsensitiveCompare(astr, bstr);
          }

          return goog.array.defaultCompare(astr, bstr);
        });
  }

  return opt_node;
};


/**
 * @type {?os.ui.query.QueryManager}
 */
os.ui.queryManager = null;

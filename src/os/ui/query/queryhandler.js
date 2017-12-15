goog.provide('os.ui.query.QueryHandler');

goog.require('goog.Disposable');
goog.require('goog.array');
goog.require('goog.async.Delay');
goog.require('os.filter.FilterEntry');
goog.require('os.filter.IFilterFormatter');
goog.require('os.filter.ISpatialFormatter');



/**
 * Class for representing a query consisting of areas and filters. Contains no actual handling logic, just
 * area/filter writing.
 * @constructor
 * @extends {goog.Disposable}
 */
os.ui.query.QueryHandler = function() {
  /**
   * @type {?string}
   * @private
   */
  this.layerId_ = null;

  /**
   * @type {?string}
   * @private
   */
  this.layerName_ = null;

  /**
   * @type {?os.net.ParamModifier}
   * @protected
   */
  this.modifier = null;

  /**
   * @type {?os.filter.ISpatialFormatter}
   * @protected
   */
  this.areaFormatter = null;

  /**
   * @type {?os.filter.ISpatialFormatter}
   * @protected
   */
  this.exclusionFormatter = null;

  /**
   * @type {?os.filter.IFilterFormatter}
   * @protected
   */
  this.filterFormatter = null;

  /**
   * @type {boolean}
   * @protected
   */
  this.spatialRequired = false;
};
goog.inherits(os.ui.query.QueryHandler, goog.Disposable);


/**
 * Get the layer ID associated to this handler
 * @return {?string}
 */
os.ui.query.QueryHandler.prototype.getLayerId = function() {
  return this.layerId_;
};


/**
 * Set the layer ID associated to this handler
 * @param {?string} value
 */
os.ui.query.QueryHandler.prototype.setLayerId = function(value) {
  this.layerId_ = value;
};


/**
 * Get the layer name associated to this handler
 * @return {?string}
 */
os.ui.query.QueryHandler.prototype.getLayerName = function() {
  return this.layerName_;
};


/**
 * Set the layer name associated to this handler
 * @param {?string} value
 */
os.ui.query.QueryHandler.prototype.setLayerName = function(value) {
  this.layerName_ = value;
};


/**
 * Get the parameter modifier.
 * @return {?os.net.ParamModifier}
 */
os.ui.query.QueryHandler.prototype.getModifier = function() {
  return this.modifier;
};


/**
 * Set the parameter modifier.
 * @param {?os.net.ParamModifier} modifier
 */
os.ui.query.QueryHandler.prototype.setModifier = function(modifier) {
  this.modifier = modifier;
};


/**
 * Get the area formatter.
 * @return {?os.filter.ISpatialFormatter}
 */
os.ui.query.QueryHandler.prototype.getAreaFormatter = function() {
  return this.areaFormatter;
};


/**
 * Set the area formatter.
 * @param {?os.filter.ISpatialFormatter} formatter
 */
os.ui.query.QueryHandler.prototype.setAreaFormatter = function(formatter) {
  this.areaFormatter = formatter;
};


/**
 * Get the exclusion formatter.
 * @return {?os.filter.ISpatialFormatter}
 */
os.ui.query.QueryHandler.prototype.getExclusionFormatter = function() {
  return this.exclusionFormatter;
};


/**
 * Set the exclusion formatter.
 * @param {?os.filter.ISpatialFormatter} formatter
 */
os.ui.query.QueryHandler.prototype.setExclusionFormatter = function(formatter) {
  this.exclusionFormatter = formatter;
};


/**
 * Get the filter formatter.
 * @return {?os.filter.IFilterFormatter}
 */
os.ui.query.QueryHandler.prototype.getFilterFormatter = function() {
  return this.filterFormatter;
};


/**
 * Set the filter formatter.
 * @param {?os.filter.IFilterFormatter} formatter
 */
os.ui.query.QueryHandler.prototype.setFilterFormatter = function(formatter) {
  this.filterFormatter = formatter;
};


/**
 * @param {!Object<string, string|boolean>} item
 * @return {boolean}
 */
os.ui.query.QueryHandler.includes = function(item) {
  var id = /** @type {string} */ (item['areaId']);

  if (id !== '*') {
    var area = os.ui.areaManager.get(id);
    return !!area && /** @type {boolean} */ (item['includeArea']);
  }

  return false;
};


/**
 * @param {!Object<string, string|boolean>} item
 * @return {boolean}
 */
os.ui.query.QueryHandler.excludes = function(item) {
  var id = /** @type {string} */ (item['areaId']);
  var area = os.ui.areaManager.get(id);
  return !!area && !item['includeArea'];
};


/**
 * @param {!Object<string, string|boolean>} item
 * @return {boolean}
 */
os.ui.query.QueryHandler.shownAreas = function(item) {
  var id = /** @type {string} */ (item['areaId']);
  var area = os.ui.areaManager.get(id);
  if (item['spatialRequired']) {
    return !!area && !!area.get('shown');
  } else {
    if (id !== '*') {
      if (area && !area.get('shown')) {
        // the area is off but we may have a filter... fix the entry so we keep it
        item['areaId'] = '*';
      }
    }
    return true;
  }
};


/**
 * @param {!Object<string, string|boolean>} item
 * @return {boolean}
 */
os.ui.query.QueryHandler.filters = function(item) {
  var id = /** @type {string} */ (item['filterId']);
  if (id !== '*') {
    var filter = os.ui.filterManager.getFilter(id);
    return !!filter && !!filter.isEnabled();
  } else {
    return true;
  }
};


/**
 * @param {!Object<string, string|boolean>} item
 * @return {!ol.Feature}
 */
os.ui.query.QueryHandler.toExclude = function(item) {
  return /** @type {!ol.Feature} */ (os.ui.areaManager.get(/** @type {string} */ (item['areaId'])));
};


/**
 * Creates the filter
 * @return {string}
 */
os.ui.query.QueryHandler.prototype.createFilter = function() {
  var qm = os.ui.queryManager;
  var am = os.ui.areaManager;
  var fm = os.ui.filterManager;

  // we don't care about layer in the order array
  var order = ['area', 'filter'];

  var layerId = this.getLayerId();
  var qmEntries = qm.getEntries(layerId, null, null, true);

  // clone the entries
  var entries = [];
  for (var i = 0, n = qmEntries.length; i < n; i++) {
    var entry = goog.object.clone(qmEntries[i]);
    entry['spatialRequired'] = this.spatialRequired;
    entries.push(entry);
  }

  // ignore disabled areas
  entries = entries.filter(os.ui.query.QueryHandler.shownAreas);

  // exclusion areas must be handled differently
  var excludes = entries.filter(os.ui.query.QueryHandler.excludes).map(os.ui.query.QueryHandler.toExclude);

  // inclusion areas
  var includes = entries.filter(os.ui.query.QueryHandler.includes);

  if (includes.length) {
    entries = includes.filter(os.ui.query.QueryHandler.filters);
  } else {
    // Theres no inclusions, check to see if we still have filters to apply
    entries = entries.filter(os.ui.query.QueryHandler.filters);

    // Since this is only for exclusions or no areas. We only need 1 of each filter
    goog.array.removeDuplicates(entries, null, function(entry) {
      return /** @type {string} */ (entry['filterId']);
    });
  }

  var result = '';

  if (this.spatialRequired && !includes.length) {
    return result;
  }

  var order1 = order[0] + 'Id';
  entries.sort(function(a, b) {
    return goog.array.defaultCompare(a[order1], b[order1]);
  });

  var lastId = undefined;
  var subfilter = '';
  var group = true;
  var rootItem = null;

  // this only works for id-id and not *-id or id-*
  for (var i = 0, n = entries.length; i < n; i++) {
    var entry = entries[i];
    var id = entry[order1];
    var areaId = /** @type {string} */ (entry['areaId']);
    var filterId = /** @type {string} */ (entry['filterId']);

    var area = areaId && entry['includeArea'] ? am.get(areaId) : null;
    var filter = filterId ? fm.getFilter(filterId) : null;

    var item = id === areaId ? filter : area;
    if (id !== lastId) {
      if (lastId) {
        // wrap subfilter
        subfilter = this.wrap(subfilter, order[1], excludes, group);
        subfilter += this.write(rootItem);
        result += this.wrapAll(subfilter);
        subfilter = '';
      }

      lastId = id;
    }

    subfilter += this.write(item);
    rootItem = id === areaId ? area : filter;
    group = /** @type {boolean} */ (entry['filterGroup']);
  }

  subfilter = this.wrap(subfilter, order[1], excludes, group);
  subfilter += this.write(rootItem);
  result += this.wrapAll(subfilter);
  result = this.wrap(result, order[0], excludes, group);

  return result;
};


/**
 * Writes an item
 * @param {os.filter.FilterEntry|ol.Feature} item
 * @return {!string}
 * @protected
 */
os.ui.query.QueryHandler.prototype.write = function(item) {
  if (item) {
    return item instanceof os.filter.FilterEntry ? this.writeFilter(item) : this.writeArea(item);
  }

  return '';
};


/**
 * Writes an area
 * @param {!ol.Feature} area
 * @return {!string}
 * @protected
 */
os.ui.query.QueryHandler.prototype.writeArea = function(area) {
  return this.areaFormatter ? this.areaFormatter.format(area) : '';
};


/**
 * Writes a filter
 * @param {!os.filter.FilterEntry} filter
 * @return {!string}
 * @protected
 */
os.ui.query.QueryHandler.prototype.writeFilter = function(filter) {
  return this.filterFormatter ? this.filterFormatter.format(filter) : filter.getFilter() || '';
};


/**
 * @param {!string} filter
 * @param {!string} order
 * @param {!Array<!ol.Feature>} excludes
 * @param {boolean} group
 * @return {!string}
 * @protected
 */
os.ui.query.QueryHandler.prototype.wrap = function(filter, order, excludes, group) {
  group = goog.isDef(group) ? group : true;
  var result = '';

  if (order == 'area') {
    result += this.areaFormatter.wrapMultiple(filter);

    if (this.exclusionFormatter && excludes && excludes.length > 0) {
      var seen = {};
      for (var i = 0, n = excludes.length; i < n; i++) {
        var id = /** @type {string} */ (excludes[i].getId());

        if (!(id in seen)) {
          result += this.exclusionFormatter.format(excludes[i]);
          seen[id] = true;
        }
      }

      result = this.exclusionFormatter.wrapMultiple(result);
    }
  } else if (this.filterFormatter && !goog.string.isEmptySafe(filter)) {
    // don't do this if filter is an empty string, otherwise this will add an empty group
    result += this.filterFormatter.wrap(filter, group);
  }

  return result;
};


/**
 * @param {!string} filter
 * @return {!string}
 * @protected
 */
os.ui.query.QueryHandler.prototype.wrapAll = function(filter) {
  return this.filterFormatter ? this.filterFormatter.wrapAll(filter) : '';
};

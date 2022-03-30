goog.declareModuleId('os.ui.query.QueryHandler');

import FilterEntry from '../../filter/filterentry.js';
import instanceOf from '../../instanceof.js';
import {getAreaManager, getFilterManager, getQueryManager} from '../../query/queryinstance.js';

const Disposable = goog.require('goog.Disposable');
const {defaultCompare, removeDuplicates} = goog.require('goog.array');
const {isEmptyOrWhitespace, makeSafe} = goog.require('goog.string');

const {default: IFilterFormatter} = goog.requireType('os.filter.IFilterFormatter');
const {default: ISpatialFormatter} = goog.requireType('os.filter.ISpatialFormatter');
const {default: ParamModifier} = goog.requireType('os.net.ParamModifier');
const {default: ActiveEntries} = goog.requireType('os.ui.query.ActiveEntries');


/**
 * Class for representing a query consisting of areas and filters. Contains no actual handling logic, just
 * area/filter writing.
 */
export default class QueryHandler extends Disposable {
  /**
   * Constructor.
   */
  constructor() {
    super();

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
     * @type {?ParamModifier}
     * @protected
     */
    this.modifier = null;

    /**
     * @type {?ISpatialFormatter}
     * @protected
     */
    this.areaFormatter = null;

    /**
     * @type {?ISpatialFormatter}
     * @protected
     */
    this.exclusionFormatter = null;

    /**
     * @type {?IFilterFormatter}
     * @protected
     */
    this.filterFormatter = null;

    /**
     * @type {boolean}
     * @protected
     */
    this.spatialRequired = false;
  }

  /**
   * Get the layer ID associated to this handler
   *
   * @return {?string}
   */
  getLayerId() {
    return this.layerId_;
  }

  /**
   * Set the layer ID associated to this handler
   *
   * @param {?string} value
   */
  setLayerId(value) {
    this.layerId_ = value;
  }

  /**
   * Get the layer name associated to this handler
   *
   * @return {?string}
   */
  getLayerName() {
    return this.layerName_;
  }

  /**
   * Set the layer name associated to this handler
   *
   * @param {?string} value
   */
  setLayerName(value) {
    this.layerName_ = value;
  }

  /**
   * Get the parameter modifier.
   *
   * @return {?ParamModifier}
   */
  getModifier() {
    return this.modifier;
  }

  /**
   * Set the parameter modifier.
   *
   * @param {?ParamModifier} modifier
   */
  setModifier(modifier) {
    this.modifier = modifier;
  }

  /**
   * Get the area formatter.
   *
   * @return {?ISpatialFormatter}
   */
  getAreaFormatter() {
    return this.areaFormatter;
  }

  /**
   * Set the area formatter.
   *
   * @param {?ISpatialFormatter} formatter
   */
  setAreaFormatter(formatter) {
    this.areaFormatter = formatter;
  }

  /**
   * Get the exclusion formatter.
   *
   * @return {?ISpatialFormatter}
   */
  getExclusionFormatter() {
    return this.exclusionFormatter;
  }

  /**
   * Set the exclusion formatter.
   *
   * @param {?ISpatialFormatter} formatter
   */
  setExclusionFormatter(formatter) {
    this.exclusionFormatter = formatter;
  }

  /**
   * Get the filter formatter.
   *
   * @return {?IFilterFormatter}
   */
  getFilterFormatter() {
    return this.filterFormatter;
  }

  /**
   * Set the filter formatter.
   *
   * @param {?IFilterFormatter} formatter
   */
  setFilterFormatter(formatter) {
    this.filterFormatter = formatter;
  }

  /**
   * Get the Spatial Required on this handler
   *
   * @return {boolean}
   */
  getSpatialRequired() {
    return this.spatialRequired;
  }

  /**
   * Set the Spatial Required on this handler
   *
   * @param {boolean} value
   */
  setSpatialRequired(value) {
    this.spatialRequired = value;
  }

  /**
   * @param {!Object<string, string|boolean>} item
   * @return {boolean}
   */
  includes(item) {
    var id = /** @type {string} */ (item['areaId']);

    if (id !== '*') {
      var area = this.getArea(id);
      return !!area && /** @type {boolean} */ (item['includeArea']);
    }

    return false;
  }

  /**
   * @param {!Object<string, string|boolean>} item
   * @return {boolean}
   */
  excludes(item) {
    var id = /** @type {string} */ (item['areaId']);
    var area = this.getArea(id);
    return !!area && !item['includeArea'];
  }

  /**
   * @param {!Object<string, string|boolean>} item
   * @return {boolean}
   */
  shownAreas(item) {
    var id = /** @type {string} */ (item['areaId']);
    var area = this.getArea(id);
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
  }

  /**
   * @param {!Object<string, string|boolean>} item
   * @return {boolean}
   */
  filters(item) {
    var id = /** @type {string} */ (item['filterId']);
    if (id !== '*') {
      var filter = this.getFilter(id);
      return !!filter && !!filter.isEnabled();
    } else {
      return true;
    }
  }

  /**
   * @param {!Object<string, string|boolean>} item
   * @return {!Feature}
   */
  toExclude(item) {
    return this.getArea(/** @type {string} */ (item['areaId']));
  }

  /**
   * Gets an area from an id
   * @param {string} id
   * @return {!Feature}
   */
  getArea(id) {
    return /** @type {!Feature} */ (getAreaManager().get(id));
  }

  /**
   * Gets a filter from an id
   * @param {string} id
   * @return {!FilterEntry}
   */
  getFilter(id) {
    return /** @type {!FilterEntry} */ (getFilterManager().getFilter(id));
  }

  /**
   * Gets entries from an id
   * @param {?string} id
   * @return {!Array<!Object<string, string|boolean>>}
   */
  getEntries(id) {
    return getQueryManager().getEntries(id, null, null, true);
  }

  /**
   * Gets entries for the filter
   * @return {ActiveEntries}
   */
  getActiveEntries() {
    var qmEntries = this.getEntries(this.getLayerId());
    var entries = [];
    var includes = [];
    var excludes = [];

    // clone the entries
    for (var i = 0, n = qmEntries.length; i < n; i++) {
      var entry = Object.assign({}, qmEntries[i]);
      entry['spatialRequired'] = this.spatialRequired;
      entries.push(entry);
    }

    // ignore disabled areas
    entries = entries.filter(this.shownAreas, this);

    if (excludes) { // exclusion areas must be handled differently
      var excl = entries.filter(this.excludes, this).map(this.toExclude, this);
      for (var i = 0; i < excl.length; i++) {
        excludes.push(excl[i]);
      }
    }

    if (includes) { // inclusion areas
      var incl = entries.filter(this.includes, this);
      for (var i = 0; i < incl.length; i++) {
        includes.push(incl[i]);
      }

      if (includes.length) {
        entries = includes.filter(this.filters, this);
      } else {
        // Theres no inclusions, check to see if we still have filters to apply
        entries = entries.filter(this.filters, this);

        // Since this is only for exclusions or no areas. We only need 1 of each filter
        removeDuplicates(entries, null, function(entry) {
          return /** @type {string} */ (entry['filterId']);
        });
      }
    }

    return /** @type {ActiveEntries} */ ({entries: entries, includes: includes, excludes: excludes});
  }

  /**
   * Creates the filter
   *
   * @return {string}
   */
  createFilter() {
    var activeEntries = this.getActiveEntries();
    var entries = activeEntries.entries;
    var includes = activeEntries.includes;
    var excludes = activeEntries.excludes;

    // we don't care about layer in the order array
    var order = ['area', 'filter'];

    var result = '';

    if (this.spatialRequired && !includes.length) {
      return result;
    }

    var order1 = order[0] + 'Id';
    entries.sort(function(a, b) {
      return defaultCompare(a[order1], b[order1]);
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

      var area = areaId && entry['includeArea'] ? this.getArea(areaId) : null;
      var filter = filterId ? this.getFilter(filterId) : null;

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
  }

  /**
   * Writes an item
   *
   * @param {FilterEntry|Feature} item
   * @return {!string}
   * @protected
   */
  write(item) {
    if (item) {
      if (instanceOf(item, FilterEntry.NAME)) {
        return this.writeFilter(/** @type {!FilterEntry} */ (item));
      } else {
        return this.writeArea(/** @type {!Feature} */ (item));
      }
    }

    return '';
  }

  /**
   * Writes an area
   *
   * @param {!Feature} area
   * @return {!string}
   * @protected
   */
  writeArea(area) {
    return this.areaFormatter ? this.areaFormatter.format(area) : '';
  }

  /**
   * Writes a filter
   *
   * @param {!FilterEntry} filter
   * @return {!string}
   * @protected
   */
  writeFilter(filter) {
    return this.filterFormatter ? this.filterFormatter.format(filter) : filter.getFilter() || '';
  }

  /**
   * @param {!string} filter
   * @param {!string} order
   * @param {!Array<!Feature>} excludes
   * @param {boolean} group
   * @return {!string}
   * @protected
   */
  wrap(filter, order, excludes, group) {
    group = group !== undefined ? group : true;
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
    } else if (this.filterFormatter && !isEmptyOrWhitespace(makeSafe(filter))) {
      // don't do this if filter is an empty string, otherwise this will add an empty group
      result += this.filterFormatter.wrap(filter, group);
    }

    return result;
  }

  /**
   * @param {!string} filter
   * @return {!string}
   * @protected
   */
  wrapAll(filter) {
    return this.filterFormatter ? this.filterFormatter.wrapAll(filter) : '';
  }

  /**
   * @param {QueryHandler=} opt_result another query handler to clone to
   * @return {QueryHandler}
   */
  clone(opt_result) {
    var clone = opt_result ? opt_result : new QueryHandler();
    clone.setLayerId(this.getLayerId());
    clone.setLayerName(this.getLayerName());
    clone.setModifier(this.getModifier());
    clone.setAreaFormatter(this.getAreaFormatter());
    clone.setExclusionFormatter(this.getExclusionFormatter());
    clone.setFilterFormatter(this.getFilterFormatter());
    clone.setSpatialRequired(this.getSpatialRequired());
    return clone;
  }
}

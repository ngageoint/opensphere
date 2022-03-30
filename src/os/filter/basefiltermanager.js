goog.declareModuleId('os.filter.BaseFilterManager');

import * as olArray from 'ol/src/array.js';

import AlertEventSeverity from '../alert/alerteventseverity.js';
import AlertManager from '../alert/alertmanager.js';
import CommandProcessor from '../command/commandprocessor.js';
import Settings from '../config/settings.js';
import DataManager from '../data/datamanager.js';
import * as dispatcher from '../dispatcher.js';
import PropertyChangeEvent from '../events/propertychangeevent.js';
import * as os from '../os.js';
import {getFilterManager, setFilterManager, getQueryManager} from '../query/queryinstance.js';
import FilterEvent from '../ui/filter/filterevent.js';
import FilterEventType from '../ui/filter/filtereventtype.js';
import {directiveTag as copyFilterUi} from '../ui/filter/ui/copyfilter.js';
import {directiveTag as editFilterUi} from '../ui/filter/ui/editfilters.js';
import {directiveTag as viewFilterUi} from '../ui/filter/ui/viewfilters.js';
import FilterAdd from '../ui/query/cmd/filteraddcmd.js';
import * as osWindow from '../ui/window.js';
import cloneToContext from './clonetocontext.js';
import FilterEntry from './filterentry.js';
import FilterType from './filtertype.js';

const {removeDuplicates} = goog.require('goog.array');
const EventTarget = goog.require('goog.events.EventTarget');
const googObject = goog.require('goog.object');
const googString = goog.require('goog.string');

const {default: IPersistable} = goog.requireType('os.IPersistable');
const {default: IFilterable} = goog.requireType('os.filter.IFilterable');


/**
 * Manager class for keeping track of filter types registered currently in an application
 */
export default class BaseFilterManager extends EventTarget {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * @type {!Object<string, FilterType>}
     * @protected
     */
    this.types = {};

    this.load();
    dispatcher.getInstance().listen(FilterEventType.ADD_FILTER, this.onAddFilterEvent_, false, this);
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    dispatcher.getInstance().unlisten(FilterEventType.ADD_FILTER, this.onAddFilterEvent_, false, this);
  }

  /**
   * Saves the filter data
   *
   * @protected
   */
  save() {}

  /**
   * Loads the filter data
   */
  load() {
    this.dispatchEvent(new PropertyChangeEvent('filters'));
  }

  /**
   * Gets the stored filters
   *
   * @param {string=} opt_layerId
   * @return {?Array<FilterEntry>}
   */
  getStoredFilters(opt_layerId) {
    var obj = Settings.getInstance().get(os.FILTER_STORAGE_KEY);

    if (obj) {
      var all = [];

      for (var key in obj) {
        var type = new FilterType();
        type.restore(obj[key]);
        all = all.concat(type.filters);
      }

      if (opt_layerId) {
        return this.matchFilters(opt_layerId, all);
      }

      return all;
    }

    return null;
  }

  /**
   * Clears the filter data
   */
  clear() {
    googObject.clear(this.types);
    this.save();
  }

  /**
   * Clears the filter data
   */
  clearTemp() {
    if (this.types) {
      for (var type in this.types) {
        var filters = this.types[type].filters;
        if (filters) {
          var i = filters.length;
          while (i--) {
            if (filters[i].isTemporary()) {
              filters.splice(i, 1);
            }
          }
        }
      }
    }
  }

  /**
   * Gets the filters for the given type
   *
   * @param {string} type
   * @return {?Array.<FilterEntry>}
   */
  getFiltersByType(type) {
    if (type in this.types) {
      return this.types[type].filters;
    }

    return null;
  }

  /**
   * Gets the filters for the given type
   *
   * @param {?string=} opt_layerId
   * @return {?Array.<FilterEntry>}
   */
  getFilters(opt_layerId) {
    var all = [];
    for (var type in this.types) {
      all = all.concat(this.types[type].filters);
    }

    if (!opt_layerId) {
      return all.length > 0 ? all : null;
    } else {
      // var filters = this.matchFilters(opt_layerId, all);
      return this.getFiltersByType(opt_layerId);
    }
  }

  /**
   * @param {!string} layerId
   * @return {?IFilterable}
   */
  getFilterable(layerId) {
    return /** @type {IFilterable} */ (DataManager.getInstance().getDescriptor(layerId));
  }

  /**
   * Matches filters against a descriptor
   *
   * @param {string} layerId
   * @param {Array<FilterEntry>} filters
   * @return {?Array<FilterEntry>}
   */
  matchFilters(layerId, filters) {
    var filterable = this.getFilterable(layerId);
    var cols = null;

    if (filterable) {
      try {
        cols = filterable.getFilterColumns();
      } catch (e) {
        // probably not an IFilterable instance
      }
    }

    if (cols) {
      var passed = [];

      for (var i = 0; i < filters.length; i++) {
        var entry = filters[i];
        if (entry.matches(cols)) {
          passed.push(entry);
        }
      }

      return passed;
    }

    return null;
  }

  /**
   * Gets a filter by ID
   *
   * @param {string} id The ID
   * @return {?FilterEntry} The filter or null if none was found
   */
  getFilter(id) {
    var list = this.getFilters();

    if (list) {
      for (var i = 0, n = list.length; i < n; i++) {
        if (list[i].getId() == id) {
          return list[i];
        }
      }
    }

    return null;
  }

  /**
   * Whether or not the given type has a filter
   *
   * @param {string=} opt_type
   * @return {boolean} True if filters exist, false otherwise
   */
  hasFilters(opt_type) {
    var result = this.getFilters(opt_type);
    return !!result && result.length > 0;
  }

  /**
   * Whether or not the given type has enabled filters
   *
   * @param {string=} opt_type
   * @return {boolean} True if enabled filters exist, false otherwise
   */
  hasEnabledFilters(opt_type) {
    var result = this.getFilters(opt_type);

    if (result) {
      for (var i = 0, n = result.length; i < n; i++) {
        if (this.isEnabled(result[i], opt_type)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Determine the number of enabled filters
   *
   * @param {string=} opt_type
   * @return {number} The number of enabled filters
   */
  getNumEnabledFilters(opt_type) {
    var numEnabledFilters = 0;
    var filters = this.getFilters(opt_type) || [];
    for (var i = 0; i < filters.length; i++) {
      if (this.isEnabled(filters[i], opt_type)) {
        numEnabledFilters += 1;
      }
    }
    return numEnabledFilters;
  }

  /**
   * Checks whether the filter is active against the opt_type layer.
   *
   * @param {FilterEntry} filter
   * @param {string=} opt_type
   * @return {boolean}
   */
  isEnabled(filter, opt_type) {
    var qm = getQueryManager();

    if (filter) {
      var results = qm.getEntries(opt_type, null, filter.getId());
      return !!results && !!results.length;
    }

    return false;
  }

  /**
   * Adds a filter
   *
   * @param {FilterEntry} filter
   */
  addFilter(filter) {
    if (filter && filter.type && filter.getFilter()) {
      if (!(filter.type in this.types)) {
        this.types[filter.type] = new FilterType();
      }

      var filters = this.types[filter.type].filters;
      filters.push(filter);

      // deduplicate by ID
      removeDuplicates(filters, undefined, function(f) {
        return f.getId();
      });

      this.dispatchEvent(new FilterEvent(FilterEventType.FILTERS_REFRESH));
      this.save();
    }
  }

  /**
   * Removes a filter
   *
   * @param {FilterEntry} filter
   */
  removeFilter(filter) {
    if (filter && filter.type in this.types) {
      var type = this.types[filter.type];
      olArray.remove(type.filters, filter);

      this.dispatchEvent(new FilterEvent(FilterEventType.FILTERS_REFRESH));
      this.save();
    }
  }

  /**
   * Removes a filter
   *
   * @param {Array<FilterEntry>} filters
   */
  removeFilters(filters) {
    if (filters) {
      filters.forEach(function(filter) {
        if (filter && filter.type in this.types) {
          var type = this.types[filter.type];
          olArray.remove(type.filters, filter);
          type.dirty = true;
        }
      }, this);
    }

    this.dispatchEvent(new FilterEvent(FilterEventType.FILTERS_REFRESH));
    this.save();
  }

  /**
   * Removes a type
   *
   * @param {!string} type
   */
  removeType(type) {
    if (type in this.types) {
      this.types[type].filters = [];
    }

    this.save();
  }

  /**
   * Gets the grouping for a type
   *
   * @param {string} type
   * @return {boolean} True for AND, false for OR
   */
  getGrouping(type) {
    if (type in this.types) {
      return this.types[type].and;
    }

    // this is the default for new types
    return true;
  }

  /**
   * Sets the grouping for a type
   *
   * @param {!string} type
   * @param {boolean} and
   */
  setGrouping(type, and) {
    if (type in this.types) {
      var t = this.types[type];
      var old = t.and;

      if (old !== and) {
        t.and = and;

        var e = new FilterEvent(FilterEventType.GROUPING_CHANGED);
        e.key = type;
        this.dispatchEvent(e);
        this.save();
      }
    }
  }

  /**
   * Toggles the feature on the map
   *
   * @param {string|FilterEntry} filterOrId
   * @param {boolean=} opt_toggle Optional toggle value. If not set, the value will flip.
   */
  toggle(filterOrId, opt_toggle) {
    var id = filterOrId instanceof FilterEntry ? filterOrId.getId() : filterOrId;
    if (id) {
      var filter = this.getFilter(id);
      var enable = opt_toggle !== undefined ? opt_toggle : !filter.isEnabled();
      filter.setEnabled(enable);
      this.save();

      if (filter) {
        this.dispatchEvent(new PropertyChangeEvent('toggle', filter));
        // node needs to be notified since toggling doesn't require a search (filters.js)
        filter.dispatchEvent(new PropertyChangeEvent('enabled', filter));
      }
    }
  }

  /**
   * Handle an add filter event fired on the global dispatcher.
   *
   * @param {goog.events.Event} event
   * @private
   */
  onAddFilterEvent_(event) {
    var entry = cloneToContext(event.entry);
    if (entry) {
      var cmd = new FilterAdd(entry);
      CommandProcessor.getInstance().addCommand(cmd);
    } else {
      var msg = 'Unrecognized filter.';
      AlertManager.getInstance().sendAlert(msg, AlertEventSeverity.ERROR);
    }
  }

  /**
   * Add / Edit the filter
   *
   * @param {string} layerId - the layer id
   * @param {Array} layerColumns - the layer columns
   * @param {function(FilterEntry)} callback The callback to fire when the filter is ready
   * @param {string|FilterEntry=} opt_entry
   * @param {string=} opt_label
   */
  static edit(layerId, layerColumns, callback, opt_entry, opt_label) {
    var edit = false;
    if (opt_entry) {
      edit = true;
    }

    var label = opt_label || ((edit ? 'Edit' : 'Add') + ' Filter');

    var options = {
      'id': 'editfilter',
      'x': 'center',
      'y': 'center',
      'label': label,
      'show-close': true,
      'min-width': 300,
      'min-height': 300,
      'max-width': 1000,
      'max-height': 1000,
      'modal': true,
      'width': 850,
      'height': 425,
      'icon': 'fa fa-filter'
    };

    opt_entry = opt_entry ? opt_entry.clone() : new FilterEntry();
    // Auto-enable new filters
    if (!edit) {
      opt_entry.setEnabled(true);
    }

    if (!opt_entry.getType()) {
      opt_entry.setType(layerId);
    }

    var scopeOptions = {
      'entry': opt_entry,
      'columns': layerColumns,
      'callback': callback
    };

    osWindow.create(options, editFilterUi, undefined, undefined, undefined, scopeOptions);
  }

  /**
   * View the filter
   *
   * @param {string} layerId - the layer id
   * @param {Array} layerColumns - the layer columns
   * @param {function(FilterEntry)} callback The callback to fire when the filter is ready
   * @param {string|FilterEntry=} opt_entry
   * @param {string=} opt_label
   */
  static view(layerId, layerColumns, callback, opt_entry, opt_label) {
    var options = {
      'id': 'editfilter',
      'x': 'center',
      'y': 'center',
      'label': 'View Filter',
      'show-close': true,
      'min-width': 300,
      'min-height': 300,
      'max-width': 1000,
      'max-height': 1000,
      'modal': true,
      'width': 850,
      'height': 425,
      'icon': 'fa fa-filter'
    };

    opt_entry = opt_entry ? opt_entry.clone() : new FilterEntry();

    if (!opt_entry.getType()) {
      opt_entry.setType(layerId);
    }

    var scopeOptions = {
      'entry': opt_entry,
      'columns': layerColumns,
      'viewonly': true
    };

    osWindow.create(options, viewFilterUi, undefined, undefined, undefined, scopeOptions);
  }

  /**
   * Launch the copier for a filter
   *
   * @param {FilterEntry} entry
   * @param {string} layerId
   */
  static copy(entry, layerId) {
    var options = {
      'id': 'copyfilter',
      'x': 'center',
      'y': 'center',
      'label': 'Copy ' + entry.getTitle() + ' to Layers',
      'show-close': true,
      'modal': true,
      'width': 500,
      'height': 'auto',
      'icon': 'fa fa-copy'
    };

    var scopeOptions = {
      'filterEntry': entry,
      'layerId': layerId
    };

    var template = `<${copyFilterUi} filter-entry="filterEntry" layer-id="layerId"></${copyFilterUi}>`;
    osWindow.create(options, template, undefined, undefined, undefined, scopeOptions);
  }

  /**
   * Get a nice name from the filter type
   *
   * @param {string} val
   * @param {boolean=} opt_useType
   * @return {string}
   */
  static prettyPrintType(val, opt_useType) {
    var firstHashIdx = val.indexOf('#');
    if (firstHashIdx != -1) {
      // States are ugly, just get the end of it all
      if (googString.contains(val.substring(0, firstHashIdx), 'state')) {
        val = val.substring(val.lastIndexOf('#') + 1) + ' (state file)';
      } else {
        val = val.substring(firstHashIdx + 1);
        var secHashIdx = val.indexOf('#');
        if (secHashIdx != -1) {
          var type = val.substring(secHashIdx + 1);
          if (opt_useType && type) {
            val = val.substring(0, secHashIdx) + ' ' + googString.toTitleCase(type);
          } else {
            val = val.substring(0, secHashIdx);
          }
        }
      }
    }
    val = val.replace(/_/g, ' ');
    return val;
  }

  /**
   * Get the global instance.
   * @return {!BaseFilterManager}
   */
  static getInstance() {
    // Global instance is managed by the os.query.instance module to avoid circular dependency issues.
    let instance = getFilterManager();
    if (!instance) {
      instance = new BaseFilterManager();
      setFilterManager(instance);
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {BaseFilterManager} value
   */
  static setInstance(value) {
    setFilterManager(value);
  }
}

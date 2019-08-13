goog.provide('os.filter.BaseFilterManager');
goog.provide('os.filter.FilterType');

goog.require('goog.array');
goog.require('goog.events.EventTarget');
goog.require('goog.string');
goog.require('ol.array');
goog.require('os.IPersistable');
goog.require('os.array');
goog.require('os.config.Settings');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.filter.FilterEntry');
goog.require('os.ui.filter.FilterEvent');
goog.require('os.ui.filter.FilterEventType');
goog.require('os.ui.filter.ui.editFiltersDirective');
goog.require('os.ui.query.cmd.FilterAdd');



/**
 * Class representing all of the filters that apply to a particular layer type.
 *
 * @constructor
 * @implements {os.IPersistable}
 */
os.filter.FilterType = function() {
  /**
   * @type {Array.<os.filter.FilterEntry>}
   */
  this.filters = [];

  /**
   * @type {boolean}
   */
  this.and = true;
};


/**
 * @inheritDoc
 */
os.filter.FilterType.prototype.persist = function(opt_to) {
  if (!opt_to) {
    opt_to = {};
  }

  var list = [];
  for (var i = 0, n = this.filters.length; i < n; i++) {
    if (!this.filters[i].isTemporary()) {
      list[i] = this.filters[i].persist();
    }
  }

  opt_to['filters'] = list;
  opt_to['and'] = this.and;
  return opt_to;
};


/**
 * @inheritDoc
 */
os.filter.FilterType.prototype.restore = function(config) {
  this.and = config['and'];
  var list = config['filters'];

  if (list) {
    for (var i = 0, n = list.length; i < n; i++) {
      var entry = new os.filter.FilterEntry();
      if (list[i]) {
        entry.restore(list[i]);
        this.filters.push(entry);
      }
    }
  }
};



/**
 * Manager class for keeping track of filter types registered currently in an application
 *
 * @extends {goog.events.EventTarget}
 * @constructor
 */
os.filter.BaseFilterManager = function() {
  os.filter.BaseFilterManager.base(this, 'constructor');

  /**
   * @type {!Object<string, os.filter.FilterType>}
   * @protected
   */
  this.types = {};

  this.load();
  os.dispatcher.listen(os.ui.filter.FilterEventType.ADD_FILTER, this.onAddFilterEvent_, false, this);
};
goog.inherits(os.filter.BaseFilterManager, goog.events.EventTarget);
goog.addSingletonGetter(os.filter.BaseFilterManager);


/**
 * @define {string} The storage key for filters
 */
goog.define('os.FILTER_STORAGE_KEY', 'filters');


/**
 * @inheritDoc
 */
os.filter.BaseFilterManager.prototype.disposeInternal = function() {
  os.dispatcher.unlisten(os.ui.filter.FilterEventType.ADD_FILTER, this.onAddFilterEvent_, false, this);
};


/**
 * Saves the filter data
 *
 * @protected
 */
os.filter.BaseFilterManager.prototype.save = function() {};


/**
 * Loads the filter data
 */
os.filter.BaseFilterManager.prototype.load = function() {
  this.dispatchEvent(new os.events.PropertyChangeEvent('filters'));
};


/**
 * Gets the stored filters
 *
 * @param {string=} opt_layerId
 * @return {?Array<os.filter.FilterEntry>}
 */
os.filter.BaseFilterManager.prototype.getStoredFilters = function(opt_layerId) {
  var obj = os.settings.get(os.FILTER_STORAGE_KEY);

  if (obj) {
    var all = [];

    for (var key in obj) {
      var type = new os.filter.FilterType();
      type.restore(obj[key]);
      all = all.concat(type.filters);
    }

    if (opt_layerId) {
      return this.matchFilters(opt_layerId, all);
    }

    return all;
  }

  return null;
};


/**
 * Clears the filter data
 */
os.filter.BaseFilterManager.prototype.clear = function() {
  goog.object.clear(this.types);
  this.save();
};


/**
 * Clears the filter data
 */
os.filter.BaseFilterManager.prototype.clearTemp = function() {
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
};


/**
 * Gets the filters for the given type
 *
 * @param {string} type
 * @return {?Array.<os.filter.FilterEntry>}
 */
os.filter.BaseFilterManager.prototype.getFiltersByType = function(type) {
  if (type in this.types) {
    return this.types[type].filters;
  }

  return null;
};


/**
 * Gets the filters for the given type
 *
 * @param {?string=} opt_layerId
 * @return {?Array.<os.filter.FilterEntry>}
 */
os.filter.BaseFilterManager.prototype.getFilters = function(opt_layerId) {
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
};


/**
 * @param {!string} layerId
 * @return {?os.filter.IFilterable}
 */
os.filter.BaseFilterManager.prototype.getFilterable = function(layerId) {
  return /** @type {os.filter.IFilterable} */ (os.dataManager.getDescriptor(layerId));
};


/**
 * Matches filters against a descriptor
 *
 * @param {string} layerId
 * @param {Array<os.filter.FilterEntry>} filters
 * @return {?Array<os.filter.FilterEntry>}
 */
os.filter.BaseFilterManager.prototype.matchFilters = function(layerId, filters) {
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
};


/**
 * Gets a filter by ID
 *
 * @param {string} id The ID
 * @return {?os.filter.FilterEntry} The filter or null if none was found
 */
os.filter.BaseFilterManager.prototype.getFilter = function(id) {
  var list = this.getFilters();

  if (list) {
    for (var i = 0, n = list.length; i < n; i++) {
      if (list[i].getId() == id) {
        return list[i];
      }
    }
  }

  return null;
};


/**
 * Whether or not the given type has a filter
 *
 * @param {string=} opt_type
 * @return {boolean} True if filters exist, false otherwise
 */
os.filter.BaseFilterManager.prototype.hasFilters = function(opt_type) {
  var result = this.getFilters(opt_type);
  return !!result && result.length > 0;
};


/**
 * Whether or not the given type has enabled filters
 *
 * @param {string=} opt_type
 * @return {boolean} True if enabled filters exist, false otherwise
 */
os.filter.BaseFilterManager.prototype.hasEnabledFilters = function(opt_type) {
  var result = this.getFilters(opt_type);

  if (result) {
    for (var i = 0, n = result.length; i < n; i++) {
      if (this.isEnabled(result[i], opt_type)) {
        return true;
      }
    }
  }

  return false;
};


/**
 * Determine the number of enabled filters
 *
 * @param {string=} opt_type
 * @return {number} The number of enabled filters
 */
os.filter.BaseFilterManager.prototype.getNumEnabledFilters = function(opt_type) {
  var numEnabledFilters = 0;
  var filters = this.getFilters(opt_type) || [];
  for (var i = 0; i < filters.length; i++) {
    if (this.isEnabled(filters[i], opt_type)) {
      numEnabledFilters += 1;
    }
  }
  return numEnabledFilters;
};


/**
 * Checks whether the filter is active against the opt_type layer.
 *
 * @param {os.filter.FilterEntry} filter
 * @param {string=} opt_type
 * @return {boolean}
 */
os.filter.BaseFilterManager.prototype.isEnabled = function(filter, opt_type) {
  var qm = os.ui.queryManager;

  if (filter) {
    var results = qm.getEntries(opt_type, null, filter.getId());
    return !!results && !!results.length;
  }

  return false;
};


/**
 * Adds a filter
 *
 * @param {os.filter.FilterEntry} filter
 */
os.filter.BaseFilterManager.prototype.addFilter = function(filter) {
  if (filter && filter.type && filter.getFilter()) {
    if (!(filter.type in this.types)) {
      this.types[filter.type] = new os.filter.FilterType();
    }

    var filters = this.types[filter.type].filters;
    filters.push(filter);

    // deduplicate by ID
    goog.array.removeDuplicates(filters, undefined, function(f) {
      return f.getId();
    });

    this.dispatchEvent(new os.ui.filter.FilterEvent(os.ui.filter.FilterEventType.FILTERS_REFRESH));
    this.save();
  }
};


/**
 * Removes a filter
 *
 * @param {os.filter.FilterEntry} filter
 */
os.filter.BaseFilterManager.prototype.removeFilter = function(filter) {
  if (filter && filter.type in this.types) {
    var type = this.types[filter.type];
    ol.array.remove(type.filters, filter);

    this.dispatchEvent(new os.ui.filter.FilterEvent(os.ui.filter.FilterEventType.FILTERS_REFRESH));
    this.save();
  }
};


/**
 * Removes a filter
 *
 * @param {Array<os.filter.FilterEntry>} filters
 */
os.filter.BaseFilterManager.prototype.removeFilters = function(filters) {
  os.array.forEach(filters, function(filter) {
    if (filter && filter.type in this.types) {
      var type = this.types[filter.type];
      ol.array.remove(type.filters, filter);
      type.dirty = true;
    }
  }, this);

  this.dispatchEvent(new os.ui.filter.FilterEvent(os.ui.filter.FilterEventType.FILTERS_REFRESH));
  this.save();
};


/**
 * Removes a type
 *
 * @param {!string} type
 */
os.filter.BaseFilterManager.prototype.removeType = function(type) {
  if (type in this.types) {
    this.types[type].filters = [];
  }

  this.save();
};


/**
 * Gets the grouping for a type
 *
 * @param {string} type
 * @return {boolean} True for AND, false for OR
 */
os.filter.BaseFilterManager.prototype.getGrouping = function(type) {
  if (type in this.types) {
    return this.types[type].and;
  }

  // this is the default for new types
  return true;
};


/**
 * Sets the grouping for a type
 *
 * @param {!string} type
 * @param {boolean} and
 */
os.filter.BaseFilterManager.prototype.setGrouping = function(type, and) {
  if (type in this.types) {
    var t = this.types[type];
    var old = t.and;

    if (old !== and) {
      t.and = and;

      var e = new os.ui.filter.FilterEvent(os.ui.filter.FilterEventType.GROUPING_CHANGED);
      e.key = type;
      this.dispatchEvent(e);
      this.save();
    }
  }
};


/**
 * Toggles the feature on the map
 *
 * @param {string|os.filter.FilterEntry} filterOrId
 * @param {boolean=} opt_toggle Optional toggle value. If not set, the value will flip.
 */
os.filter.BaseFilterManager.prototype.toggle = function(filterOrId, opt_toggle) {
  var id = filterOrId instanceof os.filter.FilterEntry ? filterOrId.getId() : filterOrId;
  if (id) {
    var filter = this.getFilter(id);
    var enable = opt_toggle !== undefined ? opt_toggle : !filter.isEnabled();
    filter.setEnabled(enable);
    this.save();

    if (filter) {
      this.dispatchEvent(new os.events.PropertyChangeEvent('toggle', filter));
      // node needs to be notified since toggling doesn't require a search (filters.js)
      filter.dispatchEvent(new os.events.PropertyChangeEvent('enabled', filter));
    }
  }
};


/**
 * Handle an add filter event fired on the global dispatcher.
 *
 * @param {goog.events.Event} event
 * @private
 */
os.filter.BaseFilterManager.prototype.onAddFilterEvent_ = function(event) {
  var entry = os.filter.cloneToContext(event.entry);
  if (entry) {
    var cmd = new os.ui.query.cmd.FilterAdd(entry);
    os.commandStack.addCommand(cmd);
  } else {
    var msg = 'Unrecognized filter.';
    os.alertManager.sendAlert(msg, os.alert.AlertEventSeverity.ERROR);
  }
};


/**
 * Add / Edit the filter
 *
 * @param {string} layerId - the layer id
 * @param {Array} layerColumns - the layer columns
 * @param {function(os.filter.FilterEntry)} callback The callback to fire when the filter is ready
 * @param {string|os.filter.FilterEntry=} opt_entry
 * @param {string=} opt_label
 */
os.filter.BaseFilterManager.edit = function(layerId, layerColumns, callback, opt_entry, opt_label) {
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
    'no-scroll': false,
    'min-width': 300,
    'min-height': 300,
    'max-width': 1000,
    'max-height': 1000,
    'modal': true,
    'width': 850,
    'height': 425,
    'icon': 'fa fa-filter'
  };

  opt_entry = opt_entry ? opt_entry.clone() : new os.filter.FilterEntry();
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

  os.ui.window.create(options, 'editfilter', undefined, undefined, undefined, scopeOptions);
};


/**
 * View the filter
 *
 * @param {string} layerId - the layer id
 * @param {Array} layerColumns - the layer columns
 * @param {function(os.filter.FilterEntry)} callback The callback to fire when the filter is ready
 * @param {string|os.filter.FilterEntry=} opt_entry
 * @param {string=} opt_label
 */
os.filter.BaseFilterManager.view = function(layerId, layerColumns, callback, opt_entry, opt_label) {
  var options = {
    'id': 'editfilter',
    'x': 'center',
    'y': 'center',
    'label': 'View Filter',
    'show-close': true,
    'no-scroll': false,
    'min-width': 300,
    'min-height': 300,
    'max-width': 1000,
    'max-height': 1000,
    'modal': true,
    'width': 850,
    'height': 425,
    'icon': 'fa fa-filter'
  };

  opt_entry = opt_entry ? opt_entry.clone() : new os.filter.FilterEntry();

  if (!opt_entry.getType()) {
    opt_entry.setType(layerId);
  }

  var scopeOptions = {
    'entry': opt_entry,
    'columns': layerColumns,
    'viewonly': true
  };

  os.ui.window.create(options, 'viewfilter', undefined, undefined, undefined, scopeOptions);
};


/**
 * Launch the copier for a filter
 *
 * @param {os.filter.FilterEntry} entry
 * @param {string} layerId
 */
os.filter.BaseFilterManager.copy = function(entry, layerId) {
  var options = {
    'id': 'copyfilter',
    'x': 'center',
    'y': 'center',
    'label': 'Copy ' + entry.getTitle() + ' to Layers',
    'show-close': true,
    'no-scroll': false,
    'modal': true,
    'width': 500,
    'height': 'auto',
    'icon': 'fa fa-copy'
  };

  var scopeOptions = {
    'filterEntry': entry,
    'layerId': layerId
  };

  var template = '<copyfilter filter-entry="filterEntry" layer-id="layerId"></copyfilter>';
  os.ui.window.create(options, template, undefined, undefined, undefined, scopeOptions);
};


/**
 * Get a nice name from the filter type
 *
 * @param {string} val
 * @param {boolean=} opt_useType
 * @return {string}
 */
os.filter.BaseFilterManager.prettyPrintType = function(val, opt_useType) {
  var firstHashIdx = val.indexOf('#');
  if (firstHashIdx != -1) {
    // States are ugly, just get the end of it all
    if (goog.string.contains(val.substring(0, firstHashIdx), 'state')) {
      val = val.substring(val.lastIndexOf('#') + 1) + ' (state file)';
    } else {
      val = val.substring(firstHashIdx + 1);
      var secHashIdx = val.indexOf('#');
      if (secHashIdx != -1) {
        var type = val.substring(secHashIdx + 1);
        if (opt_useType && type) {
          val = val.substring(0, secHashIdx) + ' ' + goog.string.toTitleCase(type);
        } else {
          val = val.substring(0, secHashIdx);
        }
      }
    }
  }
  val = val.replace(/_/g, ' ');
  return val;
};


/**
 * @type {?os.filter.BaseFilterManager}
 */
os.ui.filterManager = null;

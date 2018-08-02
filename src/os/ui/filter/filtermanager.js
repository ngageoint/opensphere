goog.provide('os.ui.filter.FilterManager');
goog.provide('os.ui.filter.FilterType');

goog.require('goog.array');
goog.require('goog.events.EventTarget');
goog.require('goog.string');
goog.require('os.IPersistable');
goog.require('os.config.Settings');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.filter.FilterEntry');
goog.require('os.ui.filter.FilterEvent');
goog.require('os.ui.filter.FilterEventType');
goog.require('os.ui.filter.ui.editFiltersDirective');
goog.require('os.ui.query.cmd.FilterAdd');



/**
 * Class representing all of the filters that apply to a particular layer type.
 * @constructor
 * @implements {os.IPersistable}
 */
os.ui.filter.FilterType = function() {
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
os.ui.filter.FilterType.prototype.persist = function(opt_to) {
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
os.ui.filter.FilterType.prototype.restore = function(config) {
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
 * @extends {goog.events.EventTarget}
 * @constructor
 */
os.ui.filter.FilterManager = function() {
  os.ui.filter.FilterManager.base(this, 'constructor');

  /**
   * @type {!Object<string, os.ui.filter.FilterType>}
   * @protected
   */
  this.types = {};

  this.migrateFilters_();
  this.load();

  os.dispatcher.listen(os.ui.filter.FilterEventType.ADD_FILTER, this.onAddFilterEvent_, false, this);
};
goog.inherits(os.ui.filter.FilterManager, goog.events.EventTarget);
goog.addSingletonGetter(os.ui.filter.FilterManager);


/**
 * @define {string} The storage key for filters
 */
goog.define('os.FILTER_STORAGE_KEY', 'filters');


/**
 * @inheritDoc
 */
os.ui.filter.FilterManager.prototype.disposeInternal = function() {
  os.dispatcher.unlisten(os.ui.filter.FilterEventType.ADD_FILTER, this.onAddFilterEvent_, false, this);
};


/**
 * Saves the filter data
 * @protected
 */
os.ui.filter.FilterManager.prototype.save = function() {};


/**
 * Loads the filter data
 */
os.ui.filter.FilterManager.prototype.load = function() {
  this.dispatchEvent(new os.events.PropertyChangeEvent('filters'));
};


/**
 * Gets the stored filters
 * @param {string=} opt_layerId
 * @return {?Array<os.filter.FilterEntry>}
 */
os.ui.filter.FilterManager.prototype.getStoredFilters = function(opt_layerId) {
  var obj = os.settings.get(os.FILTER_STORAGE_KEY);

  if (obj) {
    var all = [];

    for (var key in obj) {
      var type = new os.ui.filter.FilterType();
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
os.ui.filter.FilterManager.prototype.clear = function() {
  goog.object.clear(this.types);
  this.save();
};


/**
 * Clears the filter data
 */
os.ui.filter.FilterManager.prototype.clearTemp = function() {
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
 * @param {string} type
 * @return {?Array.<os.filter.FilterEntry>}
 */
os.ui.filter.FilterManager.prototype.getFiltersByType = function(type) {
  if (type in this.types) {
    return this.types[type].filters;
  }

  return null;
};


/**
 * Gets the filters for the given type
 * @param {?string=} opt_layerId
 * @return {?Array.<os.filter.FilterEntry>}
 */
os.ui.filter.FilterManager.prototype.getFilters = function(opt_layerId) {
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
os.ui.filter.FilterManager.prototype.getFilterable = function(layerId) {
  return /** @type {os.filter.IFilterable} */ (os.dataManager.getDescriptor(layerId));
};


/**
 * Matches filters against a descriptor
 * @param {string} layerId
 * @param {Array<os.filter.FilterEntry>} filters
 * @return {?Array<os.filter.FilterEntry>}
 */
os.ui.filter.FilterManager.prototype.matchFilters = function(layerId, filters) {
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
 * @param {string} id The ID
 * @return {?os.filter.FilterEntry} The filter or null if none was found
 */
os.ui.filter.FilterManager.prototype.getFilter = function(id) {
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
 * @param {string=} opt_type
 * @return {boolean} True if filters exist, false otherwise
 */
os.ui.filter.FilterManager.prototype.hasFilters = function(opt_type) {
  var result = this.getFilters(opt_type);
  return !!result && result.length > 0;
};


/**
 * Whether or not the given type has enabled filters
 * @param {string=} opt_type
 * @return {boolean} True if enabled filters exist, false otherwise
 */
os.ui.filter.FilterManager.prototype.hasEnabledFilters = function(opt_type) {
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
 * Checks whether the filter is active against the opt_type layer.
 * @param {os.filter.FilterEntry} filter
 * @param {string=} opt_type
 * @return {boolean}
 */
os.ui.filter.FilterManager.prototype.isEnabled = function(filter, opt_type) {
  return filter.isEnabled();
};


/**
 * Adds a filter
 * @param {os.filter.FilterEntry} filter
 */
os.ui.filter.FilterManager.prototype.addFilter = function(filter) {
  if (filter && filter.type && filter.getFilter()) {
    if (!(filter.type in this.types)) {
      this.types[filter.type] = new os.ui.filter.FilterType();
    }

    this.types[filter.type].filters.push(filter);
    this.dispatchEvent(new os.ui.filter.FilterEvent(os.ui.filter.FilterEventType.FILTERS_REFRESH));
    this.save();
  }
};


/**
 * Removes a filter
 * @param {os.filter.FilterEntry} filter
 */
os.ui.filter.FilterManager.prototype.removeFilter = function(filter) {
  if (filter && filter.type in this.types) {
    var type = this.types[filter.type];
    goog.array.remove(type.filters, filter);

    this.dispatchEvent(new os.ui.filter.FilterEvent(os.ui.filter.FilterEventType.FILTERS_REFRESH));
    this.save();
  }
};


/**
 * Removes a filter
 * @param {Array<os.filter.FilterEntry>} filters
 */
os.ui.filter.FilterManager.prototype.removeFilters = function(filters) {
  goog.array.forEach(filters, function(filter) {
    if (filter && filter.type in this.types) {
      var type = this.types[filter.type];
      goog.array.remove(type.filters, filter);
      type.dirty = true;
    }
  }, this);

  this.dispatchEvent(new os.ui.filter.FilterEvent(os.ui.filter.FilterEventType.FILTERS_REFRESH));
  this.save();
};


/**
 * Removes a type
 * @param {!string} type
 */
os.ui.filter.FilterManager.prototype.removeType = function(type) {
  if (type in this.types) {
    this.types[type].filters = [];
  }

  this.save();
};


/**
 * Gets the grouping for a type
 * @param {string} type
 * @return {boolean} True for AND, false for OR
 */
os.ui.filter.FilterManager.prototype.getGrouping = function(type) {
  if (type in this.types) {
    return this.types[type].and;
  }

  // this is the default for new types
  return true;
};


/**
 * Sets the grouping for a type
 * @param {!string} type
 * @param {boolean} and
 */
os.ui.filter.FilterManager.prototype.setGrouping = function(type, and) {
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
 * @param {string|os.filter.FilterEntry} filterOrId
 * @param {boolean=} opt_toggle Optional toggle value. If not set, the value will flip.
 */
os.ui.filter.FilterManager.prototype.toggle = function(filterOrId, opt_toggle) {
  var id = filterOrId instanceof os.filter.FilterEntry ? filterOrId.getId() : filterOrId;
  if (id) {
    var filter = this.getFilter(id);
    var enable = goog.isDef(opt_toggle) ? opt_toggle : !filter.isEnabled();
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
 * @param {goog.events.Event} event
 * @private
 */
os.ui.filter.FilterManager.prototype.onAddFilterEvent_ = function(event) {
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
 * Migrate descriptors from direct reference of local storage to settings, which may be server or local persistence
 * @private
 */
os.ui.filter.FilterManager.prototype.migrateFilters_ = function() {
  var str = window.localStorage.getItem(os.FILTER_STORAGE_KEY);
  if (str) {
    var obj = /** @type {Object} */ (JSON.parse(str));
    os.settings.set(os.FILTER_STORAGE_KEY, obj);
    window.localStorage.removeItem(os.FILTER_STORAGE_KEY);
  }
};


/**
 * Add / Edit the filter
 * @param {string} layerId - the layer id
 * @param {Array} layerColumns - the layer columns
 * @param {function(os.filter.FilterEntry)} callback The callback to fire when the filter is ready
 * @param {string|os.filter.FilterEntry=} opt_entry
 * @param {string=} opt_label
 */
os.ui.filter.FilterManager.edit = function(layerId, layerColumns, callback, opt_entry, opt_label) {
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
    'icon': 'filter-icon fa fa-filter'
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
 * @param {string} layerId - the layer id
 * @param {Array} layerColumns - the layer columns
 * @param {function(os.filter.FilterEntry)} callback The callback to fire when the filter is ready
 * @param {string|os.filter.FilterEntry=} opt_entry
 * @param {string=} opt_label
 */
os.ui.filter.FilterManager.view = function(layerId, layerColumns, callback, opt_entry, opt_label) {
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
    'icon': 'filter-icon fa fa-filter'
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
 * @param {os.filter.FilterEntry} entry
 * @param {string} layerId
 */
os.ui.filter.FilterManager.copy = function(entry, layerId) {
  var options = {
    'id': 'copyfilter',
    'x': 'center',
    'y': 'center',
    'label': 'Copy ' + entry.getTitle() + ' to Layers',
    'show-close': true,
    'no-scroll': false,
    'modal': true,
    'width': 500,
    'height': 700,
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
 * @param {string} val
 * @param {boolean=} opt_useType
 * @return {string}
 */
os.ui.filter.FilterManager.prettyPrintType = function(val, opt_useType) {
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
 * @type {?os.ui.filter.FilterManager}
 */
os.ui.filterManager = null;

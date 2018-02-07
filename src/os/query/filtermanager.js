goog.provide('os.query.FilterManager');
goog.require('goog.array');
goog.require('goog.events.EventTarget');
goog.require('goog.string');
goog.require('os.config.Settings');
goog.require('os.filter.FilterEntry');
goog.require('os.filter.IFilterable');
goog.require('os.ui.filter.FilterEvent');
goog.require('os.ui.filter.FilterManager');
goog.require('os.ui.filter.FilterType');



/**
 * OS implementation of the filter manager.
 * @constructor
 * @extends {os.ui.filter.FilterManager}
 */
os.query.FilterManager = function() {
  os.query.FilterManager.base(this, 'constructor');
};
goog.inherits(os.query.FilterManager, os.ui.filter.FilterManager);
goog.addSingletonGetter(os.query.FilterManager);


// replace the os.ui FilterManager's getInstance with this one so we never instantiate a second instance
goog.object.extend(os.ui.filter.FilterManager, {
  getInstance: function() {
    return os.query.FilterManager.getInstance();
  }
});


/**
 * @inheritDoc
 */
os.query.FilterManager.prototype.load = function() {
  var obj = os.settings.get(os.FILTER_STORAGE_KEY);

  if (obj) {
    for (var key in obj) {
      var type = new os.ui.filter.FilterType();
      type.restore(obj[key]);
      this.types[key] = type;
    }

    this.dispatchEvent(new os.ui.filter.FilterEvent(os.ui.filter.FilterEventType.FILTERS_REFRESH));
  }
};


/**
 * @inheritDoc
 */
os.query.FilterManager.prototype.save = function() {
  var obj = {};

  for (var type in this.types) {
    if (this.hasFilters(type)) {
      obj[type] = this.types[type].persist();
    }
  }

  os.settings.set(os.FILTER_STORAGE_KEY, obj);
};


/**
 * @override
 */
os.query.FilterManager.prototype.isEnabled = function(filter, opt_type) {
  var qm = os.ui.queryManager;

  if (filter) {
    var results = qm.getEntries(opt_type, null, filter.getId());
    return !!results && !!results.length;
  }

  return false;
};


/**
 * @inheritDoc
 */
os.query.FilterManager.prototype.getFilterable = function(layerId) {
  var layer = os.MapContainer.getInstance().getLayer(layerId);

  if (layer instanceof os.layer.Vector) {
    return /** @type {os.filter.IFilterable} */ (layer);
  }

  return os.query.FilterManager.base(this, 'getFilterable', layerId);
};


/**
 * Whether or not a filter window is up for the given type
 * @param {?string=} opt_type
 * @return {boolean} True if a window exists, false otherwise
 */
os.query.FilterManager.prototype.isOpen = function(opt_type) {
  return $('#filter' + (opt_type ? '-' + goog.string.hashCode(opt_type) : '')).length > 0;
};


/**
 * Opens the filter manager UI
 * @param {string=} opt_type
 * @param {Array.<os.ogc.FeatureTypeColumn>=} opt_columns
 */
os.query.FilterManager.prototype.open = function(opt_type, opt_columns) {
  if (!this.isOpen(opt_type)) {
    var options = {
      id: 'filter' + (opt_type ? '-' + goog.string.hashCode(opt_type) : ''),
      x: 'center',
      y: 'center',
      label: 'Filters',
      'show-close': true,
      'no-scroll': true,
      'min-width': 300,
      'min-height': 300,
      'max-width': 1000,
      'max-height': 1000,
      width: 400,
      height: 500,
      icon: 'filter-icon fa fa-filter'
    };

    var scopeOptions = {};
    if (opt_type) {
      var layer = /** @type {os.layer.ILayer} */ (os.MapContainer.getInstance().getLayer(opt_type));
      if (layer) {
        if (!opt_columns) {
          try {
            var filterable = /** @type {os.filter.IFilterable} */ (layer);
            if (filterable.isFilterable()) {
              filterable.launchFilterManager();
            }

            return;
          } catch (e) {
            // not an IFilterable instance
          }
        } else {
          scopeOptions['columns'] = opt_columns;
        }

        options.label = layer.getTitle() + ' Filters';
      }

      scopeOptions['type'] = opt_type;
    }

    os.ui.window.create(options, 'filters', undefined, undefined, undefined, scopeOptions);
  }
};

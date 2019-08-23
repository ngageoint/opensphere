goog.provide('os.ui.filter.im.FilterImporter');

goog.require('os.im.Importer');
goog.require('os.ui');


/**
 * Imports filters.
 * @param {os.parse.IParser<T>} parser The parser.
 * @param {string=} opt_layerId The layer id.
 * @param {boolean=} opt_keepId If the original entry id should be preserved. Defaults to false.
 * @extends {os.im.Importer}
 * @constructor
 * @template T
 */
os.ui.filter.im.FilterImporter = function(parser, opt_layerId, opt_keepId) {
  os.ui.filter.im.FilterImporter.base(this, 'constructor', parser);

  /**
   * If the original entry id should be preserved.
   * @type {boolean}
   * @protected
   */
  this.keepId = !!opt_keepId;

  /**
   * The layer id.
   * @type {string|undefined}
   * @protected
   */
  this.layerId = opt_layerId;

  /**
   * The matched filters.
   * @type {Object}
   */
  this.matched = {};

  /**
   * The unmatched filters.
   * @type {Array}
   */
  this.unmatched = [];
};
goog.inherits(os.ui.filter.im.FilterImporter, os.im.Importer);


/**
 * @inheritDoc
 */
os.ui.filter.im.FilterImporter.prototype.reset = function() {
  os.ui.filter.im.FilterImporter.base(this, 'reset');
  this.matched = {};
  this.unmatched = [];
};


/**
 * @inheritDoc
 */
os.ui.filter.im.FilterImporter.prototype.onParsingComplete = function(opt_event) {
  this.processData();
  os.ui.filter.im.FilterImporter.base(this, 'onParsingComplete');
};


/**
 * Process the parsed filters.
 * @protected
 */
os.ui.filter.im.FilterImporter.prototype.processData = function() {
  var filters = /** @type {Array<!os.filter.FilterEntry>} */ (this.getData());

  var matched = {};
  var unmatched = [];
  var matchedCount = 0;

  for (var i = 0, ii = filters.length; i < ii; i++) {
    var filter = filters[i];
    var filterTitle = filter.getTitle();
    var typeOrFilterKey = filter.getType();
    var tooltip = this.getFilterTooltip(filter);
    var icons;
    var layerTitle;
    var filterModel;
    var layerModel;

    if (this.layerId) {
      // if we have a layer ID, we were passed some context from a filter window, so use it
      var impliedFilterable = os.ui.filter.getFilterableByType(this.layerId);
      var columns = impliedFilterable && impliedFilterable.getFilterColumns();

      if (impliedFilterable && columns && filter.matches(columns)) {
        // this filter matches the columns of the passed in context, so add it as such
        var clone = filter.clone();
        if (!this.keepId) {
          clone.setId(goog.string.getRandomString());
        }
        clone.setType(this.layerId);

        filterModel = this.getFilterModel(filterTitle, clone, tooltip);

        if (matched[this.layerId]) {
          // add to the existing layer item
          matched[this.layerId]['filterModels'].push(filterModel);
        } else {
          // define a new layer item
          icons = this.getIconsFromFilterable(impliedFilterable);
          layerTitle = this.getTitleFromFilterable(impliedFilterable, this.layerId);
          layerModel = this.getLayerModel(layerTitle, icons, clone.getMatch(), filterModel);
          matched[this.layerId] = layerModel;
        }

        matchedCount = os.ui.filter.im.FilterImporter.getFilterCount(filterModel, matchedCount);
      }
    } else {
      var filterableTypes = os.ui.filter.getFilterableTypes(typeOrFilterKey);
      var filterables = filterableTypes.map(os.ui.filter.getFilterableByType);

      filterables.forEach(function(filterable) {
        if (filterable) {
          // we matched it by filter key, so clone the filter and set the internal filterable ID as its type
          var clone = filter.clone();
          var type = filterable.getFilterableTypes()[0];
          clone.setId(goog.string.getRandomString());
          clone.setType(type);

          filterModel = this.getFilterModel(filterTitle, clone, tooltip);

          if (matched[type]) {
            matched[type]['filterModels'].push(filterModel);
          } else {
            icons = this.getIconsFromFilterable(filterable);
            layerTitle = this.getTitleFromFilterable(filterable, type);
            layerModel = this.getLayerModel(layerTitle, icons, clone.getMatch(), filterModel);
            matched[type] = layerModel;
          }

          matchedCount = os.ui.filter.im.FilterImporter.getFilterCount(filterModel, matchedCount);
        }
      }, this);

      // always allow the user to try to assign the filter to other layers
      var readableType = filterables[0] ? filterables[0].getTitle() :
          (filterableTypes[0] || typeOrFilterKey).replace(/\_/g, ' ');
      filterModel = this.getFilterModel(filter.getTitle(), filter, tooltip, readableType, false);
      unmatched.push(filterModel);
    }
  }

  // assign all the display values
  this.matched = matched;
  this.unmatched = unmatched;
  this.matchedCount = matchedCount;
};


/**
 * Get the tooltip to display for a filter entry.
 *
 * @param {!os.filter.IFilterEntry} entry The filter entry.
 * @return {string}
 * @protected
 */
os.ui.filter.im.FilterImporter.prototype.getFilterTooltip = function(entry) {
  return os.ui.filter.toFilterString(entry.getFilterNode(), 1000);
};


/**
 * Gets a filter model for the UI.
 *
 * @param {string} title
 * @param {os.filter.IFilterEntry} filter
 * @param {string} tooltip
 * @param {?string=} opt_type
 * @param {?boolean=} opt_match
 * @return {Object}
 */
os.ui.filter.im.FilterImporter.prototype.getFilterModel = function(title, filter, tooltip, opt_type, opt_match) {
  return {
    'title': title,
    'filter': filter,
    'tooltip': tooltip,
    'type': opt_type,
    'matches': opt_match
  };
};


/**
 * Gets a layer model for the UI.
 *
 * @param {?string} layerTitle
 * @param {string} icons
 * @param {boolean} match
 * @param {Object} filterModel
 * @return {Object}
 */
os.ui.filter.im.FilterImporter.prototype.getLayerModel = function(layerTitle, icons, match, filterModel) {
  var sce = os.ui.injector.get('$sce');
  var layerIcon = sce ? sce.trustAsHtml(icons) : icons;
  return {
    'layerTitle': layerTitle,
    'layerIcon': layerIcon,
    'match': match,
    'filterModels': [filterModel]
  };
};


/**
 * Gets icons from a filterable item.
 *
 * @param {!os.filter.IFilterable} filterable
 * @return {string}
 */
os.ui.filter.im.FilterImporter.prototype.getIconsFromFilterable = function(filterable) {
  var icons = '';

  if (os.implements(filterable, os.data.IDataDescriptor.ID)) {
    var color = /** @type {!os.data.IDataDescriptor} */ (filterable).getColor();
    if (color) {
      color = os.color.toHexString(color);
    } else {
      color = '#fff';
    }

    icons = '<i class="fa fa-bars" style="color:' + os.color.toHexString(color) + '"></i>';
  }

  return icons;
};


/**
 * Get the parent provider of a filterable, if available.
 *
 * @param {!os.filter.IFilterable} filterable The filterable object.
 * @return {?string} The provider name, or null if not available.
 */
os.ui.filter.im.FilterImporter.prototype.getProviderFromFilterable = function(filterable) {
  var provider = null;

  if (os.implements(filterable, os.data.IDataDescriptor.ID)) {
    provider = /** @type {!os.data.IDataDescriptor} */ (filterable).getProvider();
  }

  return provider;
};


/**
 * Gets as descriptive a title as possible from a filterable item.
 *
 * @param {!os.filter.IFilterable} filterable
 * @param {string} type
 * @return {?string}
 */
os.ui.filter.im.FilterImporter.prototype.getTitleFromFilterable = function(filterable, type) {
  var title = filterable.getTitle();
  var firstDelimiter = type.indexOf(os.ui.data.BaseProvider.ID_DELIMITER);
  var lastDelimiter = type.lastIndexOf(os.ui.data.BaseProvider.ID_DELIMITER);

  if (firstDelimiter !== lastDelimiter) {
    // tack on the explicit type
    title += ' ' + goog.string.toTitleCase(type.substring(lastDelimiter + 1));
  }

  var provider = this.getProviderFromFilterable(filterable);
  if (provider) {
    title += ' (' + provider + ')';
  }

  return title;
};


/**
 * Gets the total count of filters from a filter model or array of filter models
 *
 * @param {(Object|Array<Object>)} filters The filters.
 * @param {number=} opt_count The current count.
 * @return {number} The total count.
 */
os.ui.filter.im.FilterImporter.getFilterCount = function(filters, opt_count) {
  var count = opt_count || 0;
  filters = goog.isArray(filters) ? filters : [filters];
  filters.forEach(function(filter) {
    count++;

    if (filter['children']) {
      count = os.ui.filter.im.FilterImporter.getFilterCount(filter['children'], count);
    }
  });

  return count;
};

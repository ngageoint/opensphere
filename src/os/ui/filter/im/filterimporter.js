goog.module('os.ui.filter.im.FilterImporter');

const {getRandomString, toTitleCase} = goog.require('goog.string');
const {toHexString} = goog.require('os.color');
const IDataDescriptor = goog.require('os.data.IDataDescriptor');
const Importer = goog.require('os.im.Importer');
const osImplements = goog.require('os.implements');
const ui = goog.require('os.ui');
const BaseProvider = goog.require('os.ui.data.BaseProvider');
const {getFilterableByType, getFilterableTypes, toFilterString} = goog.require('os.ui.filter');

const FilterEntry = goog.requireType('os.filter.FilterEntry');


/**
 * Imports filters.
 * @template T
 */
class FilterImporter extends Importer {
  /**
   * Constructor.
   * @param {os.parse.IParser<T>} parser The parser.
   * @param {string=} opt_layerId The layer id.
   * @param {boolean=} opt_keepId If the original entry id should be preserved. Defaults to false.
   * @param {boolean=} opt_ignoreColumns If the parser should ignore checking if the columns match the filters.
   */
  constructor(parser, opt_layerId, opt_keepId, opt_ignoreColumns) {
    super(parser);

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
     * If the parser should ignore checking if the columns match the filters. To be used only when we can safely
     * assume the columns will match.
     * @type {boolean}
     * @protected
     */
    this.ignoreColumns = false;

    /**
     * The matched filters.
     * @type {Object}
     */
    this.matched = {};

    /**
     * The number of matched filters.
     * @type {number}
     */
    this.matchedCount = 0;

    /**
     * The unmatched filters.
     * @type {Array}
     */
    this.unmatched = [];
  }

  /**
   * Get whether to ignore columns.
   * @return {boolean}
   */
  getIgnoreColumns() {
    return this.ignoreColumns;
  }

  /**
   * Set whether to ignore columns.
   * @param {boolean} value
   */
  setIgnoreColumns(value) {
    this.ignoreColumns = value;
  }

  /**
   * @inheritDoc
   */
  reset() {
    super.reset();
    this.matched = {};
    this.unmatched = [];
  }

  /**
   * @inheritDoc
   */
  onParsingComplete(opt_event) {
    this.processData();
    super.onParsingComplete();
  }

  /**
   * @param {os.filter.IFilterable} filterable
   * @return {Array<os.ogc.FeatureTypeColumn>}
   */
  getFilterColumnsFromFilterable(filterable) {
    return filterable ? filterable.getFilterColumns() : null;
  }

  /**
   * Process the parsed filters.
   * @protected
   */
  processData() {
    var filters = /** @type {Array<!FilterEntry>} */ (this.getData());

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
        var impliedFilterable = getFilterableByType(this.layerId);
        var columns = this.getFilterColumnsFromFilterable(impliedFilterable);

        if (impliedFilterable && columns && (this.ignoreColumns || filter.matches(columns))) {
          // this filter matches the columns of the passed in context, so add it as such
          var clone = filter.clone();
          if (!this.keepId) {
            clone.setId(getRandomString());
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

          matchedCount = FilterImporter.getFilterCount(filterModel, matchedCount);
        }
      } else {
        var filterableTypes = getFilterableTypes(typeOrFilterKey);
        var filterables = filterableTypes.map(getFilterableByType);

        filterables.forEach(function(filterable) {
          if (filterable) {
            // we matched it by filter key, so clone the filter and set the internal filterable ID as its type
            var clone = filter.clone();
            var type = filterable.getFilterableTypes()[0];
            clone.setId(getRandomString());
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

            matchedCount = FilterImporter.getFilterCount(filterModel, matchedCount);
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
  }

  /**
   * Get the tooltip to display for a filter entry.
   *
   * @param {!os.filter.IFilterEntry} entry The filter entry.
   * @return {string}
   * @protected
   */
  getFilterTooltip(entry) {
    return toFilterString(/** @type {FilterEntry} */ (entry).getFilterNode(), 1000);
  }

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
  getFilterModel(title, filter, tooltip, opt_type, opt_match) {
    return {
      'title': title,
      'filter': filter,
      'tooltip': tooltip,
      'type': opt_type,
      'matches': opt_match
    };
  }

  /**
   * Gets a layer model for the UI.
   *
   * @param {?string} layerTitle
   * @param {string} icons
   * @param {boolean} match
   * @param {Object} filterModel
   * @return {Object}
   */
  getLayerModel(layerTitle, icons, match, filterModel) {
    var sce = ui.injector.get('$sce');
    var layerIcon = sce ? sce.trustAsHtml(icons) : icons;
    return {
      'layerTitle': layerTitle,
      'layerIcon': layerIcon,
      'match': match,
      'filterModels': [filterModel]
    };
  }

  /**
   * Gets icons from a filterable item.
   *
   * @param {!os.filter.IFilterable} filterable
   * @return {string}
   */
  getIconsFromFilterable(filterable) {
    var icons = '';

    if (osImplements(filterable, IDataDescriptor.ID)) {
      var color = /** @type {!os.data.IDataDescriptor} */ (filterable).getColor();
      if (color) {
        color = toHexString(color);
      } else {
        color = '#fff';
      }

      icons = '<i class="fa fa-bars" style="color:' + toHexString(color) + '"></i>';
    }

    return icons;
  }

  /**
   * Get the parent provider of a filterable, if available.
   *
   * @param {!os.filter.IFilterable} filterable The filterable object.
   * @return {?string} The provider name, or null if not available.
   */
  getProviderFromFilterable(filterable) {
    var provider = null;

    if (osImplements(filterable, IDataDescriptor.ID)) {
      provider = /** @type {!os.data.IDataDescriptor} */ (filterable).getProvider();
    }

    return provider;
  }

  /**
   * Gets as descriptive a title as possible from a filterable item.
   *
   * @param {!os.filter.IFilterable} filterable
   * @param {string} type
   * @return {?string}
   */
  getTitleFromFilterable(filterable, type) {
    var title = filterable.getTitle();
    var firstDelimiter = type.indexOf(BaseProvider.ID_DELIMITER);
    var lastDelimiter = type.lastIndexOf(BaseProvider.ID_DELIMITER);

    if (firstDelimiter !== lastDelimiter) {
      // tack on the explicit type
      title += ' ' + toTitleCase(type.substring(lastDelimiter + 1));
    }

    var provider = this.getProviderFromFilterable(filterable);
    if (provider) {
      title += ' (' + provider + ')';
    }

    return title;
  }

  /**
   * Gets the total count of filters from a filter model or array of filter models
   *
   * @param {(Object|Array<Object>)} filters The filters.
   * @param {number=} opt_count The current count.
   * @return {number} The total count.
   */
  static getFilterCount(filters, opt_count) {
    var count = opt_count || 0;
    filters = Array.isArray(filters) ? filters : [filters];
    filters.forEach(function(filter) {
      count++;

      if (filter['children']) {
        count = FilterImporter.getFilterCount(filter['children'], count);
      }
    });

    return count;
  }
}

exports = FilterImporter;

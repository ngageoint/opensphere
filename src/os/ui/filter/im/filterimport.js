goog.module('os.ui.filter.im.FilterImport');

goog.require('os.ui.filter.im.FilterImportModelUI');
goog.require('os.ui.layer.LayerPickerUI');

const {assert} = goog.require('goog.asserts');
const dispose = goog.require('goog.dispose');
const {getRandomString} = goog.require('goog.string');
const {ROOT} = goog.require('os');
const AlertEventSeverity = goog.require('os.alert.AlertEventSeverity');
const AlertManager = goog.require('os.alert.AlertManager');
const DataManager = goog.require('os.data.DataManager');
const EventType = goog.require('os.events.EventType');
const IFilterable = goog.require('os.filter.IFilterable');
const osImplements = goog.require('os.implements');
const {getFilterManager, getQueryManager} = goog.require('os.query.instance');
const {apply} = goog.require('os.ui');
const Module = goog.require('os.ui.Module');
const {getFilterableByType} = goog.require('os.ui.filter');
const FilterImporter = goog.require('os.ui.filter.im.FilterImporter');
const FilterParser = goog.require('os.ui.filter.parse.FilterParser');
const IOGCDescriptor = goog.require('os.ui.ogc.IOGCDescriptor');
const {Controller: ComboNodeUICtrl} = goog.require('os.ui.query.ComboNodeUI');
const osWindow = goog.require('os.ui.window');

const GoogEvent = goog.requireType('goog.events.Event');
const IDataDescriptor = goog.requireType('os.data.IDataDescriptor');
const FilterEntry = goog.requireType('os.filter.FilterEntry');
const FeatureTypeColumn = goog.requireType('os.ogc.FeatureTypeColumn');
const IParser = goog.requireType('os.parse.IParser');


/**
 * The filterimport directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  scope: {
    /**
     * Raw filter string data to import.
     * type {string}
     */
    'filterData': '=',
    /**
     * Optional target layer ID to use. If this is defined, the UI will ONLY import to that layer.
     * type {string=}
     */
    'layerId': '=?'
  },
  replace: true,
  templateUrl: ROOT + 'views/filter/im/filterimport.html',
  controller: Controller,
  controllerAs: 'ctrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'filterimport';


/**
 * Add the directive to the module.
 */
Module.directive('filterimport', [directive]);



/**
 * Controller function for the filterimport directive
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$sce} $sce
   * @ngInject
   */
  constructor($scope, $element, $sce) {
    /**
     * @type {?angular.Scope}
     * @protected
     */
    this.scope = $scope;

    /**
     * @type {?angular.JQLite}
     * @protected
     */
    this.element = $element;

    /**
     * @type {?angular.$sce}
     * @protected
     */
    this.sce = $sce;

    /**
     * @type {string}
     * @protected
     */
    this.filterString = /** @type {string} */ ($scope['filterData']);
    assert(this.filterString, 'No filter string provided to import!');

    /**
     * @type {?Array<!FeatureTypeColumn>}
     * @protected
     */
    this.columns = null;

    /**
     * The name to use for filters in the UI.
     * @type {string}
     * @protected
     */
    this.filterTitle = 'filter';

    /**
     * @type {IFilterable}
     * @private
     */
    this['layer'] = null;

    /**
     * Object of filters that have been matched to filterable objects.
     * @type {?Object<string, Object>}
     */
    this['matched'] = null;

    /**
     * Array of filters that have not been matched to filterable objects.
     * @type {!Array<Object>}
     */
    this['unmatched'] = [];

    /**
     * @type {number}
     */
    this['matchedCount'] = 0;

    /**
     * @type {boolean}
     */
    this['hasUnmatchedFilters'] = false;

    /**
     * @type {boolean}
     */
    this['showMatch'] = true;

    /**
     * @type {Array<string>}
     */
    this['groups'] = ComboNodeUICtrl.GROUPS;

    /**
     * @type {!Array<!IFilterable>}
     * @private
     */
    this.filterables_ = this.getFilterables();

    /**
     * The filter importer.
     * @type {FilterImporter}
     * @protected
     */
    this.importer = this.getImporter();
    this.importer.listenOnce(EventType.COMPLETE, this.onImportComplete, false, this);
    this.importer.startImport(this.filterString);

    $scope.$watch('ctrl.layer', this.onLayerChange.bind(this));
  }

  /**
   * Angular $onDestroy lifecycle hook.
   */
  $onDestroy() {
    dispose(this.importer);
    this.importer = null;

    this.scope = null;
    this.element = null;
    this.sce = null;
  }

  /**
   * Get the filterables for this dialog.
   *
   * @return {!Array<!IFilterable>} The parser.
   * @protected
   */
  getFilterables() {
    var descriptors = DataManager.getInstance().getDescriptors();

    // filter down to only the IFilterable descriptors
    var filterables = descriptors.filter(function(d) {
      d = /** @type {IFilterable} */ (d);
      return osImplements(d, IFilterable.ID) && d.isFilterable();
    });

    return /** @type {!Array<!IFilterable>} */ (filterables);
  }

  /**
   * Get the parser.
   *
   * @return {!FilterImporter} The parser.
   * @protected
   */
  getImporter() {
    var layerId = /** @type {string|undefined} */ (this.scope['layerId']);
    return new FilterImporter(this.getParser(), layerId);
  }

  /**
   * Get the parser.
   *
   * @return {!IParser} The parser.
   * @protected
   */
  getParser() {
    return new FilterParser();
  }

  /**
   * Handles parse/import completion.
   *
   * @param {GoogEvent} event
   * @protected
   */
  onImportComplete(event) {
    if (this.importer) {
      // assign all the display values
      this['matched'] = this.importer.matched;
      this['unmatched'] = this.importer.unmatched;
      this['matchedCount'] = this.importer.matchedCount;

      this.importer.reset();

      var layerId = /** @type {string|undefined} */ (this.scope['layerId']);
      if (layerId) {
        // initial layer ID was passed, so go get the filterable for it
        this['layer'] = getFilterableByType(layerId);
      }

      this['hasUnmatchedFilters'] = !this['layer'] && !!this['unmatched'].length;

      apply(this.scope);
    }
  }

  /**
   * Watcher for layer changes. Either requests the columns for the layer or moves forward with validation.
   *
   * @param {IDataDescriptor|IFilterable} layer The layer.
   * @protected
   */
  onLayerChange(layer) {
    this.columns = [];

    if (osImplements(layer, IOGCDescriptor.ID)) {
      // check if the columns are available, and if not, go get them
      var descriptor = /** @type {IOGCDescriptor} */ (layer);
      if (descriptor.isFeatureTypeReady()) {
        var featureType = descriptor.getFeatureType();
        if (featureType) {
          this.columns = featureType.getColumns();
        }
      } else {
        descriptor.setDescribeCallback(this.handleFeatureType_.bind(this, descriptor));
        return;
      }
    } else if (osImplements(layer, IFilterable.ID)) {
      var filterable = /** @type {IFilterable} */ (layer);
      this.columns = filterable.getFilterColumns();
    }

    this.testColumns();
  }

  /**
   * Handles feature type loading success.
   *
   * @param {IOGCDescriptor} descriptor The layer descriptor.
   * @private
   */
  handleFeatureType_(descriptor) {
    var featureType = descriptor.getFeatureType();
    if (featureType) {
      this.columns = featureType.getColumns() || [];
      this.testColumns();
    }
  }

  /**
   * Tests the set of columns against each filter to determine if they match.
   *
   * @protected
   */
  testColumns() {
    this['hasMatchedFilters'] = false;
    this['hasUnmatchedFilters'] = false;

    for (var i = 0, ii = this['unmatched'].length; i < ii; i++) {
      var filterModel = this['unmatched'][i];
      if (this.columns) {
        var filterEntry = filterModel['filter'];
        var matches = filterEntry.matches(this.columns);
        filterModel['matches'] = matches;

        if (filterModel['children']) {
          // set all of the descendants match state
          var fn = function(model) {
            model['matches'] = matches;
            if (model['children']) {
              model['children'].forEach(fn);
            }
          };

          filterModel['children'].forEach(fn);
        }
      } else {
        filterModel['matches'] = false;
      }

      if (!filterModel['matches']) {
        this['hasUnmatchedFilters'] = true;
      } else {
        this['hasMatchedFilters'] = true;
      }
    }

    this.addUnmatched();

    apply(this.scope);
  }

  /**
   * Gets the list of filterable items.
   *
   * @return {!Array<!IFilterable>}
   * @export
   */
  getLayersFunction() {
    return this.filterables_;
  }

  /**
   * Remove a layer from the import list.
   *
   * @param {string} layerId The layer id.
   * @export
   */
  removeLayer(layerId) {
    if (layerId && this['matched'][layerId]) {
      var layerModel = this['matched'][layerId];
      if (layerModel && layerModel['filterModels']) {
        this['matchedCount'] -= FilterImporter.getFilterCount(layerModel['filterModels']);
      }

      delete this['matched'][layerId];
    }
  }

  /**
   * Adds the set of not-matched filters that match the presently selected layer to the list of matched filters.
   *
   * @export
   */
  addUnmatched() {
    var layer = /** @type {IDataDescriptor} */ (this['layer']);
    if (this.importer && osImplements(layer, IFilterable.ID)) {
      var f = /** @type {!IFilterable} */ (layer);
      var i = this['unmatched'].length;
      var matchedCount = 0;

      while (i--) {
        var filterModel = this['unmatched'][i];

        if (filterModel['matches']) {
          // since a single layer can have multiple filterable types, add it for all
          var types = f.getFilterableTypes();

          for (var j = 0, jj = types.length; j < jj; j++) {
            var type = types[j];
            var filter = /** @type {FilterEntry} */ (filterModel['filter']);
            filter = filter.clone();
            filter.setId(getRandomString());
            filter.setType(type);

            filterModel = this.importer.getFilterModel(filterModel['title'], filter, filterModel['tooltip'],
                filterModel['type'], filterModel['match']);

            if (this['matched'][type]) {
              var models = this['matched'][type]['filterModels'];
              var found = models.find(function(m) {
                return m['filter'].getFilter() == filterModel['filter'].getFilter() &&
                    m['filter'].getTitle() == filterModel['filter'].getTitle();
              });

              if (!found) {
                models.push(filterModel);
                matchedCount = FilterImporter.getFilterCount(filterModel, matchedCount);
              }
            } else {
              var icons = this.importer.getIconsFromFilterable(f);
              var layerTitle = this.importer.getTitleFromFilterable(f, type);
              var match = filterModel['filter'].getMatch();
              var layerModel = this.importer.getLayerModel(layerTitle, icons, match, filterModel);
              this['matched'][type] = layerModel;
              matchedCount = FilterImporter.getFilterCount(filterModel, matchedCount);
            }
          }
        }
      }

      this['matchedCount'] += matchedCount;
    }

    this['hasMatchedFilters'] = this['unmatched'].some(function(obj) {
      return !!obj['matches'];
    });
  }

  /**
   * Add the filters to the detected/chosen layers and close the window.
   *
   * @export
   */
  finish() {
    var count = 0;
    var entries = [];

    for (var key in this['matched']) {
      var layerModel = this['matched'][key];
      var filterModels = layerModel['filterModels'];
      var match = /** @type {boolean} */ (layerModel['match']);
      for (var i = 0, ii = filterModels.length; i < ii; i++) {
        // add each filter and create a query entry for it
        var filter = /** @type {FilterEntry} */ (filterModels[i]['filter']);
        getFilterManager().addFilter(filter);

        var entry = {
          'layerId': key,
          'filterId': filter.getId(),
          'areaId': '*',
          'includeArea': true,
          'filterGroup': match
        };
        entries.push(entry);
        count++;
      }

      // modify existing entries on the same layer to have the chosen match value
      var existingEntries = getQueryManager().getEntries(key);
      for (var j = 0, jj = existingEntries.length; j < jj; j++) {
        var existingEntry = existingEntries[j];
        if (existingEntry['filterId'] !== '*') {
          existingEntry['filterGroup'] = match;
        }
      }
    }

    if (entries.length > 0) {
      getQueryManager().addEntries(entries);
    }

    var msg;
    var am = AlertManager.getInstance();
    if (count > 0) {
      msg = 'Successfully imported <b>' + count + (count == 1 ? '</b> filter.' : ' filters.');
      am.sendAlert(msg, AlertEventSeverity.SUCCESS);
    } else {
      msg = 'No filters were imported!';
      am.sendAlert(msg, AlertEventSeverity.WARNING);
    }

    osWindow.close(this.element);
  }

  /**
   * Close the window and cancel the import.
   *
   * @export
   */
  cancel() {
    osWindow.close(this.element);
  }

  /**
   * Get the filter icon class.
   *
   * @return {string}
   * @export
   */
  getFilterIcon() {
    return 'fa-filter';
  }

  /**
   * Get the text to display for the imported filter count.
   *
   * @param {number=} opt_count The count, for determining the plurality.
   * @return {string}
   * @export
   */
  getFilterTitle(opt_count) {
    var plural = opt_count == 1 ? '' : 's';
    return this.filterTitle + plural;
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};

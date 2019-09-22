goog.provide('os.ui.filter.im.FilterImportCtrl');
goog.provide('os.ui.filter.im.filterImportDirective');

goog.require('os.data.IDataDescriptor');
goog.require('os.im.Importer');
goog.require('os.implements');
goog.require('os.ui.Module');
goog.require('os.ui.filter');
goog.require('os.ui.filter.im.FilterImporter');
goog.require('os.ui.filter.im.filterImportModelDirective');
goog.require('os.ui.filter.parse.FilterParser');
goog.require('os.ui.layer.layerPickerDirective');


/**
 * The filterimport directive
 *
 * @return {angular.Directive}
 */
os.ui.filter.im.filterImportDirective = function() {
  return {
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
    templateUrl: os.ROOT + 'views/filter/im/filterimport.html',
    controller: os.ui.filter.im.FilterImportCtrl,
    controllerAs: 'ctrl'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('filterimport', [os.ui.filter.im.filterImportDirective]);



/**
 * Controller function for the filterimport directive
 *
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$sce} $sce
 * @constructor
 * @ngInject
 */
os.ui.filter.im.FilterImportCtrl = function($scope, $element, $sce) {
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
  goog.asserts.assert(this.filterString, 'No filter string provided to import!');

  /**
   * @type {?Array<!os.ogc.FeatureTypeColumn>}
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
   * @type {os.filter.IFilterable}
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
  this['groups'] = os.ui.query.ComboNodeUICtrl.GROUPS;

  /**
   * @type {!Array<!os.filter.IFilterable>}
   * @private
   */
  this.filterables_ = this.getFilterables();

  /**
   * The filter importer.
   * @type {os.ui.filter.im.FilterImporter}
   * @protected
   */
  this.importer = this.getImporter();
  this.importer.listenOnce(os.events.EventType.COMPLETE, this.onImportComplete, false, this);
  this.importer.startImport(this.filterString);

  $scope.$watch('ctrl.layer', this.onLayerChange.bind(this));
};


/**
 * Angular $onDestroy lifecycle hook.
 */
os.ui.filter.im.FilterImportCtrl.prototype.$onDestroy = function() {
  goog.dispose(this.importer);
  this.importer = null;

  this.scope = null;
  this.element = null;
  this.sce = null;
};


/**
 * Get the filterables for this dialog.
 *
 * @return {!Array<!os.filter.IFilterable>} The parser.
 * @protected
 */
os.ui.filter.im.FilterImportCtrl.prototype.getFilterables = function() {
  var descriptors = os.dataManager.getDescriptors();

  // filter down to only the IFilterable descriptors
  var filterables = descriptors.filter(function(d) {
    d = /** @type {os.filter.IFilterable} */ (d);
    return os.implements(d, os.filter.IFilterable.ID) && d.isFilterable();
  });

  return /** @type {!Array<!os.filter.IFilterable>} */ (filterables);
};



/**
 * Get the parser.
 *
 * @return {!os.ui.filter.im.FilterImporter} The parser.
 * @protected
 */
os.ui.filter.im.FilterImportCtrl.prototype.getImporter = function() {
  var layerId = /** @type {string|undefined} */ (this.scope['layerId']);
  return new os.ui.filter.im.FilterImporter(this.getParser(), layerId);
};



/**
 * Get the parser.
 *
 * @return {!os.parse.IParser} The parser.
 * @protected
 */
os.ui.filter.im.FilterImportCtrl.prototype.getParser = function() {
  return new os.ui.filter.parse.FilterParser();
};


/**
 * Handles parse/import completion.
 *
 * @param {goog.events.Event} event
 * @protected
 */
os.ui.filter.im.FilterImportCtrl.prototype.onImportComplete = function(event) {
  if (this.importer) {
    // assign all the display values
    this['matched'] = this.importer.matched;
    this['unmatched'] = this.importer.unmatched;
    this['matchedCount'] = this.importer.matchedCount;

    this.importer.reset();

    var layerId = /** @type {string|undefined} */ (this.scope['layerId']);
    if (layerId) {
      // initial layer ID was passed, so go get the filterable for it
      this['layer'] = os.ui.filter.getFilterableByType(layerId);
    }

    this['hasUnmatchedFilters'] = !this['layer'] && !!this['unmatched'].length;

    os.ui.apply(this.scope);
  }
};


/**
 * Watcher for layer changes. Either requests the columns for the layer or moves forward with validation.
 *
 * @param {os.data.IDataDescriptor|os.filter.IFilterable} layer The layer.
 * @protected
 */
os.ui.filter.im.FilterImportCtrl.prototype.onLayerChange = function(layer) {
  this.columns = [];

  if (os.implements(layer, os.ui.ogc.IOGCDescriptor.ID)) {
    // check if the columns are available, and if not, go get them
    var descriptor = /** @type {os.ui.ogc.IOGCDescriptor} */ (layer);
    if (descriptor.isFeatureTypeReady()) {
      var featureType = descriptor.getFeatureType();
      if (featureType) {
        this.columns = featureType.getColumns();
      }
    } else {
      descriptor.setDescribeCallback(this.handleFeatureType_.bind(this, descriptor));
      return;
    }
  } else if (os.implements(layer, os.filter.IFilterable.ID)) {
    var filterable = /** @type {os.filter.IFilterable} */ (layer);
    this.columns = filterable.getFilterColumns();
  }

  this.testColumns();
};


/**
 * Handles feature type loading success.
 *
 * @param {os.ui.ogc.IOGCDescriptor} descriptor The layer descriptor.
 * @private
 */
os.ui.filter.im.FilterImportCtrl.prototype.handleFeatureType_ = function(descriptor) {
  var featureType = descriptor.getFeatureType();
  if (featureType) {
    this.columns = featureType.getColumns() || [];
    this.testColumns();
  }
};


/**
 * Tests the set of columns against each filter to determine if they match.
 *
 * @protected
 */
os.ui.filter.im.FilterImportCtrl.prototype.testColumns = function() {
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

  os.ui.apply(this.scope);
};


/**
 * Gets the list of filterable items.
 *
 * @return {!Array<!os.filter.IFilterable>}
 * @export
 */
os.ui.filter.im.FilterImportCtrl.prototype.getLayersFunction = function() {
  return this.filterables_;
};


/**
 * Remove a layer from the import list.
 *
 * @param {string} layerId The layer id.
 * @export
 */
os.ui.filter.im.FilterImportCtrl.prototype.removeLayer = function(layerId) {
  if (layerId && this['matched'][layerId]) {
    var layerModel = this['matched'][layerId];
    if (layerModel && layerModel['filterModels']) {
      this['matchedCount'] -= os.ui.filter.im.FilterImporter.getFilterCount(layerModel['filterModels']);
    }

    delete this['matched'][layerId];
  }
};


/**
 * Adds the set of not-matched filters that match the presently selected layer to the list of matched filters.
 *
 * @export
 */
os.ui.filter.im.FilterImportCtrl.prototype.addUnmatched = function() {
  var layer = /** @type {os.data.IDataDescriptor} */ (this['layer']);
  if (this.importer && os.implements(layer, os.filter.IFilterable.ID)) {
    var f = /** @type {!os.filter.IFilterable} */ (layer);
    var i = this['unmatched'].length;
    var matchedCount = 0;

    while (i--) {
      var filterModel = this['unmatched'][i];

      if (filterModel['matches']) {
        // since a single layer can have multiple filterable types, add it for all
        var types = f.getFilterableTypes();

        for (var j = 0, jj = types.length; j < jj; j++) {
          var type = types[j];
          var filter = /** @type {os.filter.FilterEntry} */ (filterModel['filter']);
          filter = filter.clone();
          filter.setId(goog.string.getRandomString());
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
              matchedCount = os.ui.filter.im.FilterImporter.getFilterCount(filterModel, matchedCount);
            }
          } else {
            var icons = this.importer.getIconsFromFilterable(f);
            var layerTitle = this.importer.getTitleFromFilterable(f, type);
            var match = filterModel['filter'].getMatch();
            var layerModel = this.importer.getLayerModel(layerTitle, icons, match, filterModel);
            this['matched'][type] = layerModel;
            matchedCount = os.ui.filter.im.FilterImporter.getFilterCount(filterModel, matchedCount);
          }
        }
      }
    }

    this['matchedCount'] += matchedCount;
  }

  this['hasMatchedFilters'] = this['unmatched'].some(function(obj) {
    return !!obj['matches'];
  });
};


/**
 * Add the filters to the detected/chosen layers and close the window.
 *
 * @export
 */
os.ui.filter.im.FilterImportCtrl.prototype.finish = function() {
  var count = 0;
  var entries = [];

  for (var key in this['matched']) {
    var layerModel = this['matched'][key];
    var filterModels = layerModel['filterModels'];
    var match = /** @type {boolean} */ (layerModel['match']);
    for (var i = 0, ii = filterModels.length; i < ii; i++) {
      // add each filter and create a query entry for it
      var filter = /** @type {os.filter.FilterEntry} */ (filterModels[i]['filter']);
      os.ui.filterManager.addFilter(filter);

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
    var existingEntries = os.ui.queryManager.getEntries(key);
    for (var j = 0, jj = existingEntries.length; j < jj; j++) {
      var existingEntry = existingEntries[j];
      if (existingEntry['filterId'] !== '*') {
        existingEntry['filterGroup'] = match;
      }
    }
  }

  if (entries.length > 0) {
    os.ui.queryManager.addEntries(entries);
  }

  var msg;
  var am = os.alert.AlertManager.getInstance();
  if (count > 0) {
    msg = 'Successfully imported <b>' + count + (count == 1 ? '</b> filter.' : ' filters.');
    am.sendAlert(msg, os.alert.AlertEventSeverity.SUCCESS);
  } else {
    msg = 'No filters were imported!';
    am.sendAlert(msg, os.alert.AlertEventSeverity.WARNING);
  }

  os.ui.window.close(this.element);
};


/**
 * Close the window and cancel the import.
 *
 * @export
 */
os.ui.filter.im.FilterImportCtrl.prototype.cancel = function() {
  os.ui.window.close(this.element);
};


/**
 * Get the filter icon class.
 *
 * @return {string}
 * @export
 */
os.ui.filter.im.FilterImportCtrl.prototype.getFilterIcon = function() {
  return 'fa-filter';
};


/**
 * Get the text to display for the imported filter count.
 *
 * @param {number=} opt_count The count, for determining the plurality.
 * @return {string}
 * @export
 */
os.ui.filter.im.FilterImportCtrl.prototype.getFilterTitle = function(opt_count) {
  var plural = opt_count == 1 ? '' : 's';
  return this.filterTitle + plural;
};

goog.provide('os.ui.filter.im.FilterImportCtrl');
goog.provide('os.ui.filter.im.filterImportDirective');

goog.require('os.data.IDataDescriptor');
goog.require('os.im.Importer');
goog.require('os.implements');
goog.require('os.ui.Module');
goog.require('os.ui.filter');
goog.require('os.ui.filter.parse.FilterParser');
goog.require('os.ui.layer.layerPickerDirective');
goog.require('os.ui.ogc.IOGCDescriptor');


/**
 * The filterimport directive
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
       * Optional initial layer ID to use
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
   * @type {os.data.IDataDescriptor}
   * @private
   */
  this['layer'] = null;

  /**
   * @type {?Object<string, Object>}
   */
  this['found'] = null;

  /**
   * @type {!Array<Object>}
   */
  this['notFound'] = [];

  /**
   * @type {number}
   */
  this['foundCount'] = 0;

  /**
   * @type {number}
   */
  this['notFoundCount'] = 0;

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
  this['groups'] = os.ui.query.ui.ComboNodeUICtrl.GROUPS;

  var descriptors = os.dataManager.getDescriptors();
  var filterables = [];
  for (var i = 0, ii = descriptors.length; i < ii; i++) {
    var d = /** @type {os.filter.IFilterable} */ (descriptors[i]);
    try {
      if (d.isFilterable()) {
        filterables.push(d);
      }
    } catch (e) {
      // not a filterable, don't do anything with it
    }
  }

  /**
   * @type {!Array<!os.data.IDataDescriptor>}
   * @private
   */
  this.filterableDescriptors_ = filterables;

  this.init_();

  $scope.$watch('ctrl.layer', this.onLayerChange_.bind(this));
  $scope.$on('$destroy', this.destroy_.bind(this));
};


/**
 * Clean up.
 * @private
 */
os.ui.filter.im.FilterImportCtrl.prototype.destroy_ = function() {
  this.scope = null;
  this.element = null;
  this.sce = null;
};


/**
 * Get the parser.
 * @return {!os.parse.IParser} The parser.
 * @protected
 */
os.ui.filter.im.FilterImportCtrl.prototype.getParser = function() {
  return new os.ui.filter.parse.FilterParser();
};


/**
 * Creates the parser and starts the import.
 * @private
 */
os.ui.filter.im.FilterImportCtrl.prototype.init_ = function() {
  goog.asserts.assert(this.filterString, 'No filter string provided to import!');

  var importer = new os.im.Importer(this.getParser());
  importer.listenOnce(os.events.EventType.COMPLETE, this.onImportComplete, false, this);
  importer.startImport(this.filterString);
};


/**
 * Handles parse/import completion.
 * @param {goog.events.Event} event
 * @protected
 */
os.ui.filter.im.FilterImportCtrl.prototype.onImportComplete = function(event) {
  var importer = /** @type {os.im.Importer} */ (event.target);
  var filters = /** @type {Array<!os.filter.FilterEntry>} */ (importer.getData());
  importer.dispose();

  var found = {};
  var notFound = [];
  var foundCount = 0;

  for (var i = 0, ii = filters.length; i < ii; i++) {
    var filter = filters[i];
    var filterTitle = filter.getTitle();
    var type = filter.getType();
    var tooltip = this.getFilterTooltip(filter);
    var layerId = this.scope['layerId'];
    var filterable = os.ui.filter.getFilterableByType(type);
    var wasFound = false;
    var icons;
    var layerTitle;
    var filterModel;
    var layerModel;

    if (filterable) {
      // we found it, show the layer its going to be imported into
      filterModel = this.getFilterModel(filterTitle, filter, tooltip);

      if (found[type]) {
        found[type]['filterModels'].push(filterModel);
      } else {
        icons = this.getIconsFromFilterable(filterable);
        layerTitle = this.getTitleFromFilterable(filterable, type);
        layerModel = this.getLayerModel(layerTitle, icons, filter.getMatch(), filterModel);
        found[type] = layerModel;
      }

      foundCount++;
      wasFound = true;
    }

    if (layerId && !wasFound) {
      // if we have a layer ID, we were passed some context from a filter window, so try to use it
      var impliedFilterable = os.ui.filter.getFilterableByType(layerId);
      var columns = impliedFilterable.getFilterColumns();

      if (filter.matches(columns)) {
        // this filter matches the columns of the passed in context, so add it as such
        var clone = filter.clone();
        clone.setId(goog.string.getRandomString());
        clone.setType(layerId);

        filterModel = this.getFilterModel(filterTitle, clone, tooltip);

        if (found[layerId]) {
          // add to the existing layer item
          found[layerId]['filterModels'].push(filterModel);
        } else {
          // define a new layer item
          icons = this.getIconsFromFilterable(impliedFilterable);
          layerTitle = this.getTitleFromFilterable(impliedFilterable, type);
          layerModel = this.getLayerModel(layerTitle, icons, clone.getMatch(), filterModel);
          found[layerId] = layerModel;
        }

        foundCount++;
        wasFound = true;
      }
    }

    if (!wasFound) {
      // we didn't find it, show some info to help the user make decisions about it
      filterModel = this.getFilterModel(filter.getTitle(), filter, tooltip, type.replace(/\_/g, ' '), false);
      notFound.push(filterModel);
    }
  }

  // assign all the display values
  this['found'] = found;
  this['notFound'] = notFound;
  this['foundCount'] = foundCount;

  if (this.scope['layerId']) {
    // initial layer ID was passed, so go get the descriptor for it
    this['layer'] = os.dataManager.getDescriptor(/** @type {string} */ (this.scope['layerId']));
  }

  this['hasUnmatchedFilters'] = !this['layer'] && !!this['notFound'].length;

  os.ui.apply(this.scope);
};


/**
 * Gets a filter model for the UI.
 * @param {string} title
 * @param {os.filter.FilterEntry} filter
 * @param {string} tooltip
 * @param {string=} opt_type
 * @param {boolean=} opt_match
 * @return {Object}
 */
os.ui.filter.im.FilterImportCtrl.prototype.getFilterModel = function(title, filter, tooltip, opt_type, opt_match) {
  return {
    'title': title,
    'filter': filter,
    'tooltip': tooltip,
    'type': opt_type,
    'matches': opt_match
  };
};


/**
 * Get the tooltip to display for a filter entry.
 * @param {!os.filter.FilterEntry} entry The filter entry.
 * @return {string}
 * @protected
 */
os.ui.filter.im.FilterImportCtrl.prototype.getFilterTooltip = function(entry) {
  return os.ui.filter.toFilterString(entry.getFilterNode(), 1000);
};


/**
 * Gets a layer model for the UI.
 * @param {?string} layerTitle
 * @param {string} icons
 * @param {boolean} match
 * @param {Object} filterModel
 * @return {Object}
 */
os.ui.filter.im.FilterImportCtrl.prototype.getLayerModel = function(layerTitle, icons, match, filterModel) {
  return {
    'layerTitle': layerTitle,
    'layerIcon': this.sce.trustAsHtml(icons),
    'match': match,
    'filterModels': [filterModel]
  };
};


/**
 * Watcher for layer changes. Either requests the columns for the layer or moves forward with validation.
 * @param {os.ui.ogc.IOGCDescriptor} descriptor The layer descriptor.
 * @private
 */
os.ui.filter.im.FilterImportCtrl.prototype.onLayerChange_ = function(descriptor) {
  this.columns = [];

  try {
    if (os.implements(descriptor, os.ui.ogc.IOGCDescriptor.ID)) {
      if (descriptor.isFeatureTypeReady()) {
        var featureType = descriptor.getFeatureType();
        if (featureType) {
          this.columns = featureType.getColumns();
        }
      } else {
        descriptor.setDescribeCallback(this.handleFeatureType_.bind(this, descriptor));
      }
    } else if (os.implements(descriptor, os.filter.IFilterable.ID)) {
      this.columns = descriptor.getFilterColumns();
    }
  } catch (e) {
    // not an OGC layer
  } finally {
    // ensure columns are tested to update the UI state
    this.testColumns_();
  }
};


/**
 * Handles feature type loading success.
 * @param {os.ui.ogc.IOGCDescriptor} descriptor The layer descriptor.
 * @private
 */
os.ui.filter.im.FilterImportCtrl.prototype.handleFeatureType_ = function(descriptor) {
  var featureType = descriptor.getFeatureType();
  if (featureType) {
    this.columns = featureType.getColumns() || [];
    this.testColumns_();
  }
};


/**
 * Tests the set of columns against each filter to determine if they match.
 * @private
 */
os.ui.filter.im.FilterImportCtrl.prototype.testColumns_ = function() {
  this['hasMatchedFilters'] = false;
  this['hasUnmatchedFilters'] = false;

  for (var i = 0, ii = this['notFound'].length; i < ii; i++) {
    var filterModel = this['notFound'][i];
    if (this.columns) {
      var filterEntry = filterModel['filter'];
      filterModel['matches'] = filterEntry.matches(this.columns);
    } else {
      filterModel['matches'] = false;
    }

    if (!filterModel['matches']) {
      this['hasUnmatchedFilters'] = true;
    } else {
      this['hasMatchedFilters'] = true;
    }
  }

  os.ui.apply(this.scope);
};


/**
 * Gets the list of filterable layer descriptors.
 * @return {!Array<!os.data.IDataDescriptor>}
 * @export
 */
os.ui.filter.im.FilterImportCtrl.prototype.getLayersFunction = function() {
  return this.filterableDescriptors_;
};


/**
 * Remove a layer from the import list.
 * @param {string} layerId The layer id.
 * @export
 */
os.ui.filter.im.FilterImportCtrl.prototype.removeLayer = function(layerId) {
  if (layerId && this['found'][layerId]) {
    var layerModel = this['found'][layerId];
    if (layerModel && layerModel['filterModels']) {
      this['foundCount'] -= layerModel['filterModels'].length;
    }

    delete this['found'][layerId];
  }
};


/**
 * Adds the set of not-matched filters that match the presently selected layer to the list of matched filters.
 * @export
 */
os.ui.filter.im.FilterImportCtrl.prototype.addNotFound = function() {
  var layer = /** @type {os.data.IDataDescriptor} */ (this['layer']);
  if (os.implements(layer, os.filter.IFilterable.ID)) {
    var f = /** @type {!os.filter.IFilterable} */ (layer);

    var i = this['notFound'].length;
    var foundCount = 0;

    while (i--) {
      var filterModel = this['notFound'][i];

      if (filterModel['matches']) {
        // take it out of the notFound array and put it in the found object
        this['notFound'].splice(i, 1);

        // since a single layer can have multiple filterable types, add it for all
        var types = f.getFilterableTypes();

        for (var j = 0, jj = types.length; j < jj; j++) {
          var type = types[j];
          // make sure to set the type or none of this works
          filterModel['filter'].setType(type);
          foundCount++;

          if (this['found'][type]) {
            this['found'][type]['filterModels'].push(filterModel);
          } else {
            var icons = this.getIconsFromFilterable(f);
            var layerTitle = this.getTitleFromFilterable(f, type);
            var layerModel = this.getLayerModel(layerTitle, icons, filterModel['filter'].getMatch(), filterModel);
            this['found'][type] = layerModel;
          }
        }
      }
    }

    this['foundCount'] += foundCount;
  }

  this['hasMatchedFilters'] = this['notFound'].some(function(obj) {
    return !!obj['matches'];
  });
};


/**
 * Add the filters to the detected/chosen layers and close the window.
 * @export
 */
os.ui.filter.im.FilterImportCtrl.prototype.finish = function() {
  var count = 0;
  var entries = [];

  // add any enqueued matching filters that the user may have forgotten
  this.addNotFound();

  for (var key in this['found']) {
    var layerModel = this['found'][key];
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
 * @export
 */
os.ui.filter.im.FilterImportCtrl.prototype.cancel = function() {
  os.ui.window.close(this.element);
};


/**
 * Get the filter icon class.
 * @return {string}
 * @export
 */
os.ui.filter.im.FilterImportCtrl.prototype.getFilterIcon = function() {
  return 'fa-filter';
};


/**
 * Get the text to display for the imported filter count.
 * @param {number=} opt_count The count, for determining the plurality.
 * @return {string}
 * @export
 */
os.ui.filter.im.FilterImportCtrl.prototype.getFilterTitle = function(opt_count) {
  var plural = opt_count == 1 ? '' : 's';
  return this.filterTitle + plural;
};


/**
 * Get the parent provider of a filterable, if available.
 * @param {!os.filter.IFilterable} filterable The filterable object.
 * @return {?string} The provider name, or null if not available.
 */
os.ui.filter.im.FilterImportCtrl.prototype.getProviderFromFilterable = function(filterable) {
  var provider = null;

  if (os.implements(filterable, os.data.IDataDescriptor.ID)) {
    provider = /** @type {!os.data.IDataDescriptor} */ (filterable).getProvider();
  }

  return provider;
};


/**
 * Gets as descriptive a title as possible from a filterable item.
 * @param {!os.filter.IFilterable} filterable
 * @param {string} type
 * @return {?string}
 */
os.ui.filter.im.FilterImportCtrl.prototype.getTitleFromFilterable = function(filterable, type) {
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
 * Gets icons from a filterable item.
 * @param {!os.filter.IFilterable} filterable
 * @return {string}
 */
os.ui.filter.im.FilterImportCtrl.prototype.getIconsFromFilterable = function(filterable) {
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

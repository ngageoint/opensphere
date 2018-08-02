goog.provide('os.ui.filter.ui.FiltersCtrl');
goog.provide('os.ui.filter.ui.filtersDirective');
goog.require('goog.string');
goog.require('os.alert.AlertEventSeverity');
goog.require('os.alert.AlertManager');
goog.require('os.command.SequenceCommand');
goog.require('os.filter.FilterEntry');
goog.require('os.metrics.Metrics');
goog.require('os.ui.Module');
goog.require('os.ui.filter.FilterManager');
goog.require('os.ui.filter.ui.FilterTypeGroupBy');
goog.require('os.ui.filter.ui.editFiltersDirective');
goog.require('os.ui.filter.ui.filterTreeDirective');
goog.require('os.ui.im.DuplicateImportProcess');
goog.require('os.ui.im.ImportEvent');
goog.require('os.ui.window');


/**
 * The filters directive
 * @return {angular.Directive}
 */
os.ui.filter.ui.filtersDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    scope: {
      'type': '=',
      'columns': '='
    },
    templateUrl: os.ROOT + 'views/filter/filters.html',
    controller: os.ui.filter.ui.FiltersCtrl,
    controllerAs: 'filters'
  };
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.directive('filters', [os.ui.filter.ui.filtersDirective]);



/**
 * Controller for the filter tree
 * @param {!angular.Scope} $scope
 * @constructor
 * @ngInject
 */
os.ui.filter.ui.FiltersCtrl = function($scope) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * @type {string|undefined}
   * @private
   */
  this.type_ = $scope['type'];

  var fm = os.ui.filter.FilterManager.getInstance();
  fm.listen(os.ui.filter.FilterEventType.GROUPING_CHANGED, this.onGroupChanged_, false, this);
  fm.listen(os.ui.filter.FilterEventType.FILTERS_REFRESH, this.setDirty_, false, this);
  os.dispatcher.listen(os.ui.filter.FilterEventType.FILTERS_IMPORTED, this.onFilterImport_, false, this);
  this['group'] = this.type_ ? fm.getGrouping(this.type_) : true;
  this['groups'] = os.ui.filter.ui.FiltersCtrl.GROUPS;

  $scope.$watch('type', this.onTypeChange_.bind(this));
  $scope.$on('$destroy', this.onDestroy_.bind(this));
  $scope.$on('filterEdit', this.onFilterEdit_.bind(this));
  $scope.$on('filterComplete', this.onFilterComplete_.bind(this));
};


/**
 * The group options
 * @type {!Object.<string, boolean>}
 * @const
 */
os.ui.filter.ui.FiltersCtrl.GROUPS = {
  'Any': false,
  'All': true
};


/**
 * Clean up
 * @private
 */
os.ui.filter.ui.FiltersCtrl.prototype.onDestroy_ = function() {
  var fm = os.ui.filter.FilterManager.getInstance();
  fm.unlisten(os.ui.filter.FilterEventType.GROUPING_CHANGED, this.onGroupChanged_, false, this);
  fm.unlisten(os.ui.filter.FilterEventType.FILTERS_REFRESH, this.setDirty_, false, this);
  os.dispatcher.unlisten(os.ui.filter.FilterEventType.FILTERS_IMPORTED, this.onFilterImport_, false, this);
  this.scope_ = null;
};


/**
 * Handles edit filter events
 * @param {angular.Scope.Event} event
 * @param {os.filter.FilterEntry} entry
 * @private
 */
os.ui.filter.ui.FiltersCtrl.prototype.onFilterEdit_ = function(event, entry) {
  this.edit(entry);
};


/**
 * Handles 'filterComplete' scope event
 * @param {angular.Scope.Event} event
 * @param {os.filter.FilterEntry} entry
 * @private
 */
os.ui.filter.ui.FiltersCtrl.prototype.onFilterComplete_ = function(event, entry) {
  event.stopPropagation();

  this.onEditComplete_(entry);
};


/**
 * Handles when the layer type changes.
 * @param {?string} newVal
 * @param {?string} oldVal
 * @private
 */
os.ui.filter.ui.FiltersCtrl.prototype.onTypeChange_ = function(newVal, oldVal) {
  if (newVal && newVal != oldVal) {
    var fm = os.ui.filter.FilterManager.getInstance();
    this.type_ = newVal;
    this['group'] = fm.getGrouping(this.type_);
    os.ui.apply(this.scope_);
  }
};


/**
 * Adds or edits a filter
 * @param {os.filter.FilterEntry=} opt_entry
 */
os.ui.filter.ui.FiltersCtrl.prototype.edit = function(opt_entry) {
  var options = {
    id: 'editfilter',
    x: 'center',
    y: 'center',
    label: (opt_entry ? 'Edit' : 'Add') + ' Filter',
    'show-close': true,
    'no-scroll': true,
    'min-width': 375,
    'min-height': 300,
    'max-width': 1000,
    'max-height': 1000,
    modal: true,
    width: 650,
    height: 400,
    icon: 'filter-icon fa fa-filter'
  };

  opt_entry = opt_entry ? opt_entry.clone() : new os.filter.FilterEntry();

  if (this.type_) {
    opt_entry.type = this.type_;
  }

  var scopeOptions = {
    'entry': opt_entry,
    'columns': this.scope_['columns'],
    'callback': this.onEditComplete_.bind(this)
  };

  if (scopeOptions['columns']) {
    scopeOptions['columns'].sort(os.ui.filter.ui.FiltersCtrl.sortColumns);
  }

  if (this.scope_) {
    os.ui.window.create(options, 'editfilter', undefined, undefined, undefined, scopeOptions);
  }
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Filters.EDIT, 1);
};
goog.exportProperty(os.ui.filter.ui.FiltersCtrl.prototype, 'edit', os.ui.filter.ui.FiltersCtrl.prototype.edit);


/**
 * @param {os.ogc.FeatureTypeColumn} a
 * @param {os.ogc.FeatureTypeColumn} b
 * @return {number} -1, 0, or 1 per typical compare functions
 */
os.ui.filter.ui.FiltersCtrl.sortColumns = function(a, b) {
  return goog.string.caseInsensitiveCompare(a.name, b.name);
};


/**
 * Handles adds/edits to filters
 * @param {os.filter.FilterEntry} entry
 * @private
 */
os.ui.filter.ui.FiltersCtrl.prototype.onEditComplete_ = function(entry) {
  if (entry) {
    var fm = os.ui.filter.FilterManager.getInstance();
    var original = fm.getFilter(entry.getId());

    if (original) {
      // edit
      fm.removeFilter(original);
      fm.addFilter(entry);
    } else {
      entry.setEnabled(true);
      fm.addFilter(entry);
    }
  }
};


/**
 * Handles group changes outside of this UI
 * @param {os.ui.filter.FilterEvent} event
 * @private
 */
os.ui.filter.ui.FiltersCtrl.prototype.onGroupChanged_ = function(event) {
  if (event.key == this.type_) {
    var fm = os.ui.filter.FilterManager.getInstance();

    if (event.key) {
      this['group'] = fm.getGrouping(event.key);
      this.setDirty_();
    }
  }
};


/**
 * Handles group changes outside of this UI
 * @param {os.ui.filter.FilterEvent=} opt_event
 * @private
 */
os.ui.filter.ui.FiltersCtrl.prototype.setDirty_ = function(opt_event) {
  this.scope_['filterForm'].$setDirty();
};


/**
 * Handles group changes outside of this UI
 * @param {os.ui.filter.FilterImportEvent} event
 * @private
 */
os.ui.filter.ui.FiltersCtrl.prototype.onFilterImport_ = function(event) {
  if (event.filters && this.type_) {
    var addedCount = 0;
    var geomCount = 0;
    var filters = event.filters;
    var columnNames = goog.array.map(this.scope_['columns'], os.ui.filter.ui.FiltersCtrl.getColumnName_);
    for (var i = 0; i < filters.length; i++) {
      var filter = filters[i];
      var filterString = filter.getFilter();
      if (filterString) {
        var doc = goog.dom.xml.loadXml(filterString);
        var names = doc.querySelectorAll('PropertyName');
        var matches = false;

        if (names && names.length > 0) {
          for (var j = 0; j < names.length; j++) {
            var name = names[j].textContent;

            if (name == 'GEOM') {
              geomCount++;
              continue;
            }

            matches = goog.array.some(columnNames, function(columnName) {
              return columnName === name;
            });
          }
        }

        if (matches) {
          filter.type = this.type_;
          os.ui.filter.FilterManager.getInstance().addFilter(filter);
          addedCount++;
        }
      }
    }

    var msg = '';
    if (addedCount > 0) {
      msg = 'Successfully imported <b>' + addedCount + '/' + filters.length + '</b> filters from the file.';
      if (addedCount != filters.length) {
        var diff = filters.length - addedCount - geomCount;
        var plural = diff == 1 ? 'filter was' : 'filters were';
        msg += '<br><b>' + diff + '</b> attribute ' + plural + ' excluded based on the current layer.';
      }
      if (geomCount > 0) {
        var plural = geomCount == 1 ? 'filter was' : 'filters were';
        msg += '<br><b>' + geomCount + '</b> area ' + plural + ' excluded.';
      }
      os.alertManager.sendAlert(msg, os.alert.AlertEventSeverity.SUCCESS);
    } else {
      msg = 'No filters were added. None of the filters in the imported file matched the currently selected layer.';
      os.alertManager.sendAlert(msg, os.alert.AlertEventSeverity.INFO);
    }
  }
};


/**
 * Updates the group
 */
os.ui.filter.ui.FiltersCtrl.prototype.onGroup = function() {
  if (this.type_) {
    var fm = os.ui.filter.FilterManager.getInstance();
    fm.setGrouping(this.type_, /** @type {boolean} */ (this['group']));
    os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Filters.GROUP_BY, 1);
  }
};
goog.exportProperty(
    os.ui.filter.ui.FiltersCtrl.prototype,
    'onGroup',
    os.ui.filter.ui.FiltersCtrl.prototype.onGroup);


/**
 * Imports a filter.
 */
os.ui.filter.ui.FiltersCtrl.prototype.import = function() {
  var importProcess = new os.ui.im.DuplicateImportProcess();
  importProcess.setEvent(new os.ui.im.ImportEvent(os.ui.im.ImportEventType.FILE));
  importProcess.begin();
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Filters.IMPORT, 1);
};
goog.exportProperty(os.ui.filter.ui.FiltersCtrl.prototype, 'import', os.ui.filter.ui.FiltersCtrl.prototype.import);


/**
 * @param {os.ogc.FeatureTypeColumn} item
 * @return {string}
 * @private
 */
os.ui.filter.ui.FiltersCtrl.getColumnName_ = function(item) {
  return item.name;
};

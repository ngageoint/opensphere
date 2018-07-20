goog.provide('os.ui.filter.ui.FilterExportChoice');
goog.provide('os.ui.filter.ui.FilterExportCtrl');
goog.provide('os.ui.filter.ui.filterExportDirective');
goog.require('os.ui.Module');
goog.require('os.ui.checklistDirective');
goog.require('os.ui.util.validationMessageDirective');


/**
 * @enum {string}
 */
os.ui.filter.ui.FilterExportChoice = {
  ACTIVE: 'active',
  SELECTED: 'selected',
  ALL: 'all'
};


/**
 * The filterexport directive
 * @return {angular.Directive}
 */
os.ui.filter.ui.filterExportDirective = function() {
  return {
    restrict: 'E',
    scope: {
      'confirm': '=',
      'mode': '='
    },
    templateUrl: os.ROOT + 'views/filter/filterexport.html',
    controller: os.ui.filter.ui.FilterExportCtrl,
    controllerAs: 'filterexport'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('filterexport', [os.ui.filter.ui.filterExportDirective]);



/**
 * Controller function for the filterexport directive
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$timeout} $timeout The Angular $timeout service.
 * @constructor
 * @ngInject
 */
os.ui.filter.ui.FilterExportCtrl = function($scope, $element, $timeout) {
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
   * @type {number}
   */
  this['mode'] = $scope['mode'] ? $scope['mode'] : os.ui.filter.ui.FilterExportChoice.ACTIVE;

  /**
   * @type {string}
   */
  this['fileName'] = 'filters.xml';

  /**
   * @type {Function}
   */
  this['confirm'] = $scope['confirm'];

  // trigger window auto height after the DOM is rendered
  $timeout(function() {
    $scope.$emit(os.ui.WindowEventType.READY);
  });
};


/**
 * Launch a dialog prompting the user the file they're importing already exists and requesting action.
 * @param {function(string, os.ui.filter.ui.FilterExportChoice)} confirm
 * @param {number=} opt_mode
 */
os.ui.filter.ui.launchFilterExport = function(confirm, opt_mode) {
  var scopeOptions = {
    'confirm': confirm,
    'mode': opt_mode
  };

  var windowOptions = {
    'id': 'filterexport',
    'label': 'Export Filters',
    'icon': 'fa fa-download',
    'x': 'center',
    'y': 'center',
    'width': '260',
    'height': 'auto',
    'modal': 'true',
    'show-close': 'true'
  };

  var template = '<filterexport mode="mode" confirm="confirm"></filterexport>';
  os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
};


/**
 * Fire the cancel callback and close the window.
 * @export
 */
os.ui.filter.ui.FilterExportCtrl.prototype.cancel = function() {
  this.close_();
};


/**
 * Fire the confirmation callback and close the window.
 * @export
 */
os.ui.filter.ui.FilterExportCtrl.prototype.save = function() {
  // call our confirm function with the file name and mode
  this['confirm'](this['fileName'], this['mode']);
  this.close_();
};


/**
 * Close the window.
 * @private
 */
os.ui.filter.ui.FilterExportCtrl.prototype.close_ = function() {
  os.ui.window.close(this.element);
};


/**
 * Export the passed in filters
 * @param {string} name of the file
 * @param {Array} filters
 */
os.ui.filter.ui.export = function(name, filters) {
  if (filters.length > 0) {
    var root = os.xml.createElementNS('filters', 'http://www.bit-sys.com/state/v2');

    var exportSuccess = false;
    goog.array.forEach(filters, function(filter) {
      var queryEntry = filter.getEntry();
      var filterEntry = queryEntry instanceof os.filter.FilterEntry ?
          queryEntry : os.ui.filterManager.getFilter(queryEntry['filterId']);
      var parsedFilter = filterEntry.getFilterNode();
      if (parsedFilter) {
        // Get the filter key from the filterable. This should almost always work, but in the event that it doesn't
        // we send an error message.
        var filterable = os.ui.filter.getFilterableByType(filterEntry['type']);
        if (filterable) {
          var filterAttr = {
            'active': filter.getState() == 'on' ? 'true' : 'false',
            'filterType': 'single',
            'title': filterEntry.getTitle(),
            'description': filterEntry.getDescription() || '',
            'type': filterable.getFilterKey(),
            'match': queryEntry['filterGroup'] == true || !goog.isDef(queryEntry['filterGroup']) ? 'AND' : 'OR'
          };
          var filterRootXml = os.xml.appendElement('filter', root, null, filterAttr);
          os.xml.clone(parsedFilter, filterRootXml, 'ogc', 'http://www.opengis.net/ogc');
          exportSuccess = true;
        }
      }
    });

    if (exportSuccess) {
      os.file.persist.saveFile(name, os.xml.serialize(root), 'text/xml; subtype=FILTER');
    } else {
      var errorMsg = 'Something went wrong! We were unabled to export your filters.';
      os.alertManager.sendAlert(errorMsg, os.alert.AlertEventSeverity.ERROR);
    }
  } else {
    os.alertManager.sendAlert('No filters to export', os.alert.AlertEventSeverity.WARNING);
  }
};

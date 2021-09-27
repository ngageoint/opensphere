goog.declareModuleId('os.ui.filter.ui.FilterExportUI');

import '../../util/validationmessage.js';
import {ROOT} from '../../../os.js';
import Module from '../../module.js';
import {close, create} from '../../window.js';
import WindowEventType from '../../windoweventtype.js';
import {getFilterableByType} from '../filter.js';
import FilterExportChoice from './filterexportchoice.js';
const AlertEventSeverity = goog.require('os.alert.AlertEventSeverity');
const AlertManager = goog.require('os.alert.AlertManager');
const {saveFile} = goog.require('os.file.persist');
const FilterEntry = goog.require('os.filter.FilterEntry');
const {getFilterManager} = goog.require('os.query.instance');
const {appendElement, clone, createElementNS, serialize} = goog.require('os.xml');


/**
 * The filterexport directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: {
    'confirm': '=',
    'mode': '='
  },
  templateUrl: ROOT + 'views/filter/filterexport.html',
  controller: Controller,
  controllerAs: 'filterexport'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'filterexport';

/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller function for the filterexport directive
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$timeout} $timeout The Angular $timeout service.
   * @ngInject
   */
  constructor($scope, $element, $timeout) {
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
    this['mode'] = $scope['mode'] ? $scope['mode'] : FilterExportChoice.ACTIVE;

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
      $scope.$emit(WindowEventType.READY);
    });
  }

  /**
   * Fire the cancel callback and close the window.
   *
   * @export
   */
  cancel() {
    this.close_();
  }

  /**
   * Fire the confirmation callback and close the window.
   *
   * @export
   */
  save() {
    // call our confirm function with the file name and mode
    this['confirm'](this['fileName'], this['mode']);
    this.close_();
  }

  /**
   * Close the window.
   *
   * @private
   */
  close_() {
    close(this.element);
  }
}

/**
 * Launch a dialog prompting the user the file they're importing already exists and requesting action.
 *
 * @param {function(string, FilterExportChoice)} confirm
 * @param {number=} opt_mode
 */
export const launchFilterExport = function(confirm, opt_mode) {
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
    'width': '400',
    'height': 'auto',
    'modal': 'true',
    'show-close': 'true'
  };

  var template = '<filterexport mode="mode" confirm="confirm"></filterexport>';
  create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
};

/**
 * Export the passed in filters
 *
 * @param {string} name of the file
 * @param {Array} filters
 */
export const exportFilters = function(name, filters) {
  if (filters.length > 0) {
    var root = createElementNS('filters', 'http://www.bit-sys.com/state/v2');

    var exportSuccess = false;
    filters.forEach(function(filter) {
      var queryEntry = filter.getEntry();
      var filterEntry = queryEntry instanceof FilterEntry ?
        queryEntry : getFilterManager().getFilter(queryEntry['filterId']);
      var parsedFilter = filterEntry.getFilterNode();
      if (parsedFilter) {
        // Get the filter key from the filterable. This should almost always work, but in the event that it doesn't
        // we send an error message.
        var filterable = getFilterableByType(filterEntry['type']);
        if (filterable) {
          var filterAttr = {
            'active': filter.getState() == 'on' ? 'true' : 'false',
            'filterType': 'single',
            'title': filterEntry.getTitle(),
            'description': filterEntry.getDescription() || '',
            'type': filterable.getFilterKey(),
            'match': queryEntry['filterGroup'] == true || queryEntry['filterGroup'] === undefined ? 'AND' : 'OR'
          };
          var filterRootXml = appendElement('filter', root, null, filterAttr);
          clone(parsedFilter, filterRootXml, 'ogc', 'http://www.opengis.net/ogc');
          exportSuccess = true;
        }
      }
    });

    if (exportSuccess) {
      saveFile(name, serialize(root), 'text/xml; subtype=FILTER');
    } else {
      var errorMsg = 'Something went wrong! We were unable to export your filters.';
      AlertManager.getInstance().sendAlert(errorMsg, AlertEventSeverity.ERROR);
    }
  } else {
    AlertManager.getInstance().sendAlert('No filters to export', AlertEventSeverity.WARNING);
  }
};

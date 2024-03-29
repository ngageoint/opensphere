goog.declareModuleId('os.ui.PagingBarUI');

import {ROOT} from '../os.js';
import Module from './module.js';


/**
 * The pagingbar directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: {
    'totalElements': '=',
    'pageSize': '=',
    'activePage': '=',
    'pageClickFunction': '=',
    'pageButtons': '=',
    'disabled': '=',
    'sequentialPaging': '=?'
  },
  templateUrl: ROOT + 'views/pagingbar.html',
  controller: Controller,
  controllerAs: 'pageCtrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'pagingbar';

/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller function for the pagingbar directive
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    /**
     * @type {?angular.Scope}
     * @private
     */
    this.scope_ = $scope;

    $scope.$watch('activePage', this.updatePaging_.bind(this));
    $scope.$watch('totalElements', this.updatePaging_.bind(this));
    $scope.$watch('pageButtons', this.updatePaging_.bind(this));
    $scope.$watch('sequentialPaging', this.updatePaging_.bind(this));
    $scope.$watch('pageSize', this.updatePaging_.bind(this));
    $scope.$on('$destroy', this.destroy_.bind(this));
  }

  /**
   * Clean up.
   *
   * @private
   */
  destroy_() {
    this.scope_ = null;
  }

  /**
   * Updates the paging state.
   *
   * @private
   */
  updatePaging_() {
    var start = 0;
    var pageButtons = Number(this.scope_['pageButtons']);
    var activePage = this.scope_['activePage'] ? Number(this.scope_['activePage']) : 1;
    var totalElements = this.scope_['totalElements'] ? Number(this.scope_['totalElements']) : 1;
    var pageSize = this.scope_['pageSize'] ? Number(this.scope_['pageSize']) : 5;
    var pages = Math.ceil(totalElements / pageSize);
    var total = pages;
    var pageObjects = [];
    var doUpdate = activePage > pages;

    if (pages > 1) {
      if (pages > pageButtons) {
        // more pages than we are displaying buttons, have to truncate and add ellipses
        total = pageButtons;
        if ((activePage - (total / 2)) > start) {
          start = Number((activePage - (total / 2)).toFixed()) - 1;
          start = start + total > pages ? pages - total : start;
        }
      }

      if (start != 0) {
        // we are in the middle, always show the 1 page
        var initialPage = {
          'text': 1,
          'target': 1,
          'active': activePage == 1,
          'disabled': false
        };
        pageObjects.push(initialPage);

        if (start != 1) {
          // when in the middle, show an ellipsis to represent non-shown pages
          var firstEllipsis = {
            'text': '...',
            'active': false,
            'disabled': true
          };
          pageObjects.push(firstEllipsis);
        }
      }

      for (var i = start; i < start + total; i++) {
        var page = {
          'text': i + 1,
          'target': i + 1,
          'active': activePage == i + 1,
          'disabled': false
        };
        pageObjects.push(page);
      }

      if (start + total + 1 < pages || (start + total < pages && this.scope_['sequentialPaging'])) {
        // add a second ellipsis at the end
        var secondEllipsis = {
          'text': '...',
          'active': false,
          'disabled': true
        };
        pageObjects.push(secondEllipsis);
      }

      if (start + total < pages && !this.scope_['sequentialPaging']) {
        // always show the final page
        var finalPage = {
          'text': pages,
          'target': pages,
          'active': activePage == pages,
          'disabled': false
        };
        pageObjects.push(finalPage);
      }
    }

    this['pages'] = pageObjects;

    if (doUpdate) {
      // we were on a page that no longer exists, so put us on the last page
      this.onPageClick(pageObjects[pageObjects.length - 1]);
    }
  }

  /**
   * Page click handler. Checks to see if the clicked page is enabled and if it's not the same page as is currently
   * active.
   *
   * @param {Object} page
   * @export
   */
  onPageClick(page) {
    if (!this.scope_['disabled'] && page && !page['disabled'] &&
        this.scope_['pageClickFunction'] && this.scope_['activePage'] != page['target']) {
      var pageNumber = Number(page['target']);
      this.scope_['activePage'] = pageNumber;
      this.scope_['pageClickFunction'](pageNumber);
    }
  }
}

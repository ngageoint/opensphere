goog.declareModuleId('os.ui.im.MergeAreaOptionUI');

import Module from '../module.js';


/**
 * Directive for requesting title, description, and tags for an import configuration.
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: {
    'ngModel': '=',
    'help': '=?'
  },
  template: '<div class="row mt-1"><label class="col-form-label col-4 text-right">Merge Areas</label>' +
    '<div class="col form-inline">' +
    '<input class="form-control col-auto" type="checkbox" name="merge" ng-model="ngModel"/>' +
    '<span class="ml-auto"><popover ng-if="help" x-title="\'Merge Areas\'" x-content="help" x-pos="\'right\'"> ' +
    '</popover></span></div></div>',

  controller: Controller,
  controllerAs: 'ctrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'mergeareaoption';

/**
 * Add the directive to the os.ui module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for showing the merge area checkbox that sometimes compliments basicinfo
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @ngInject
   */
  constructor($scope) {
    /**
     * @type {?angular.Scope}
     * @protected
     */
    this.scope = $scope;
  }
}

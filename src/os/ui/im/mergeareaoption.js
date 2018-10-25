goog.provide('os.ui.im.MergeAreaOptionCtrl');
goog.provide('os.ui.im.mergeAreaOptionDirective');

goog.require('os.ui.Module');
goog.require('os.ui.slick.column');
goog.require('os.ui.util.validationMessageDirective');


/**
 * Directive for requesting title, description, and tags for an import configuration.
 * @return {angular.Directive}
 */
os.ui.im.mergeAreaOptionDirective = function() {
  return {
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
    controller: os.ui.im.MergeAreaOptionCtrl,
    controllerAs: 'ctrl'
  };
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.directive('mergeareaoption', [os.ui.im.mergeAreaOptionDirective]);



/**
 * Controller for showing the merge area checkbox that sometimes compliments basicinfo
 *
 * @param {!angular.Scope} $scope
 * @constructor
 * @ngInject
 */
os.ui.im.MergeAreaOptionCtrl = function($scope) {
  /**
   * @type {?angular.Scope}
   * @protected
   */
  this.scope = $scope;
};

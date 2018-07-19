goog.provide('os.ui.filter.ui.ExpressionNodeViewUI');
goog.provide('os.ui.filter.ui.expressionNodeViewUIDirective');
goog.require('os.ui.Module');


/**
 * The view node UI for expression nodes.
 * @return {angular.Directive}
 */
os.ui.filter.ui.expressionNodeViewUIDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    template: '<span class="c-glyph float-right"></span>',
    controller: os.ui.filter.ui.ExpressionNodeViewUI,
    controllerAs: 'nodeUi'
  };
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.directive('expressionnodeviewui', [os.ui.filter.ui.expressionNodeViewUIDirective]);



/**
 * Controller for selected/highlighted node UI
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
os.ui.filter.ui.ExpressionNodeViewUI = function($scope, $element) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;
};

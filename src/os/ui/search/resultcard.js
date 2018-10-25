goog.provide('os.ui.search.ResultCardCtrl');
goog.provide('os.ui.search.resultCardDirective');

goog.require('os.ui.Module');


/**
 * The resultcard directive for displaying search results.
 * @return {angular.Directive}
 */
os.ui.search.resultCardDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: true,
    template: '<div></div>',
    controller: os.ui.search.ResultCardCtrl,
    controllerAs: 'resultCard'
  };
};


/**
 * Register the resultcard directive.
 */
os.ui.Module.directive('resultcard', [os.ui.search.resultCardDirective]);



/**
 * Controller for the resultcard directive.
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$compile} $compile
 * @constructor
 * @ngInject
 */
os.ui.search.ResultCardCtrl = function($scope, $element, $compile) {
  if ('result' in $scope) {
    // grab the card UI off the result, compile it, and add it to the DOM
    var result = /** @type {os.search.ISearchResult} */ ($scope['result']);
    var ui = result.getSearchUI();
    if (goog.string.startsWith(ui, '<')) {
      $element.append($compile(ui)($scope));
    } else {
      $element.append(ui);
    }
  }

  $scope.$on('$destroy', this.destroy_.bind(this));
};


/**
 * Clean up the controller.
 * @private
 */
os.ui.search.ResultCardCtrl.prototype.destroy_ = function() {
  // nothing to do yet
};

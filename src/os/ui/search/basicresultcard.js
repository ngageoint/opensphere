goog.provide('os.ui.search.BasicResultCardCtrl');
goog.provide('os.ui.search.basicResultCardDirective');

goog.require('os.ui.Module');
goog.require('os.ui.text.SimpleMDE');


/**
 * The resultcard directive for displaying search results.
 * @return {angular.Directive}
 */
os.ui.search.basicResultCardDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: true,
    template: '<div class="text-truncate"><a ng-href="{{ctrl.url}}">{{ctrl.title}}</a></div>',
    controller: os.ui.search.BasicResultCardCtrl,
    controllerAs: 'ctrl'
  };
};


/**
 * Register the resultcard directive.
 */
os.ui.Module.directive('basicresultcard', [os.ui.search.basicResultCardDirective]);



/**
 * Controller for the resultcard directive.
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$compile} $compile
 * @constructor
 * @ngInject
 */
os.ui.search.BasicResultCardCtrl = function($scope, $element, $compile) {
  if ('result' in $scope) {
    var result = $scope['result'].getResult();
    this['url'] = result.getUrl();
    this['title'] = os.ui.text.SimpleMDE.getUnformatedText(result.getTitle());
  }
};

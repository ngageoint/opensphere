goog.provide('os.ui.clear.ClearButtonCtrl');
goog.provide('os.ui.clear.clearButtonDirective');

goog.require('os.ui.MenuButtonCtrl');
goog.require('os.ui.Module');


/**
 * The clear directive
 * @return {angular.Directive}
 */
os.ui.clear.clearButtonDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    controller: os.ui.clear.ClearButtonCtrl,
    controllerAs: 'ctrl',
    template: '<button class="btn btn-danger" ng-click="ctrl.toggle()" ' +
        'title="Select items to clear/reset"><i class="fa fa-times"></i></button>'
  };
};


/**
 * add the directive to the module
 */
os.ui.Module.directive('clearButton', [os.ui.clear.clearButtonDirective]);


/**
 * Controller function for the nav-top directive
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element The element
 * @extends {os.ui.MenuButtonCtrl}
 * @constructor
 * @ngInject
 */
os.ui.clear.ClearButtonCtrl = function($scope, $element) {
  os.ui.clear.ClearButtonCtrl.base(this, 'constructor', $scope, $element);
  this.flag = 'clear';
};
goog.inherits(os.ui.clear.ClearButtonCtrl, os.ui.MenuButtonCtrl);

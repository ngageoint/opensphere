goog.provide('os.ui.SaveButtonCtrl');
goog.provide('os.ui.saveButtonDirective');

goog.require('os.ui.Module');
goog.require('os.ui.menu.MenuButtonCtrl');
goog.require('os.ui.menu.save');

/**
 * The save button directive
 * @return {angular.Directive}
 */
os.ui.saveButtonDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      'showLabel': '='
    },
    controller: os.ui.SaveButtonCtrl,
    controllerAs: 'ctrl',
    template: '<button class="btn btn-default btn-menu no-text" ng-click="ctrl.openMenu()"' +
      ' title="Save options" ng-right-click="ctrl.openMenu()" ng-class="{active: menu}">' +
      '<i class="fa fa-floppy-o green-icon"></i> {{showLabel ? \'Save\' : \'\'}}' +
      '&nbsp;<i class="fa fa-chevron-down menu-arrow"></i>' +
      '</button>'
  };
};


/**
 * add the directive to the module
 */
os.ui.Module.directive('saveButton', [os.ui.saveButtonDirective]);


/**
 * Controller function for the nav-top directive
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element The element
 * @extends {os.ui.menu.MenuButtonCtrl}
 * @constructor
 * @ngInject
 */
os.ui.SaveButtonCtrl = function($scope, $element) {
  os.ui.SaveButtonCtrl.base(this, 'constructor', $scope, $element);
  this.menu = os.ui.menu.SAVE;
};
goog.inherits(os.ui.SaveButtonCtrl, os.ui.menu.MenuButtonCtrl);

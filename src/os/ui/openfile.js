goog.provide('os.ui.OpenEventType');
goog.provide('os.ui.OpenFileCtrl');
goog.provide('os.ui.openFileDirective');

goog.require('os.ui.Module');


/**
 * @return {angular.Directive}
 */
os.ui.openFileDirective = function() {
  return {
    restrict: 'E',
    scope: true,
    transclude: true,
    template: '<span class="link" ng-click="ctrl.open()" ng-transclude></span>',
    controller: os.ui.OpenFileCtrl,
    controllerAs: 'ctrl'
  };
};


// Add the directive to the module
os.ui.Module.directive('openfile', [os.ui.openFileDirective]);



/**
 * @constructor
 * @ngInject
 */
os.ui.OpenFileCtrl = function() {
};


/**
 * @type {string}
 * @const
 */
os.ui.OpenEventType = 'importFile';


/**
 * imports a file
 */
os.ui.OpenFileCtrl.open = function() {
  os.dispatcher.dispatchEvent(os.ui.OpenEventType);
};
goog.exportProperty(os.ui.OpenFileCtrl.prototype, 'open', os.ui.OpenFileCtrl.open);

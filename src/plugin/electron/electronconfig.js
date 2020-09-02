goog.provide('plugin.electron.ElectronConfigCtrl');
goog.provide('plugin.electron.electronConfigDirective');

goog.require('os.ui.Module');

/**
 * The electron configuration directive.
 * @return {angular.Directive}
 */
plugin.electron.electronConfigDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: mist.ROOT + 'src/plugin/electron/electronconfig.html',
    controller: plugin.electron.ElectronConfigCtrl,
    controllerAs: 'ctrl'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('electronconfig', [plugin.electron.electronConfigDirective]);



/**
 * Controller function for the electron configuration.
 * @param {!angular.Scope} $scope The Angular scope
 * @param {!angular.JQLite} $element The root DOM element
 * @constructor
 * @ngInject
 */
plugin.electron.ElectronConfigCtrl = function($scope, $element) {
};


/**
 * @export
 */
plugin.electron.ElectronConfigCtrl.prototype.update = function() {

};

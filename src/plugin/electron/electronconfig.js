goog.provide('plugin.electron.ElectronConfigCtrl');
goog.provide('plugin.electron.electronConfigDirective');

goog.require('os.ui.Module');
// const electron = goog.require('electron');

/**
 * The electron configuration directive.
 * @return {angular.Directive}
 */
plugin.electron.electronConfigDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: os.ROOT + 'views/plugin/electron/electronmemoryconfig.html',
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
  this['maxMemory'] = ElectronOS.getMaxMemory();
};


/**
 * @export
 */
plugin.electron.ElectronConfigCtrl.prototype.update = function() {
  console.log('Updating max memory ' + this['maxMemory']);
  if (this['maxMemory']) {
    ElectronOS.setMaxMemory(this['maxMemory']);
  }
};

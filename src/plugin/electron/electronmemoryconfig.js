goog.provide('plugin.electron.ElectronMemoryConfigCtrl');
goog.provide('plugin.electron.electronMemoryConfigDirective');

goog.require('os.ui.Module');

/**
 * The electron configuration directive.
 * @return {angular.Directive}
 */
plugin.electron.electronMemoryConfigDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: os.ROOT + 'views/plugin/electron/electronmemoryconfig.html',
    controller: plugin.electron.ElectronMemoryConfigCtrl,
    controllerAs: 'ctrl'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('electronmemoryconfig', [plugin.electron.electronMemoryConfigDirective]);



/**
 * Controller function for the electron configuration.
 * @param {!angular.Scope} $scope The Angular scope
 * @param {!angular.JQLite} $element The root DOM element
 * @constructor
 * @ngInject
 */
plugin.electron.ElectronMemoryConfigCtrl = function($scope, $element) {
  this['maxMemory'] = ElectronOS.getMaxMemory();
  this['minMemory'] = 512;
  this['systemMemory'] = ElectronOS.getSystemMemory();
  this['restartButtonActive'] = false;
};


/**
 * @export
 */
plugin.electron.ElectronMemoryConfigCtrl.prototype.update = function() {
  if (this['maxMemory']) {
    const maxMem = this['maxMemory'];
    if (maxMem >= this['minMemory'] && maxMem <= this['systemMemory']) {
      this['restartButtonActive'] = true;
    } else {
      this['restartButtonActive'] = false;
    }
  }
};

/**
 * Restarts the application.
 * @export
 */
plugin.electron.ElectronMemoryConfigCtrl.prototype.restart = function() {
  ElectronOS.setMaxMemory(this['maxMemory']);
  ElectronOS.restart();
};

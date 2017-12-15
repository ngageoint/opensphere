goog.provide('os.ui.WindowLauncherCtrl');
goog.provide('os.ui.windowLauncherDirective');

goog.require('os.ui.Module');


/**
 * Template used by the directive.
 * @type {string}
 * @const
 */
os.ui.WINDOW_LAUNCHER_TEMPLATE = '<button ng-click="launchCtrl.click($event)" title="{{chkTooltip}}" ' +
    'class="btn btn-mini window-launch"><i ng-class="winLauncherClass"></i></button>';


/**
 * The slick tree directive
 * @return {angular.Directive}
 */
os.ui.windowLauncherDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    template: os.ui.WINDOW_LAUNCHER_TEMPLATE,
    controller: os.ui.WindowLauncherCtrl,
    controllerAs: 'launchCtrl'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('windowlauncher', [os.ui.windowLauncherDirective]);



/**
 * Controller for window launcher
 * @param {!angular.Scope} $scope
 * @constructor
 * @ngInject
 */
os.ui.WindowLauncherCtrl = function($scope) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  $scope.$on('$destroy', this.destroy_.bind(this));
};


/**
 * Clean up references
 * @private
 */
os.ui.WindowLauncherCtrl.prototype.destroy_ = function() {
  this.scope_ = null;
};


/**
 * Sets the descriptor as active.
 * @param {MouseEvent} e The event
 */
os.ui.WindowLauncherCtrl.prototype.click = function(e) {
  if (this.scope_) {
    var item = /** @type {os.ui.data.DescriptorNode} */ (this.scope_['item']);
    item.getDescriptor().setActive(true);
  }
};
goog.exportProperty(
    os.ui.WindowLauncherCtrl.prototype,
    'click',
    os.ui.WindowLauncherCtrl.prototype.click);

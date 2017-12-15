goog.provide('os.ui.filter.op.OPUISwitchCtrl');
goog.provide('os.ui.filter.op.opUISwitchDirective');
goog.require('os.ui.Module');
goog.require('os.ui.UISwitchCtrl');
goog.require('os.ui.uiSwitchDirective');


/**
 * A directive which takes a list of items and creates a common directive that controls them
 * @return {angular.Directive}
 */
os.ui.filter.op.opUISwitchDirective = function() {
  var dir = os.ui.uiSwitchDirective();

  dir['template'] = '<span></span>';
  dir['scope']['expr'] = '=';
  dir['controller'] = os.ui.filter.op.OPUISwitchCtrl;

  return dir;
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('opuiswitch', [os.ui.filter.op.opUISwitchDirective]);



/**
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$compile} $compile
 * @extends {os.ui.UISwitchCtrl}
 * @constructor
 * @ngInject
 */
os.ui.filter.op.OPUISwitchCtrl = function($scope, $element, $compile) {
  os.ui.filter.op.OPUISwitchCtrl.base(this, 'constructor', $scope, $element, $compile);
};
goog.inherits(os.ui.filter.op.OPUISwitchCtrl, os.ui.UISwitchCtrl);


/**
 * @inheritDoc
 */
os.ui.filter.op.OPUISwitchCtrl.prototype.addToScope = function(scope) {
  scope['expr'] = this.scope['expr'];
};

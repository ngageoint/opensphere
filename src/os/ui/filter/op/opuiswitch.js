goog.module('os.ui.filter.op.OPUISwitchUI');
goog.module.declareLegacyNamespace();

const Module = goog.require('os.ui.Module');
const UISwitchCtrl = goog.require('os.ui.UISwitchCtrl');
const uiSwitchDirective = goog.require('os.ui.uiSwitchDirective');


/**
 * A directive which takes a list of items and creates a common directive that controls them
 *
 * @return {angular.Directive}
 */
const directive = () => {
  var dir = uiSwitchDirective();

  dir['template'] = '<span></span>';
  dir['scope']['expr'] = '=';
  dir['controller'] = Controller;

  return dir;
};

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'opuiswitch';

/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);

/**
 * @unrestricted
 */
class Controller extends UISwitchCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$compile} $compile
   * @ngInject
   */
  constructor($scope, $element, $compile) {
    super($scope, $element, $compile);
  }

  /**
   * @inheritDoc
   */
  addToScope(scope) {
    scope['expr'] = this.scope['expr'];
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};

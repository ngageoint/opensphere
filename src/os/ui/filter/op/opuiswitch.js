goog.declareModuleId('os.ui.filter.op.OPUISwitchUI');

import Module from '../../module.js';
import {Controller as UISwitchCtrl, directive as uiSwitchDirective} from '../../uiswitch.js';


/**
 * A directive which takes a list of items and creates a common directive that controls them
 *
 * @return {angular.Directive}
 */
export const directive = () => {
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
export const directiveTag = 'opuiswitch';

/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);

/**
 * @unrestricted
 */
export class Controller extends UISwitchCtrl {
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

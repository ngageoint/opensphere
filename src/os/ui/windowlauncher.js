goog.declareModuleId('os.ui.WindowLauncherUI');

import Module from './module.js';

const {default: DescriptorNode} = goog.requireType('os.ui.data.DescriptorNode');


/**
 * Template used by the directive.
 * @type {string}
 * @const
 */
const template = '<small><button ng-click="launchCtrl.click($event)" title="{{chkTooltip}}" ' +
    'class="btn btn-sm btn-info border"><i ng-class="winLauncherClass"></i></button></small>';

/**
 * The slick tree directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'AE',
  replace: true,
  template: template,
  controller: Controller,
  controllerAs: 'launchCtrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'windowlauncher';

/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for window launcher
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @ngInject
   */
  constructor($scope) {
    /**
     * @type {?angular.Scope}
     * @private
     */
    this.scope_ = $scope;

    $scope.$on('$destroy', this.destroy_.bind(this));
  }

  /**
   * Clean up references
   *
   * @private
   */
  destroy_() {
    this.scope_ = null;
  }

  /**
   * Sets the descriptor as active.
   *
   * @param {MouseEvent} e The event
   * @export
   */
  click(e) {
    if (this.scope_) {
      var item = /** @type {DescriptorNode} */ (this.scope_['item']);
      item.getDescriptor().setActive(true);
    }
  }
}

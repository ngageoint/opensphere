goog.declareModuleId('os.ui.onboarding.ContextOnboardingUI');

import Module from '../module.js';
import OnboardingManager from './onboardingmanager.js';


/**
 * The context-onboarding directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: {
    'context': '@'
  },
  template: '<button title="Show help" class="btn btn-sm btn-outline-secondary border-0" ng-click="ctrl.show()">' +
      '<i class="fa fa-fw fa-question"></i></button>',
  controller: Controller,
  controllerAs: 'ctrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'context-onboarding';

/**
 * Register context-onboarding directive.
 */
Module.directive('contextOnboarding', [directive]);

/**
 * Controller function for the context-onboarding directive.
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
   * Clean up listeners/references.
   *
   * @private
   */
  destroy_() {
    this.scope_ = null;
  }

  /**
   * Called on clicking the button to display the onboarding for the element this directive is attached to.
   *
   * @export
   */
  show() {
    OnboardingManager.getInstance().showContextOnboarding(this.scope_['context']);
  }
}

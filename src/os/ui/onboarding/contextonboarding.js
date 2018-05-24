goog.provide('os.ui.onboarding.ContextOnboardingCtrl');
goog.provide('os.ui.onboarding.contextOnboardingDirective');

goog.require('os.ui.Module');
goog.require('os.ui.onboarding.OnboardingManager');


/**
 * The context-onboarding directive
 * @return {angular.Directive}
 */
os.ui.onboarding.contextOnboardingDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      'context': '@'
    },
    template: '<button title="Show help" class="btn btn-sm btn-outline-secondary border-0" ng-click="ctrl.show()">' +
        '<i class="fa fa-fw fa-question"></i></button>',
    controller: os.ui.onboarding.ContextOnboardingCtrl,
    controllerAs: 'ctrl'
  };
};


/**
 * Register context-onboarding directive.
 */
os.ui.Module.directive('contextOnboarding', [os.ui.onboarding.contextOnboardingDirective]);



/**
 * Controller function for the context-onboarding directive.
 * @param {!angular.Scope} $scope
 * @constructor
 * @ngInject
 */
os.ui.onboarding.ContextOnboardingCtrl = function($scope) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;
  $scope.$on('$destroy', this.destroy_.bind(this));
};


/**
 * Clean up listeners/references.
 * @private
 */
os.ui.onboarding.ContextOnboardingCtrl.prototype.destroy_ = function() {
  this.scope_ = null;
};


/**
 * Called on clicking the button to display the onboarding for the element this directive is attached to.
 */
os.ui.onboarding.ContextOnboardingCtrl.prototype.show = function() {
  os.ui.onboarding.OnboardingManager.getInstance().showContextOnboarding(this.scope_['context']);
};
goog.exportProperty(
    os.ui.onboarding.ContextOnboardingCtrl.prototype,
    'show',
    os.ui.onboarding.ContextOnboardingCtrl.prototype.show);

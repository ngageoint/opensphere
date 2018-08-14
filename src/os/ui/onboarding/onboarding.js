goog.provide('os.ui.onboarding.onboardingDirective');
goog.require('os.ui.Module');
goog.require('os.ui.onboarding.OnboardingCtrl');


/**
 * The onboarding directive
 * @return {angular.Directive}
 */
os.ui.onboarding.onboardingDirective = function() {
  return {
    restrict: 'E',
    scope: true,
    template: '<div id="onboarding-container"></div>',
    controller: os.ui.onboarding.OnboardingCtrl,
    controllerAs: 'onboardCtrl'
  };
};


/**
 * Register onboarding directive.
 */
os.ui.Module.directive('onboarding', [os.ui.onboarding.onboardingDirective]);

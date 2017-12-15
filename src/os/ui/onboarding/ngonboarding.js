goog.provide('os.ui.onboarding.ngOnboardingDirective');
goog.require('goog.object');
goog.require('os.ui.Module');
goog.require('os.ui.onboarding.NgOnboardingCtrl');


/**
 * The ng-onboarding directive, adapted from ngOnboarding by Adam Albrecht.
 * @see http://github.com/adamalbrecht/ngOnboarding/
 * @return {angular.Directive}
 */
os.ui.onboarding.ngOnboardingDirective = function() {
  return {
    restrict: 'E',
    scope: {
      'enabled': '=',
      'config': '=',
      'steps': '=',
      'onFinishCallback': '=',
      'index': '=stepIndex'
    },
    replace: true,
    templateUrl: os.ROOT + 'views/onboarding/ngonboarding.html',
    controller: os.ui.onboarding.NgOnboardingCtrl,
    controllerAs: 'ngOnboardCtrl'
  };
};


/**
 * Register ng-onboarding directive.
 */
os.ui.Module.directive('ngOnboarding', [os.ui.onboarding.ngOnboardingDirective]);

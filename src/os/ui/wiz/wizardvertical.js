goog.provide('os.ui.wiz.wizardVerticalDirective');
goog.require('os.ui.Module');
goog.require('os.ui.header.scrollHeaderDirective');
goog.require('os.ui.wiz.WizardCtrl');


/**
 * The wizard-vertical directive
 * @return {angular.Directive}
 */
os.ui.wiz.wizardVerticalDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: true,
    templateUrl: os.ROOT + 'views/wiz/wizardvertical.html',
    controller: os.ui.wiz.WizardCtrl,
    controllerAs: 'wiz'
  };
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.directive('wizardVertical', [os.ui.wiz.wizardVerticalDirective]);

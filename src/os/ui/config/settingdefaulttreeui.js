goog.provide('os.ui.config.SettingDefaultUICtrl');
goog.provide('os.ui.config.settingDefaultTreeUIDirective');
goog.require('os.ui.Module');


/**
 * The selected/highlighted node UI directive for filter groups
 * @return {angular.Directive}
 */
os.ui.config.settingDefaultTreeUIDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    template: '<div></div>',
    controller: os.ui.config.SettingDefaultUICtrl,
    controllerAs: 'settingUi'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('defaultsettingui', [os.ui.config.settingDefaultTreeUIDirective]);



/**
 * Controller for selected/highlighted node UI
 * @constructor
 * @ngInject
 */
os.ui.config.SettingDefaultUICtrl = function() {};

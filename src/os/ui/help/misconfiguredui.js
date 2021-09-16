goog.module('os.ui.help.MisconfiguredWindowUI');

const Module = goog.require('os.ui.Module');
const WindowEventType = goog.require('os.ui.WindowEventType');
const {directiveTag: misconfigured} = goog.require('os.ui.help.MisconfiguredUI');


/**
 * The UI template.
 * @type {string}
 */
const template = [
  '<div class="js-window__wrapper">',
  '<div class="js-window__content">',
  `<${misconfigured} reason="{{reason}}" name="{{name}}"></${misconfigured}>`,
  '</div>',
  '</div>'
].join('');

/**
 * The misconfiguredUi directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'AE',
  replace: true,
  scope: {
    'reason': '@',
    'name': '@'
  },
  template,
  controller: Controller,
  controllerAs: 'misconfiguredUi'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'misconfigured-ui';

/**
 * Add the directive to the module.
 */
Module.directive('misconfiguredUi', [directive]);

/**
 * Controller function for the misconfiguredUi directive
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    $scope.$emit(WindowEventType.READY);
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};

goog.module('os.ui.window.ConfirmTextUI');
goog.module.declareLegacyNamespace();

const ui = goog.require('os.ui');
const Module = goog.require('os.ui.Module');
const window = goog.require('os.ui.window');
goog.require('os.ui.util.validationMessageDirective');


goog.require('os.ui.window.ConfirmUI');

/**
 * Text confirmation dialog.
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  templateUrl: os.ROOT + 'views/window/confirmtext.html',
  controller: Controller,
  controllerAs: 'confirmtext'
});

/**
 * Add the directive to the ui module
 */
Module.directive('confirmtext', [directive]);



/**
 * Controller for the text confirmation window.
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
    if ($scope.$parent['select']) {
      setTimeout(function() {
        $element.find('[name="title"]').select();
      }, 10);
    }

    $scope.$watch('confirmValue', function(newVal, oldVal) {
      if (newVal != oldVal) {
        $scope.$parent['confirmValue'] = newVal;
      }
    });

    $scope.$emit(ui.WindowEventType.READY);
  }
}


/**
 * Launch a dialog prompting the user to enter some text.
 *
 * @param {osx.window.ConfirmTextOptions=} opt_options The window options
 */
window.launchConfirmText = function(opt_options) {
  var options = /** @type {!osx.window.ConfirmTextOptions} */ (opt_options || {});
  var scopeOptions = {
    'confirmCallback': options.confirm || goog.nullFunction,
    'cancelCallback': options.cancel || goog.nullFunction,
    'confirmValue': options.defaultValue,
    'yesText': options.yesText || 'OK',
    'yesIcon': options.yesIcon || 'fa fa-check',
    'yesButtonClass': options.yesButtonClass || 'btn-primary',
    'yesButtonTitle': options.yesButtonTitle || '',
    'noText': options.noText || 'Cancel',
    'noIcon': options.noIcon || 'fa fa-ban',
    'noButtonClass': options.noButtonClass || 'btn-secondary',
    'noButtonTitle': options.noButtonTitle || '',
    'checkboxText': options.checkboxText || '',
    'checkboxClass': options.checkboxClass || '',
    'checkboxCallback': options.checkbox || goog.nullFunction,
    'checkboxValue': !!options.checkboxValue,

    // confirm text options
    'select': !!options.select,
    'limit': options.limit || 200,
    'formLabel': options.formLabel,
    'prompt': options.prompt
  };

  var windowOverrides = /** @type {!osx.window.WindowOptions} */ (options.windowOptions || {});
  var windowOptions = {
    'label': windowOverrides.label || 'Enter Text',
    'icon': windowOverrides.icon || '',
    'x': windowOverrides.x || 'center',
    'y': windowOverrides.y || 'center',
    'width': windowOverrides.width || 325,
    'height': windowOverrides.height || 'auto',
    'modal': windowOverrides.modal != null ? windowOverrides.modal : 'true',
    'show-close': windowOverrides.showClose != null ? windowOverrides.showClose : 'false'
  };

  var template = '<confirm><confirmtext></confirmtext></confirm>';
  window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
};

exports = {
  Controller,
  directive
};

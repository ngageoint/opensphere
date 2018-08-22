goog.provide('os.ui.window.ConfirmTextCtrl');
goog.provide('os.ui.window.confirmTextDirective');

goog.require('os.ui.Module');
goog.require('os.ui.util.validationMessageDirective');
goog.require('os.ui.window');
goog.require('os.ui.window.confirmDirective');


/**
 * Text confirmation dialog.
 * @return {angular.Directive}
 */
os.ui.window.confirmTextDirective = function() {
  return {
    restrict: 'E',
    templateUrl: os.ROOT + 'views/window/confirmtext.html',
    controller: os.ui.window.ConfirmTextCtrl,
    controllerAs: 'confirmtext'
  };
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.directive('confirmtext', [os.ui.window.confirmTextDirective]);



/**
 * Controller for the text confirmation window.
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
os.ui.window.ConfirmTextCtrl = function($scope, $element) {
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

  $scope.$emit(os.ui.WindowEventType.READY);
};


/**
 * Launch a dialog prompting the user to enter some text.
 * @param {osx.window.ConfirmTextOptions=} opt_options The window options
 */
os.ui.window.launchConfirmText = function(opt_options) {
  var options = /** @type {!osx.window.ConfirmTextOptions} */ (opt_options || {});
  var scopeOptions = {
    'confirmCallback': options.confirm || goog.nullFunction,
    'cancelCallback': options.cancel || goog.nullFunction,
    'confirmValue': options.defaultValue,
    'yesText': options.yesText || 'OK',
    'yesIcon': options.yesIcon || 'fa fa-check',
    'yesButtonClass': options.yesButtonClass || 'btn-primary',
    'noText': options.noText || 'Cancel',
    'noIcon': options.noIcon || 'fa fa-ban',
    'noButtonClass': options.noButtonClass || 'btn-secondary',
    'select': !!options.select,
    'limit': options.limit || 200,

    // confirm text options
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
    'show-close': windowOverrides.showClose != null ? windowOverrides.showClose : 'false',
    'no-scroll': windowOverrides.noScroll != null ? windowOverrides.noScroll : 'true'
  };

  var template = '<confirm><confirmtext></confirmtext></confirm>';
  os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
};

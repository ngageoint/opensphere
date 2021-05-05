goog.provide('os.ui.window.ConfirmTextCtrl');
goog.provide('os.ui.window.confirmTextDirective');

goog.require('os.fn');
goog.require('os.ui.Module');
goog.require('os.ui.util.validationMessageDirective');
goog.require('os.ui.window');
goog.require('os.ui.window.ConfirmUI');


/**
 * Text confirmation dialog.
 *
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
 *
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
os.ui.window.ConfirmTextCtrl = function($scope, $element) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * @type {?angular.JQLite}
   * @private
   */
  this.element_ = $element;

  $scope.$watch('confirmValue', function(newVal, oldVal) {
    if (newVal != oldVal) {
      $scope.$parent['confirmValue'] = newVal;
    }
  });

  $scope.$emit(os.ui.WindowEventType.READY);
};


/**
 * Angular initialization lifecycle function.
 */
os.ui.window.ConfirmTextCtrl.prototype.$onInit = function() {
  if (this.scope_.$parent['select']) {
    this.element_.find('.js-confirm-input').select();
  }

  this.element_.find('.js-confirm-input').focus();
};


/**
 * Launch a dialog prompting the user to enter some text.
 *
 * @param {osx.window.ConfirmTextOptions=} opt_options The window options
 */
os.ui.window.launchConfirmText = function(opt_options) {
  var options = /** @type {!osx.window.ConfirmTextOptions} */ (opt_options || {});
  var scopeOptions = {
    'confirmCallback': options.confirm || os.fn.noop,
    'cancelCallback': options.cancel || os.fn.noop,
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
    'checkboxCallback': options.checkbox || os.fn.noop,
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
  os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
};

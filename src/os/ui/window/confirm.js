goog.provide('os.ui.window.ConfirmComponentCtrl');
goog.provide('os.ui.window.ConfirmCtrl');
goog.provide('os.ui.window.confirmDirective');

goog.require('goog.events.KeyHandler');
goog.require('os.ui.Module');
goog.require('os.ui.window');


/**
 * A confirmation window. Create a window using os.ui.window.create, supplying the necessary scope/window options.
 * @return {angular.Directive}
 */
os.ui.window.confirmDirective = function() {
  return {
    restrict: 'E',
    transclude: true,
    scope: true,
    templateUrl: os.ROOT + 'views/window/confirm.html',
    controller: os.ui.window.ConfirmCtrl,
    controllerAs: 'confirm'
  };
};


/**
 * Add the directive to the os module
 */
os.ui.Module.directive('confirm', [os.ui.window.confirmDirective]);


/**
 * Launch a dialog prompting the user to enter some text.
 * @param {osx.window.ConfirmOptions=} opt_options The window options
 */
os.ui.window.launchConfirm = function(opt_options) {
  var options = /** @type {!osx.window.ConfirmOptions} */ (opt_options || {});
  var scopeOptions = {
    'confirmCallback': options.confirm || goog.nullFunction,
    'cancelCallback': options.cancel || goog.nullFunction,
    'yesText': options.yesText || 'OK',
    'yesIcon': options.yesIcon || 'fa fa-check lt-blue-icon',
    'yesButtonTitle': options.yesButtonTitle || '',
    'noText': options.noText || 'Cancel',
    'noIcon': options.noIcon || 'fa fa-ban red-icon',
    'noButtonTitle': options.noButtonTitle || '',
    'formClass': options.formClass || 'form-horizontal'
  };

  var windowOverrides = /** @type {!osx.window.WindowOptions} */ (options.windowOptions || {});

  var height = windowOverrides.height || 140;
  var minHeight = windowOverrides.minHeight || height;
  var maxHeight = windowOverrides.maxHeight || height;

  var width = windowOverrides.width || 325;
  var minWidth = windowOverrides.minWidth || width;
  var maxWidth = windowOverrides.maxWidth || width;

  var windowOptions = {
    'label': windowOverrides.label || 'Confirm',
    'icon': windowOverrides.icon || '',
    'x': windowOverrides.x || 'center',
    'y': windowOverrides.y || 'center',
    'width': width,
    'min-width': minWidth,
    'max-width': maxWidth,
    'height': height,
    'min-height': minHeight,
    'max-height': maxHeight,
    'modal': windowOverrides.modal != null ? windowOverrides.modal : true,
    'show-close': windowOverrides.showClose != null ? windowOverrides.showClose : false,
    'no-scroll': windowOverrides.noScroll != null ? windowOverrides.noScroll : true
  };

  var text = options.prompt || 'Are you sure?';
  var template = '<confirm>' + text + '</confirm>';
  os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
};



/**
 * Controller for the confirmation window directive.
 *
 * The scope.valid field can be set from window options.  If it is not set, it defaults
 * to true. It controls the button that runs the "confirmCallback"
 *
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
os.ui.window.ConfirmCtrl = function($scope, $element) {
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

  if (this.scope_['valid'] == null) {
    this.scope_['valid'] = true;
  }

  /**
   * @type {!goog.events.KeyHandler}
   * @private
   */
  this.keyHandler_ = new goog.events.KeyHandler(goog.dom.getDocument());
  this.keyHandler_.listen(goog.events.KeyHandler.EventType.KEY, this.handleKeyEvent_, false, this);

  $scope.$on('$destroy', this.onDestroy_.bind(this));
};


/**
 * Clean up
 * @private
 */
os.ui.window.ConfirmCtrl.prototype.onDestroy_ = function() {
  goog.dispose(this.keyHandler_);

  this.element_ = null;
  this.scope_ = null;
};


/**
 * Fire the cancel callback and close the window.
 */
os.ui.window.ConfirmCtrl.prototype.cancel = function() {
  if (this.scope_['cancelCallback']) {
    this.scope_['cancelCallback']();
  }

  this.close_();
};
goog.exportProperty(os.ui.window.ConfirmCtrl.prototype, 'cancel', os.ui.window.ConfirmCtrl.prototype.cancel);


/**
 * Fire the confirmation callback and close the window.
 */
os.ui.window.ConfirmCtrl.prototype.confirm = function() {
  if (this.scope_['confirmCallback']) {
    var value = this.scope_['confirmValue'];
    if (value == null) {
      // try looking for it on the transcluded content's scope
      var transScope = this.element_.find('.confirm-text').children().first().scope();
      value = transScope['confirmValue'];
    }

    this.scope_['confirmCallback'](value);
  }

  this.close_();
};
goog.exportProperty(os.ui.window.ConfirmCtrl.prototype, 'confirm', os.ui.window.ConfirmCtrl.prototype.confirm);


/**
 * Close the window.
 * @private
 */
os.ui.window.ConfirmCtrl.prototype.close_ = function() {
  os.ui.window.close(this.element_);
};


/**
 * Handles key events
 * @param {goog.events.KeyEvent} event
 * @private
 */
os.ui.window.ConfirmCtrl.prototype.handleKeyEvent_ = function(event) {
  if (event.keyCode == goog.events.KeyCodes.ESC) {
    this.cancel();
  }
};

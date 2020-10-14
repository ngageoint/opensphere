goog.module('os.ui.window.ConfirmUI');
goog.module.declareLegacyNamespace();

const {getDocument} = goog.require('goog.dom');
const KeyCodes = goog.require('goog.events.KeyCodes');
const KeyHandler = goog.require('goog.events.KeyHandler');
const Module = goog.require('os.ui.Module');
const {create: createWindow, close: closeWindow} = goog.require('os.ui.window');
const WindowEventType = goog.require('os.ui.WindowEventType');


/**
 * A confirmation window. Create a window using window.create, supplying the necessary scope/window options.
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  transclude: true,
  scope: true,
  templateUrl: os.ROOT + 'views/window/confirm.html',
  controller: Controller,
  controllerAs: 'confirm'
});


/**
 * Add the directive to the os module
 */
Module.directive('confirm', [directive]);


/**
 * Launch a dialog prompting the user to enter some text.
 *
 * @param {osx.window.ConfirmOptions=} opt_options The window options
 * @param {Object=} opt_scopeOptions
 */
const launchConfirm = function(opt_options, opt_scopeOptions) {
  var options = /** @type {!osx.window.ConfirmOptions} */ (opt_options || {});
  var scopeOptions = (opt_scopeOptions || {});

  scopeOptions['confirmCallback'] = options.confirm || goog.nullFunction;
  scopeOptions['confirmValue'] = options.confirmValue || undefined;
  scopeOptions['cancelCallback'] = options.cancel || goog.nullFunction;
  scopeOptions['yesText'] = options.yesText || 'OK';
  scopeOptions['yesIcon'] = options.yesIcon || 'fa fa-check';
  scopeOptions['yesButtonClass'] = options.yesButtonClass || 'btn-primary';
  scopeOptions['yesButtonTitle'] = options.yesButtonTitle || '';
  scopeOptions['noText'] = options.noText !== undefined ? options.noText : 'Cancel';
  scopeOptions['noIcon'] = options.noIcon !== undefined ? options.noIcon : 'fa fa-ban';
  scopeOptions['noButtonTitle'] = options.noButtonTitle || '';
  scopeOptions['noButtonClass'] = options.noButtonClass || 'btn-secondary';
  scopeOptions['formClass'] = options.formClass || 'form-horizontal';
  scopeOptions['checkboxText'] = options.checkboxText || '';
  scopeOptions['checkboxClass'] = options.checkboxClass || '';
  scopeOptions['checkboxCallback'] = options.checkbox || goog.nullFunction;

  var windowOverrides = /** @type {!osx.window.WindowOptions} */ (options.windowOptions || {});

  var height = windowOverrides.height || 'auto';
  var width = windowOverrides.width || 325;
  var minWidth = windowOverrides.minWidth || width;
  var maxWidth = windowOverrides.maxWidth || width;

  var windowOptions = {
    'header-class': windowOverrides.headerClass || '',
    'label': windowOverrides.label || 'Confirm',
    'icon': windowOverrides.icon || '',
    'x': windowOverrides.x || 'center',
    'y': windowOverrides.y || 'center',
    'width': width,
    'min-width': minWidth,
    'max-width': maxWidth,
    'height': height,
    'min-height': windowOverrides.minHeight,
    'max-height': windowOverrides.maxHeight,
    'modal': windowOverrides.modal != null ? windowOverrides.modal : true,
    'show-close': windowOverrides.showClose != null ? windowOverrides.showClose : false,
    'no-scroll': windowOverrides.noScroll != null ? windowOverrides.noScroll : true
  };

  if (windowOverrides.id) {
    windowOptions['id'] = windowOverrides.id;
  }

  if (windowOverrides.parent) {
    windowOptions['window-container'] = windowOverrides.parent;
  }

  var text = options.prompt || 'Are you sure?';
  var template = '<confirm>' + text + '</confirm>';
  createWindow(windowOptions, template, windowOverrides.parent, undefined, undefined, scopeOptions);
};



/**
 * Controller for the confirmation window directive.
 *
 * The scope.valid field can be set from window options.  If it is not set, it defaults
 * to true. It controls the button that runs the "confirmCallback"
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$timeout} $timeout
   * @ngInject
   */
  constructor($scope, $element, $timeout) {
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
     * @type {boolean}
     */
    this.scope_['checkboxSelection'] = false;

    /**
     * @type {!KeyHandler}
     * @private
     */
    this.keyHandler_ = new KeyHandler(getDocument());
    this.keyHandler_.listen(KeyHandler.EventType.KEY, this.handleKeyEvent_, false, this);

    $timeout(function() {
      $scope.$emit(WindowEventType.READY);
    });

    $scope.$on('$destroy', this.onDestroy_.bind(this));
  }

  /**
   * Clean up
   *
   * @private
   */
  onDestroy_() {
    goog.dispose(this.keyHandler_);

    this.element_ = null;
    this.scope_ = null;
  }

  /**
   * Fire the cancel callback and close the window.
   *
   * @export
   */
  cancel() {
    if (this.scope_['cancelCallback']) {
      this.scope_['cancelCallback']();
    }

    this.close_();
  }

  /**
   * Fire the confirmation callback and close the window.
   *
   * @export
   */
  confirm() {
    if (this.scope_['confirmCallback']) {
      var value = this.scope_['confirmValue'];
      if (value == null) {
        // try looking for it on the transcluded content's scope
        var transScope;
        if (this.element_.find('.js-confirm-text').children().first().scope()) {
          transScope = this.element_.find('.js-confirm-text').children().first().scope();
        } else {
          transScope = this.element_.find('.js-confirm-text').scope();
        }
        value = transScope['confirmValue'];
      }

      this.scope_['confirmCallback'](value);
    }

    this.close_();
  }


  /**
   * Fire the dont show again callback to save user choice
   * @param {boolean} checkbox
   * @export
   */
  updateCheckbox(checkbox) {
    this.scope_['checkboxCallback'](checkbox);
  }


  /**
   * Close the window.
   *
   * @private
   */
  close_() {
    closeWindow(this.element_);
  }

  /**
   * Handles key events
   *
   * @param {goog.events.KeyEvent} event
   * @private
   */
  handleKeyEvent_(event) {
    if (event.keyCode == KeyCodes.ESC) {
      this.cancel();
    }
  }
}

exports = {
  Controller,
  directive,
  launchConfirm
};

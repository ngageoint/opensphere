goog.module('os.ui.TextPromptUI');

const Delay = goog.require('goog.async.Delay');
const {getDocument} = goog.require('goog.dom');
const KeyCodes = goog.require('goog.events.KeyCodes');
const KeyEvent = goog.require('goog.events.KeyEvent');
const KeyHandler = goog.require('goog.events.KeyHandler');
const {ROOT} = goog.require('os');
const Module = goog.require('os.ui.Module');
const WindowEventType = goog.require('os.ui.WindowEventType');
const {close, create} = goog.require('os.ui.window');


/**
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: true,
  templateUrl: ROOT + 'views/window/textprompt.html',
  controller: Controller,
  controllerAs: 'textPrompt'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'textprompt';

/**
 * Add the directive to the os module
 */
Module.directive(directiveTag, [directive]);

/**
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
    /**
     * @type {?angular.JQLite}
     * @private
     */
    this.element_ = $element;

    $scope.$on('$destroy', this.onDestroy_.bind(this));

    /**
     * @type {!KeyHandler}
     * @private
     */
    this.keyHandler_ = new KeyHandler(getDocument());
    this.keyHandler_.listen(KeyEvent.EventType.KEY, this.handleKeyEvent_, false, this);
    this.delay_ = new Delay(this.select_, 50, this);
    $scope.$emit(WindowEventType.READY);
    $scope.$watch('value', this.onValueChange_.bind(this));
  }

  /**
   * clean up
   *
   * @private
   */
  onDestroy_() {
    this.delay_.dispose();
    this.keyHandler_.dispose();
    this.element_ = null;
  }

  /**
   * Handles value change
   *
   * @param {string} newValue
   * @private
   */
  onValueChange_(newValue) {
    if (newValue) {
      this.delay_.stop();
      this.delay_.start();
    }
  }

  /**
   * Selects the text field
   *
   * @private
   */
  select_() {
    var input = this.element_.find('.js-text-prompt__main');
    input.select();
  }

  /**
   * Handles key events
   *
   * @param {KeyEvent} event
   * @private
   */
  handleKeyEvent_(event) {
    if (event.keyCode == KeyCodes.ESC) {
      this.close();
    }
  }

  /**
   * Close the window
   *
   * @export
   */
  close() {
    close(this.element_);
  }
}

/**
 * Launch a dialog prompting the user with some text.
 *
 * @param {osx.window.TextPromptOptions=} opt_options The window options
 */
const launchTextPrompt = function(opt_options) {
  var options = /** @type {!osx.window.TextPromptOptions} */ (opt_options || {});
  var scopeOptions = {
    'title': options.title,
    'text': options.text,
    'value': options.value,
    'text2': options.text2,
    'value2': options.value2
  };

  var windowOverrides = /** @type {!osx.window.WindowOptions} */ (options.windowOptions || {});

  var height = windowOverrides.height || 'auto';
  var minHeight = windowOverrides.minHeight || height;
  var maxHeight = windowOverrides.maxHeight || height;

  var width = windowOverrides.width || 450;
  var minWidth = windowOverrides.minWidth || width;
  var maxWidth = windowOverrides.maxWidth || width;

  var windowOptions = {
    'id': windowOverrides.id,
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
    'show-close': windowOverrides.showClose != null ? windowOverrides.showClose : true
  };

  create(windowOptions, 'textprompt', undefined, undefined, undefined, scopeOptions);
};

exports = {
  Controller,
  directive,
  directiveTag,
  launchTextPrompt
};

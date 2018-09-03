goog.provide('os.ui.TextPromptCtrl');
goog.provide('os.ui.textPromptDirective');

goog.require('goog.async.Delay');
goog.require('goog.dom');
goog.require('goog.events.KeyCodes');
goog.require('goog.events.KeyHandler');
goog.require('os.ui.Module');
goog.require('os.ui.window');


/**
 * @return {angular.Directive}
 */
os.ui.textPromptDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: true,
    templateUrl: os.ROOT + 'views/window/textprompt.html',
    controller: os.ui.TextPromptCtrl,
    controllerAs: 'textPrompt'
  };
};


/**
 * Add the directive to the os module
 */
os.ui.Module.directive('textprompt', [os.ui.textPromptDirective]);



/**
 * @constructor
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @ngInject
 */
os.ui.TextPromptCtrl = function($scope, $element) {
  /**
   * @type {?angular.JQLite}
   * @private
   */
  this.element_ = $element;

  $scope.$on('$destroy', this.onDestroy_.bind(this));

  /**
   * @type {!goog.events.KeyHandler}
   * @private
   */
  this.keyHandler_ = new goog.events.KeyHandler(goog.dom.getDocument());
  this.keyHandler_.listen(goog.events.KeyHandler.EventType.KEY, this.handleKeyEvent_, false, this);
  this.delay_ = new goog.async.Delay(this.select_, 50, this);
  $scope.$emit(os.ui.WindowEventType.READY);
  $scope.$watch('value', this.onValueChange_.bind(this));
};


/**
 * clean up
 * @private
 */
os.ui.TextPromptCtrl.prototype.onDestroy_ = function() {
  this.delay_.dispose();
  this.keyHandler_.dispose();
  this.element_ = null;
};


/**
 * Handles value change
 * @param {string} newValue
 * @private
 */
os.ui.TextPromptCtrl.prototype.onValueChange_ = function(newValue) {
  if (newValue) {
    this.delay_.stop();
    this.delay_.start();
  }
};


/**
 * Selects the text field
 * @private
 */
os.ui.TextPromptCtrl.prototype.select_ = function() {
  var input = this.element_.find('.js-text-prompt__main');
  input.select();
};


/**
 * Handles key events
 * @param {goog.events.KeyEvent} event
 * @private
 */
os.ui.TextPromptCtrl.prototype.handleKeyEvent_ = function(event) {
  if (event.keyCode == goog.events.KeyCodes.ESC) {
    this.close();
  }
};


/**
 * Close the window
 */
os.ui.TextPromptCtrl.prototype.close = function() {
  os.ui.window.close(this.element_);
};
goog.exportProperty(os.ui.TextPromptCtrl.prototype, 'close', os.ui.TextPromptCtrl.prototype.close);


/**
 * Launch a dialog prompting the user with some text.
 * @param {osx.window.TextPromptOptions=} opt_options The window options
 */
os.ui.launchTextPrompt = function(opt_options) {
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
    'show-close': windowOverrides.showClose != null ? windowOverrides.showClose : true,
    'no-scroll': windowOverrides.noScroll != null ? windowOverrides.noScroll : true
  };

  os.ui.window.create(windowOptions, 'textprompt', undefined, undefined, undefined, scopeOptions);
};

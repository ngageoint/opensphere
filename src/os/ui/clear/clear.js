goog.provide('os.ui.clear.ClearCtrl');
goog.provide('os.ui.clear.clearDirective');

goog.require('os.ui.Module');
goog.require('os.ui.window');


/**
 * The clear window directive
 * @return {angular.Directive}
 */
os.ui.clear.clearDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    scope: true,
    templateUrl: os.ROOT + 'views/window/clear.html',
    controller: os.ui.clear.ClearCtrl,
    controllerAs: 'clear'
  };
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.directive('clear', [os.ui.clear.clearDirective]);



/**
 * Controller for the Clear Window
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$timeout} $timeout
 * @constructor
 * @ngInject
 */
os.ui.clear.ClearCtrl = function($scope, $element, $timeout) {
  /**
   * @type {?angular.JQLite}
   * @private
   */
  this.element_ = $element;

  /**
   * The clear entries to display
   * @type {!Array<!os.ui.clear.ClearEntry>}
   */
  this['entries'] = goog.object.getValues(os.ui.clearManager.getEntries());

  // fired when the user closes the window with the 'x' button
  $scope.$on(os.ui.WindowEventType.CANCEL, this.cancelInternal_.bind(this));

  $scope.$on('$destroy', this.onDestroy_.bind(this));
  $timeout(function() {
    $scope.$emit(os.ui.WindowEventType.READY);
  });
};


/**
 * Clean up references/listeners.
 * @private
 */
os.ui.clear.ClearCtrl.prototype.onDestroy_ = function() {
  this.element_ = null;
};


/**
 * Close the window
 * @private
 */
os.ui.clear.ClearCtrl.prototype.close_ = function() {
  if (this.element_) {
    os.ui.window.close(this.element_);
  }
};


/**
 * Handle user hitting the window 'x' button
 * @private
 */
os.ui.clear.ClearCtrl.prototype.cancelInternal_ = function() {
  // reset clear entries from settings
  os.ui.clearManager.reset();
};


/**
 * Handle user clicking the Cancel button
 */
os.ui.clear.ClearCtrl.prototype.cancel = function() {
  // reset and close the window
  this.cancelInternal_();
  this.close_();
};
goog.exportProperty(
    os.ui.clear.ClearCtrl.prototype,
    'cancel',
    os.ui.clear.ClearCtrl.prototype.cancel);


/**
 * Handle user clicking the OK button
 */
os.ui.clear.ClearCtrl.prototype.accept = function() {
  // clear selected entries and close the window
  os.ui.clearManager.clear();
  this.close_();
};
goog.exportProperty(
    os.ui.clear.ClearCtrl.prototype,
    'accept',
    os.ui.clear.ClearCtrl.prototype.accept);

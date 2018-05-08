goog.provide('os.ui.util.ButtonHeightCtrl');
goog.provide('os.ui.util.buttonHeightDirective');
goog.require('goog.events.Event');
goog.require('os.config.ThemeSettingsChangeEvent');
goog.require('os.ui.Module');


/**
 * Make this element the height of a button. Useful for images in the nav bar
 * @return {angular.Directive}
 */
os.ui.util.buttonHeightDirective = function() {
  return {
    restrict: 'A',
    scope: true,
    controller: os.ui.util.ButtonHeightCtrl
  };
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.directive('buttonheight', [os.ui.util.buttonHeightDirective]);



/**
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$timeout} $timeout
 * @constructor
 * @ngInject
 */
os.ui.util.ButtonHeightCtrl = function($scope, $element, $timeout) {
  /**
   * @type {?angular.JQLite}
   * @private
   */
  this.element_ = $element;

  /**
   * @type {?angular.$timeout}
   * @private
   */
  this.timeout_ = $timeout;
  this.onChange_();

  os.dispatcher.listen(os.config.ThemeSettingsChangeEvent, this.onChange_, false, this);
  $scope.$on('$destroy', this.destroy_.bind(this));
};


/**
 * @private
 */
os.ui.util.ButtonHeightCtrl.prototype.destroy_ = function() {
  os.dispatcher.unlisten(os.config.ThemeSettingsChangeEvent, this.onChange_, false, this);
  this.element_ = null;
  this.timeout_ = null;
};


/**
 * Updated the height
 * @private
 */
os.ui.util.ButtonHeightCtrl.prototype.onChange_ = function() {
  this.timeout_(function() {
    var button = $('<button class="btn js-button-height position-absolute invisible">heighcheck</button>');
    this.element_.after(button);
    this.element_.height(button.outerHeight());
    button.remove();
  }.bind(this));
};

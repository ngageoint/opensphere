goog.provide('os.ui.WheelBlockerCtrl');
goog.provide('os.ui.wheelBlockerDirective');
goog.require('os.ui.Module');


/**
 * The wheelblocker directive
 * @return {angular.Directive}
 */
os.ui.wheelBlockerDirective = function() {
  return {
    restrict: 'EA',
    replace: true,
    template: '<div class="wheel-blocker"></div>',
    controller: os.ui.WheelBlockerCtrl,
    controllerAs: 'wheelblocker'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('wheelblocker', [os.ui.wheelBlockerDirective]);



/**
 * Controller function for the wheelblocker directive
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
os.ui.WheelBlockerCtrl = function($scope, $element) {
  /**
   * @type {?angular.JQLite}
   * @private
   */
  this.element_ = $element;

  /**
   * @type {function(jQuery.Event)}
   * @protected
   */
  this.clickBinding = this.onClick.bind(this);

  // bind to clicks on the document
  $(document).on('click', this.clickBinding);

  $scope.$on('$destroy', this.destroy_.bind(this));
};


/**
 * Clean up.
 * @private
 */
os.ui.WheelBlockerCtrl.prototype.destroy_ = function() {
  $(document).off('click', this.clickBinding);
  this.scope_ = null;
  this.element_ = null;
};


/**
 * Handles clicks on the whole document. If they hit the wheel blocker element, the element is hidden, allowing
 * future DOM events to pass through. If they don't hit the wheel blocker element, then the element is reshown.
 * @param {jQuery.Event} event
 */
os.ui.WheelBlockerCtrl.prototype.onClick = function(event) {
  if ($(event.target).closest('.wheel-blocker').is(this.element_[0])) {
    this.element_.hide();
  } else {
    this.element_.show();
  }
};

goog.provide('os.ui.util.ParentHeightCtrl');
goog.provide('os.ui.util.parentHeightDirective');
goog.require('os.ui.Module');


/**
 * Make this element the height of its parent.
 * This is useful for things that just absolutely require a height (slickgrid) but you want it to be responsive
 * @return {angular.Directive}
 */
os.ui.util.parentHeightDirective = function() {
  return {
    restrict: 'A',
    scope: true,
    controller: os.ui.util.ParentHeightCtrl
  };
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.directive('parentheight', [os.ui.util.parentHeightDirective]);



/**
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$timeout} $timeout
 * @constructor
 * @ngInject
 */
os.ui.util.ParentHeightCtrl = function($scope, $element, $timeout) {
  /**
   * @type {?angular.JQLite}
   * @private
   */
  this.element_ = $element;

  /**
   * @type {?angular.JQLite}
   * @private
   */
  this.parent_ = $element.parent();

  /**
   * @type {?function()}
   * @private
   */
  this.resizeFn_ = this.onResize_.bind(this);
  this.parent_.resize(this.resizeFn_);
  $scope.$on('resize', this.onResize_.bind(this));
  $scope.$on('$destroy', this.destroy_.bind(this));
};


/**
 * @private
 */
os.ui.util.ParentHeightCtrl.prototype.destroy_ = function() {
  if (this.parent_) {
    this.parent_.removeResize(this.resizeFn_);
  }

  this.element_ = null;
  this.parent_ = null;
};


/**
 * Handle resize events from the parent
 * @private
 */
os.ui.util.ParentHeightCtrl.prototype.onResize_ = function() {
  if (this.element_ && this.parent_) {
    this.element_.height(this.parent_.height());
  }
};

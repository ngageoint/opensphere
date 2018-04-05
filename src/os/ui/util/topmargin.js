goog.provide('os.ui.util.TopMarginCtrl');
goog.provide('os.ui.util.TopMarginDirective');
goog.require('os.ui');
goog.require('os.ui.Module');


/**
 * Offset this element the height of the offsetEl
 * @return {angular.Directive}
 */
os.ui.util.TopMarginDirective = function() {
  return {
    restrict: 'A',
    scope: {
      'offsetEl': '@'
    },
    controller: os.ui.util.TopMarginCtrl
  };
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.directive('topmargin', [os.ui.util.TopMarginDirective]);



/**
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$timeout} $timeout
 * @constructor
 * @ngInject
 */
os.ui.util.TopMarginCtrl = function($scope, $element, $timeout) {
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

  /**
   * @type {number}
   * @private
   */
  this.marginTop_ = 1;

  /**
   * Debounce resize events over a brief period.
   * @type {Function}
   * @private
   */
  this.resizeFn_ = this.onResize_.bind(this);

  $timeout(function() {
    this.bufferElement_ = $(this.scope_['offsetEl']);
    this.bufferElement_.resize(this.resizeFn_);
    this.resizeFn_();
  }.bind(this));
  $scope.$on('$destroy', this.onDestroy_.bind(this));
};


/**
 * Clean up listeners/references.
 * @private
 */
os.ui.util.TopMarginCtrl.prototype.onDestroy_ = function() {
  this.bufferElement_.removeResize(this.resizeFn_);

  this.resizeFn_ = null;
  this.element_ = null;
  this.scope_ = null;
};


/**
 * Handle resize events from the parent or children.
 * @private
 */
os.ui.util.TopMarginCtrl.prototype.onResize_ = function() {
  if (this.element_ && this.bufferElement_) {
    this.element_.css('margin-top', this.bufferElement_.height() + 'px');
  }
};

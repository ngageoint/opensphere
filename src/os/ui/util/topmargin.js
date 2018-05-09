goog.provide('os.ui.util.TopMarginCtrl');
goog.provide('os.ui.util.topMarginDirective');
goog.require('os.config.ThemeSettingsChangeEvent');
goog.require('os.ui');
goog.require('os.ui.Module');


/**
 * Offset this element the height of the offsetEl
 * @return {angular.Directive}
 */
os.ui.util.topMarginDirective = function() {
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
os.ui.Module.directive('topmargin', [os.ui.util.topMarginDirective]);



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
   * @type {?angular.$timeout}
   * @private
   */
  this.timeout_ = $timeout;

  /**
   * @type {?angular.JQLite}
   */
  this.bufferElement_ = null;

  /**
   * Debounce resize events over a brief period.
   * @type {Function}
   * @private
   */
  this.resizeFn_ = this.onResize_.bind(this);

  os.dispatcher.listen(os.config.ThemeSettingsChangeEvent, this.onResize_, false, this);
  $timeout(this.setWatchEl_.bind(this));
  $scope.$on('$destroy', this.onDestroy_.bind(this));
};


/**
 * Clean up listeners/references.
 * @private
 */
os.ui.util.TopMarginCtrl.prototype.onDestroy_ = function() {
  os.dispatcher.unlisten(os.config.ThemeSettingsChangeEvent, this.onResize_, false, this);
  if (this.bufferElement_) {
    this.bufferElement_.removeResize(this.resizeFn_);
    this.bufferElement_ = null;
  }

  this.resizeFn_ = null;
  this.timeout_ = null;
  this.element_ = null;
  this.scope_ = null;
};


/**
 * @private
 */
os.ui.util.TopMarginCtrl.prototype.setWatchEl_ = function() {
  this.bufferElement_ = $(this.scope_['offsetEl']);
  if (this.bufferElement_[0]) {
    this.bufferElement_.resize(this.resizeFn_);
    this.resizeFn_();
  } else {
    this.bufferElement_ = null;
    // Attempt to get the element again (rare)
    this.timeout_(this.setWatchEl_.bind(this));
  }
};


/**
 * Handle resize events from the parent or children.
 * @private
 */
os.ui.util.TopMarginCtrl.prototype.onResize_ = function() {
  if (this.element_ && this.bufferElement_) {
    this.element_.css('margin-top', this.bufferElement_.outerHeight() + 'px');
  }
};

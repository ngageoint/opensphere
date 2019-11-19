goog.provide('os.ui.util.OffsetMarginCtrl');
goog.provide('os.ui.util.offsetMarginDirective');

goog.require('goog.Throttle');
goog.require('os.config.ThemeSettingsChangeEvent');
goog.require('os.ui');
goog.require('os.ui.Module');


/**
 * Offset this element the height of the offsetEl
 *
 * @return {angular.Directive}
 */
os.ui.util.offsetMarginDirective = function() {
  return {
    restrict: 'A',
    scope: {
      'offsetTopEl': '@',
      'offsetBotEl': '@'
    },
    controller: os.ui.util.OffsetMarginCtrl
  };
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.directive('offsetMargin', [os.ui.util.offsetMarginDirective]);



/**
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$timeout} $timeout
 * @constructor
 * @ngInject
 */
os.ui.util.OffsetMarginCtrl = function($scope, $element, $timeout) {
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
   * @private
   */
  this.bufferTopElement_ = null;

  /**
   * @type {?angular.JQLite}
   * @private
   */
  this.bufferBotElement_ = null;

  /**
   * @type {goog.Throttle}
   * @private
   */
  this.throttle_ = new goog.Throttle(this.onThrottleResize_, 200, this);

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
 *
 * @private
 */
os.ui.util.OffsetMarginCtrl.prototype.onDestroy_ = function() {
  os.dispatcher.unlisten(os.config.ThemeSettingsChangeEvent, this.onResize_, false, this);
  if (this.throttle_) {
    this.throttle_.dispose();
    this.throttle_ = null;
  }

  if (this.bufferTopElement_) {
    os.ui.removeResize(this.bufferTopElement_, this.resizeFn_);
    this.bufferTopElement_ = null;
  }

  if (this.bufferBotElement_) {
    os.ui.removeResize(this.bufferBotElement_, this.resizeFn_);
    this.bufferBotElement_ = null;
  }

  this.resizeFn_ = null;
  this.timeout_ = null;
  this.element_ = null;
  this.scope_ = null;
};


/**
 * @private
 */
os.ui.util.OffsetMarginCtrl.prototype.setWatchEl_ = function() {
  this.bufferTopElement_ = /** @type {?angular.JQLite} */ ($(this.scope_['offsetTopEl']));
  this.bufferBotElement_ = /** @type {?angular.JQLite} */ ($(this.scope_['offsetBotEl']));

  if (this.bufferTopElement_[0] && this.bufferBotElement_[0]) {
    os.ui.resize(this.bufferTopElement_, this.resizeFn_);
    os.ui.resize(this.bufferBotElement_, this.resizeFn_);
    this.onThrottleResize_();
  } else {
    this.bufferTopElement_ = null;
    this.bufferBotElement_ = null;
    // Attempt to get the element again (rare)
    this.timeout_(this.setWatchEl_.bind(this));
  }
};


/**
 * @private
 */
os.ui.util.OffsetMarginCtrl.prototype.onResize_ = function() {
  this.throttle_.fire();
};


/**
 * @private
 */
os.ui.util.OffsetMarginCtrl.prototype.onThrottleResize_ = function() {
  if (this.element_ && this.bufferTopElement_ && this.bufferBotElement_) {
    this.element_.css('margin-top', this.bufferTopElement_.outerHeight() + 'px');
    this.element_.css('margin-bottom', this.bufferBotElement_.outerHeight() + 'px');
  }
};

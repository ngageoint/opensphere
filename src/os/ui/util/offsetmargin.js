goog.module('os.ui.util.OffsetMarginUI');

const Throttle = goog.require('goog.Throttle');
const dispatcher = goog.require('os.Dispatcher');
const ThemeSettingsChangeEvent = goog.require('os.config.ThemeSettingsChangeEvent');
const {removeResize, resize} = goog.require('os.ui');
const Module = goog.require('os.ui.Module');


/**
 * Offset this element the height of the offsetEl
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'A',
  scope: {
    'offsetTopEl': '@',
    'offsetBotEl': '@'
  },
  controller: Controller
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'offset-margin';

/**
 * Add the directive to the ui module
 */
Module.directive('offsetMargin', [directive]);

/**
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
     * @type {Throttle}
     * @private
     */
    this.throttle_ = new Throttle(this.onThrottleResize_, 200, this);

    /**
     * Debounce resize events over a brief period.
     * @type {Function}
     * @private
     */
    this.resizeFn_ = this.onResize_.bind(this);

    dispatcher.getInstance().listen(ThemeSettingsChangeEvent, this.onResize_, false, this);
    $timeout(this.setWatchEl_.bind(this));
    $scope.$on('$destroy', this.onDestroy_.bind(this));
  }

  /**
   * Clean up listeners/references.
   *
   * @private
   */
  onDestroy_() {
    dispatcher.getInstance().unlisten(ThemeSettingsChangeEvent, this.onResize_, false, this);
    if (this.throttle_) {
      this.throttle_.dispose();
      this.throttle_ = null;
    }

    if (this.bufferTopElement_) {
      removeResize(this.bufferTopElement_, this.resizeFn_);
      this.bufferTopElement_ = null;
    }

    if (this.bufferBotElement_) {
      removeResize(this.bufferBotElement_, this.resizeFn_);
      this.bufferBotElement_ = null;
    }

    this.resizeFn_ = null;
    this.timeout_ = null;
    this.element_ = null;
    this.scope_ = null;
  }

  /**
   * @private
   */
  setWatchEl_() {
    this.bufferTopElement_ = /** @type {?angular.JQLite} */ ($(this.scope_['offsetTopEl']));
    this.bufferBotElement_ = /** @type {?angular.JQLite} */ ($(this.scope_['offsetBotEl']));

    if (this.bufferTopElement_[0] && this.bufferBotElement_[0]) {
      resize(this.bufferTopElement_, this.resizeFn_);
      resize(this.bufferBotElement_, this.resizeFn_);
      this.onThrottleResize_();
    } else {
      this.bufferTopElement_ = null;
      this.bufferBotElement_ = null;
      // Attempt to get the element again (rare)
      this.timeout_(this.setWatchEl_.bind(this));
    }
  }

  /**
   * @private
   */
  onResize_() {
    this.throttle_.fire();
  }

  /**
   * @private
   */
  onThrottleResize_() {
    if (this.element_ && this.bufferTopElement_ && this.bufferBotElement_) {
      this.element_.css('margin-top', this.bufferTopElement_.outerHeight() + 'px');
      this.element_.css('margin-bottom', this.bufferBotElement_.outerHeight() + 'px');
    }
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};

goog.provide('os.ui.header.ScrollHeaderCtrl');
goog.provide('os.ui.header.ScrollHeaderEvents');
goog.provide('os.ui.header.scrollHeaderDirective');
goog.require('goog.async.Throttle');
goog.require('os.ui.Module');


/**
 * The scrollHeader directive
 *
 * @return {angular.Directive}
 */
os.ui.header.scrollHeaderDirective = function() {
  return {
    restrict: 'A',
    controller: os.ui.header.ScrollHeaderCtrl
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('scrollHeader', [os.ui.header.scrollHeaderDirective]);


/**
 * @enum {string}
 */
os.ui.header.ScrollHeaderEvents = {
  RESET: 'scrollheader.resetHeight',
  STICK: 'scrollheader.stick',
  UNSTICK: 'scrollheader.unstick'
};



/**
 * Controller function for the scrollHeader directive
 *
 * @param {!angular.Scope} $scope
 * @param {!jQuery} $element
 * @param {!angular.$timeout} $timeout
 * @param {!Object.<string, string>} $attrs
 * @constructor
 * @ngInject
 */
os.ui.header.ScrollHeaderCtrl = function($scope, $element, $timeout, $attrs) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * @type {?jQuery}
   * @private
   */
  this.element_ = $element;

  /**
   * @type {?angular.$timeout}
   * @private
   */
  this.timeout_ = $timeout;

  /**
   * @type {?jQuery}
   * @private
   */
  this.scrollEl_ = $($attrs['selector'] || window);

  /**
   * The element height to offset from
   * @type {number}
   * @private
   */
  this.resetHeight_ = 0;

  /**
   * @type {boolean}
   * @private
   */
  this.isFixed_ = false;

  /**
   * @type {jQuery}
   * @private
   */
  this.filler_ = null;

  /**
   * If we support position sticky, use it!!!
   * @type {boolean}
   * @private
   */
  this.supportsSticky_ = Modernizr.csspositionsticky || false;
  if (this.supportsSticky_) {
    this.timeout_(function() {
      this.element_.addClass('sticky-top position-sticky');
    }.bind(this));
  }

  /**
   * @type {goog.async.Throttle}
   * @private
   */
  this.processScroll_ = new goog.async.Throttle(this.updatePositions_, 50, this);
  this.processScrollHandler_ = this.processScroll_.fire.bind(this.processScroll_);

  this.updatePositions_();
  $scope.$on(os.ui.header.ScrollHeaderEvents.RESET, this.processScrollHandler_.bind(this));
  $element.bind('DOMNodeInserted', this.updateHeight_.bind(this));
  $(window).scroll(this.processScrollHandler_.bind(this));
  this.element_.on('$destroy', this.destroyElement_.bind(this));
};


/**
 * Update this element's based on window scroll position.
 *
 * @private
 */
os.ui.header.ScrollHeaderCtrl.prototype.updatePositions_ = function() {
  var headerHeight = $('.js-navtop').outerHeight();

  var navTop = this.element_.offset().top - $(window).scrollTop() - headerHeight;

  if (navTop < 0) {
    navTop = 0;
  }

  if (!this.isFixed_ && navTop <= 1) {
    this.isFixed_ = true;
    var eleHeight = this.element_.height();
    this.resetHeight_ = /** @type {number} */ (this.scrollEl_.scrollTop()) - (eleHeight ? eleHeight : 0);
    if (!this.supportsSticky_) {
      this.element_.addClass('position-fixed');
    }
    this.element_.css('top', headerHeight + 'px');

    this.scope_.$emit(os.ui.header.ScrollHeaderEvents.STICK);
  } else if (this.isFixed_ && this.scrollEl_.scrollTop() <= this.resetHeight_) {
    this.isFixed_ = false;
    if (!this.supportsSticky_) {
      if (this.filler_) {
        this.filler_.remove();
        this.filler_ = null;
      }
      this.element_.removeClass('position-fixed');
    }
    this.element_.css('top', '');
    this.scope_.$emit(os.ui.header.ScrollHeaderEvents.UNSTICK);
  } else if (this.isFixed_ && headerHeight != this.element_.position().top) {
    // We are in a fixed state but the header changed sizes, update our offset
    this.element_.css('top', headerHeight + 'px');
  }
};


/**
 * Update the height of the filler.
 *
 * @private
 */
os.ui.header.ScrollHeaderCtrl.prototype.updateHeight_ = function() {
  if (this.filler_) {
    this.filler_.css('height', this.element_.outerHeight());
  }
};


/**
 * Clean up element
 *
 * @private
 */
os.ui.header.ScrollHeaderCtrl.prototype.destroyElement_ = function() {
  this.element_.unbind('DOMNodeInserted');
  this.scrollEl_.off('scroll', this.processScrollHandler_);
  this.processScroll_.stop();
  this.processScroll_.dispose();
  this.processScroll_ = null;
  this.scope_ = null;
  this.element_ = null;
  this.timeout_ = null;
  $(window).off('scroll');
};

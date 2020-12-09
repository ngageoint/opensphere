goog.module('os.ui.header.ScrollHeaderUI');
goog.module.declareLegacyNamespace();

const Throttle = goog.require('goog.async.Throttle');
const Module = goog.require('os.ui.Module');
const ScrollHeaderEvents = goog.require('os.ui.header.ScrollHeaderEvents');


/**
 * The scrollHeader directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'A',

  scope: {
    'parents': '@?',
    'eventId': '@?'
  },

  controller: Controller
});


/**
 * Add the directive to the module.
 */
Module.directive('scrollHeader', [directive]);


/**
 * Controller function for the scrollHeader directive
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!jQuery} $element
   * @param {!angular.$timeout} $timeout
   * @param {!Object.<string, string>} $attrs
   * @ngInject
   */
  constructor($scope, $element, $timeout, $attrs) {
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
     * @type {Throttle}
     * @private
     */
    this.processScroll_ = new Throttle(this.updatePositions_, 50, this);
    this.processScrollHandler_ = this.processScroll_.fire.bind(this.processScroll_);

    this.updatePositions_();
    $scope.$on(ScrollHeaderEvents.RESET, this.processScrollHandler_.bind(this));
    $element.bind('DOMNodeInserted', this.updateHeight_.bind(this));
    $(window).scroll(this.processScrollHandler_.bind(this));
    this.element_.on('$destroy', this.destroyElement_.bind(this));
  }

  /**
   * Update this element's based on window scroll position.
   *
   * @private
   */
  updatePositions_() {
    var headerHeight = Math.floor($('.js-navtop').outerHeight());
    if (this.scope_['parents']) {
      headerHeight = 0;
      $(this.scope_['parents']).each(function() {
        headerHeight += Math.floor($(this).outerHeight());
      });
    }

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

      this.scope_.$emit(ScrollHeaderEvents.STICK, this.scope_['eventId']);
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
      this.scope_.$emit(ScrollHeaderEvents.UNSTICK, this.scope_['eventId']);
    } else if (this.isFixed_ && headerHeight != this.element_.position().top) {
      // We are in a fixed state but the header changed sizes, update our offset
      this.element_.css('top', headerHeight + 'px');
    }
  }

  /**
   * Update the height of the filler.
   *
   * @private
   */
  updateHeight_() {
    if (this.filler_) {
      this.filler_.css('height', this.element_.outerHeight());
    }
  }

  /**
   * Clean up element
   *
   * @private
   */
  destroyElement_() {
    this.element_.unbind('DOMNodeInserted');
    this.scrollEl_.off('scroll', this.processScrollHandler_);
    this.processScroll_.stop();
    this.processScroll_.dispose();
    this.processScroll_ = null;
    this.scope_ = null;
    this.element_ = null;
    this.timeout_ = null;
    $(window).off('scroll');
  }
}

exports = {
  Controller,
  directive
};

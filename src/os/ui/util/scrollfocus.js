goog.module('os.ui.util.ScrollFocusUI');

const Module = goog.require('os.ui.Module');


/**
 * The scroll-focus directive
 * As a user scrolls down a screen with nested scroll panes, the nested pane
 *  will take the scroll wheel event and scroll itself until it reaches the bottom
 *  and then start scrolling the page again.
 *  This directive prevents that behavior.
 * If you take focus on an element that has this directive, and it has a scroll bar
 * You will be prevented from scrolling out the element back onto the main scroll.
 *    WARNING: - this behavior may be an issue if your scroll element is in the middle of the
 *    page and taking the entire width and height of the browser.  You cant loose focus
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'A',
  controllerAs: 'scrollFocusCtrl',
  controller: Controller,
  link: linkFn
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'scroll-focus';

Module.directive('scrollFocus', [directive]);

/**
 * Controller for the scroll-focus directive.
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($element) {
    /**
     * @type {!angular.JQLite}
     * @private
     */
    this.element_ = $element;

    /**
     * @type {boolean}
     */
    this['hasFocus'] = false;

    /**
     * @type {!angular.JQLite}
     */
    this.container = angular.element('body');

    // tabindex allows divs to have focus; the 0 allows the focus without mucking up the tab order
    this.element_[0].setAttribute('tabindex', 0);
    this.initScrollHandler_();
    this.element_[0].addEventListener('blur', this.setFocus.bind(this), true);
    this.element_[0].addEventListener('focus', this.setFocus.bind(this), true);
  }

  /**
   *
   * @param {Event} e
   * @private
   */
  firefoxScrollHandler_(e) {
    var el = this.element_[0];
    if (!this['hasFocus']) {
      if (this.container) {
        this.container.scrollTop(this.container.scrollTop() + (19 * e.detail));
      } else {
        window.scrollBy(0, 19 * e.detail);
      }
      e.stopPropagation();
      e.preventDefault();
    } else if (this['hasFocus'] && this.hasScrollBar_()) {
      if ((e.detail > 0 && el.scrollHeight - this.element_.height() ===
          el.scrollTop) || (e.detail < 0 && el.scrollTop === 0)) {
        e.stopPropagation();
        e.preventDefault();
      }
    }
  }

  /**
   *
   * @param {Event} e
   * @private
   */
  scrollHandler_(e) {
    var el = this.element_[0];
    var x;
    var y;
    var wheelY;
    if (e.wheelDeltaX != null &&
        e.wheelDeltaY != null) { // chrome
      x = 0.4 * e.wheelDeltaX;
      y = -0.45 * e.wheelDeltaY;
      wheelY = e.wheelDeltaY;
    } else if (e.wheelDelta != null) { // i freaking e.
      x = 0;
      y = -2.1 * e.wheelDelta; // +120 away -120 toward the user
      wheelY = e.wheelDelta;
    } else { // ffox
      x = 0;
      y = 57;
      wheelY = 0;
    }
    if (!this['hasFocus']) {
      if (this.container) {
        this.container.scrollTop(this.container.scrollTop() + y);
      } else {
        window.scrollBy(x, y);
      }
      e.stopPropagation();
      e.preventDefault();
    } else if (this['hasFocus'] && this.hasScrollBar_()) {
      if ((wheelY < 0 && el.scrollHeight - this.element_.height() ===
          el.scrollTop) || (wheelY > 0 && el.scrollTop === 0)) {
        e.stopPropagation();
        e.preventDefault();
      }
    }
  }

  /**
   * Initializes the scroll event handler.
   *
   * @private
   */
  initScrollHandler_() {
    if (navigator.userAgent.indexOf('Firefox') !== -1) {
      this.element_[0].addEventListener('DOMMouseScroll', this.firefoxScrollHandler_.bind(this), true);
    } else {
      this.element_[0].addEventListener('mousewheel', this.scrollHandler_.bind(this), true);
    }
  }

  /**
   *
   * @private
   * @return {boolean}
   */
  hasScrollBar_() {
    return this.element_[0].scrollHeight > this.element_[0].clientHeight;
  }

  /**
   * Listener for focus and blur events to activate and deactivate scrolling.
   *
   * @param {goog.events.Event} e The event
   * @export
   */
  setFocus(e) {
    if (e.type === 'focus') {
      this['hasFocus'] = true;
    } else {
      this['hasFocus'] = false;
    }
  }
}

/**
 *
 * @param {angular.Scope} scope
 * @param {angular.JQLite} element
 * @param {Object} attrs
 * @param {Controller} scrollFocusCtrl
 * @private
 */
const linkFn = function(scope, element, attrs, scrollFocusCtrl) {
  scope['element'] = element = element[0];
  scope.$watch('element.scrollHeight', function(height) {
    if (typeof height === 'number') {
      if (scrollFocusCtrl.hasScrollBar_()) {
        element.setAttribute('tabindex', 0);
      } else {
        element.removeAttribute('tabindex');
      }
    }
  });
};

exports = {
  Controller,
  directive,
  directiveTag
};

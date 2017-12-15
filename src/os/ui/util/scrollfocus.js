goog.provide('os.ui.util.ScrollFocusCtrl');
goog.provide('os.ui.util.scrollFocusDirective');



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
 * @return {angular.Directive}
 */
os.ui.util.scrollFocusDirective = function() {
  return {
    restrict: 'A',
    controllerAs: 'scrollFocusCtrl',
    controller: os.ui.util.ScrollFocusCtrl,
    link: os.ui.util.scrollFocusDirective.linker_.bind(this)
  };
};


os.ui.Module.directive('scrollFocus', [os.ui.util.scrollFocusDirective]);


/**
 *
 * @param {angular.Scope} scope
 * @param {angular.JQLite} element
 * @param {Object} attrs
 * @param {os.ui.util.ScrollFocusCtrl} scrollFocusCtrl
 * @private
 */
os.ui.util.scrollFocusDirective.linker_ = function(scope, element, attrs, scrollFocusCtrl) {
  scope['element'] = element = element[0];
  scope.$watch('element.scrollHeight', goog.bind(function(height) {
    if (goog.isNumber(height)) {
      if (scrollFocusCtrl.hasScrollBar_()) {
        element.setAttribute('tabindex', 0);
      } else {
        element.removeAttribute('tabindex');
      }
    }
  }, this));
};



/**
 * Controller for the scroll-focus directive.
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
os.ui.util.ScrollFocusCtrl = function($element) {
  /**
   * @type {!angular.JQLite}
   * @private
   */
  this.element_ = $element;

  /**
   * @type {boolean}
   */
  this['hasFocus'] = false;

  // tabindex allows divs to have focus; the 0 allows the focus without mucking up the tab order
  this.element_[0].setAttribute('tabindex', 0);
  this.initScrollHandler_();
  this.element_[0].addEventListener('blur', this.setFocus.bind(this), true);
  this.element_[0].addEventListener('focus', this.setFocus.bind(this), true);
};


/**
 *
 * @param {Event} e
 * @private
 */
os.ui.util.ScrollFocusCtrl.prototype.firefoxScrollHandler_ = function(e) {
  var el = this.element_[0];
  if (!this['hasFocus']) {
    window.scrollBy(0, 19 * e.detail);
    e.stopPropagation();
    e.preventDefault();
  } else if (this['hasFocus'] && this.hasScrollBar_()) {
    if ((e.detail > 0 && el.scrollHeight - this.element_.height() ===
        el.scrollTop) || (e.detail < 0 && el.scrollTop === 0)) {
      e.stopPropagation();
      e.preventDefault();
    }
  }
};


/**
 *
 * @param {Event} e
 * @private
 */
os.ui.util.ScrollFocusCtrl.prototype.scrollHandler_ = function(e) {
  var el = this.element_[0];
  var x;
  var y;
  var wheelY;
  if (goog.isDefAndNotNull(e.wheelDeltaX) &&
      goog.isDefAndNotNull(e.wheelDeltaY)) { // chrome
    x = 0.4 * e.wheelDeltaX;
    y = -0.45 * e.wheelDeltaY;
    wheelY = e.wheelDeltaY;
  } else if (goog.isDefAndNotNull(e.wheelDelta)) { // i freaking e.
    x = 0;
    y = -2.1 * e.wheelDelta; // +120 away -120 toward the user
    wheelY = e.wheelDelta;
  } else { // ffox
    x = 0;
    y = 57;
    wheelY = 0;
  }
  if (!this['hasFocus']) {
    window.scrollBy(x, y);
    e.stopPropagation();
    e.preventDefault();
  } else if (this['hasFocus'] && this.hasScrollBar_()) {
    if ((wheelY < 0 && el.scrollHeight - this.element_.height() ===
        el.scrollTop) || (wheelY > 0 && el.scrollTop === 0)) {
      e.stopPropagation();
      e.preventDefault();
    }
  }
};


/**
 * Initializes the scroll event handler.
 * @private
 */
os.ui.util.ScrollFocusCtrl.prototype.initScrollHandler_ = function() {
  if (navigator.userAgent.indexOf('Firefox') !== -1) {
    this.element_[0].addEventListener('DOMMouseScroll', this.firefoxScrollHandler_.bind(this), true);
  } else {
    this.element_[0].addEventListener('mousewheel', this.scrollHandler_.bind(this), true);
  }
};


/**
 *
 * @private
 * @return {boolean}
 */
os.ui.util.ScrollFocusCtrl.prototype.hasScrollBar_ = function() {
  return this.element_[0].scrollHeight > this.element_[0].clientHeight;
};


/**
 * Listener for focus and blur events to activate and deactivate scrolling.
 * @param {goog.events.Event} e The event
 */
os.ui.util.ScrollFocusCtrl.prototype.setFocus = function(e) {
  if (e.type === 'focus') {
    this['hasFocus'] = true;
  } else {
    this['hasFocus'] = false;
  }
};
goog.exportProperty(os.ui.util.ScrollFocusCtrl.prototype, 'setFocus',
    os.ui.util.ScrollFocusCtrl.prototype.setFocus);

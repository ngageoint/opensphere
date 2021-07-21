goog.module('os.ui.util.PunyParentUI');
goog.module.declareLegacyNamespace();

const Throttle = goog.require('goog.Throttle');
const Delay = goog.require('goog.async.Delay');
const dispose = goog.require('goog.dispose');
const ViewportSizeMonitor = goog.require('goog.dom.ViewportSizeMonitor');
const GoogEventType = goog.require('goog.events.EventType');
const {apply, removeResize, resize} = goog.require('os.ui');
const Module = goog.require('os.ui.Module');


/**
 * If this elements width is less than all of its children. Apply puny state
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'A',
  scope: true,
  controller: Controller
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'punyparent';

/**
 * Add the directive to the ui module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for the punyparent directive.
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope The Angular scope.
   * @param {!angular.JQLite} $element The root DOM element.
   * @ngInject
   */
  constructor($scope, $element) {
    /**
     * The Angular scope.
     * @type {?angular.Scope}
     * @private
     */
    this.scope_ = $scope;

    /**
     * The root DOM element.
     * @type {?angular.JQLite}
     * @private
     */
    this.element_ = $element;

    /**
     * The maximum child size, to control when collapse/expand occurs.
     * @type {number}
     * @private
     */
    this.fullSize_ = 0;

    /**
     * Children that are watched for size changes.
     * @type {!Array<!Element>}
     * @private
     */
    this.watchedChildren_ = [];

    /**
     * Delay to debounce child size updates.
     * @type {Delay}
     * @private
     */
    this.childResizeDelay_ = new Delay(this.updateSize_, 50, this);

    /**
     * Pre-bound function to handle child resize.
     * @type {Function}
     * @private
     */
    this.onChildResizeFn_ = this.childResizeDelay_.start.bind(this.childResizeDelay_);

    /**
     * Observer to watch for changes to the element's child list.
     * @type {MutationObserver}
     * @private
     */
    this.observer_ = new MutationObserver(this.onMutation_.bind(this));
    this.observer_.observe(this.element_[0], {childList: true});

    /**
     * Pre-bound function to update the collapsed state.
     * @type {Function}
     * @private
     */
    this.updateCollapsedFn_ = this.updateCollapsed_.bind(this);

    /**
     * Throttle to limit how often the controller responds to viewport size changes.
     * @type {Throttle}
     * @private
     */
    this.vsmThrottle_ = new Throttle(this.updateCollapsed_, 200, this);

    // Listen for viewport size changes.
    const vsm = ViewportSizeMonitor.getInstanceForWindow();
    vsm.listen(GoogEventType.RESIZE, this.vsmThrottle_.fire, false, this.vsmThrottle_);

    // Update the collapsed state when the root element size changes.
    resize(this.element_, this.updateCollapsedFn_);
  }

  /**
   * Angular $onDestroy lifecycle hook.
   */
  $onDestroy() {
    removeResize(this.element_, this.updateCollapsedFn_);

    this.observer_.disconnect();

    this.watchedChildren_.forEach((child) => {
      removeResize($(child), this.onChildResizeFn_);
    });
    this.watchedChildren_.length = 0;

    dispose(this.childResizeDelay_);
    this.childResizeDelay_ = null;

    const vsm = ViewportSizeMonitor.getInstanceForWindow();
    vsm.unlisten(GoogEventType.RESIZE, this.vsmThrottle_.fire, false, this.vsmThrottle_);

    dispose(this.vsmThrottle_);
    this.vsmThrottle_ = null;

    this.scope_ = null;
    this.element_ = null;
  }

  /**
   * Handle mutation event.
   * @param {!Array<!MutationRecord>} mutationsList The mutation list.
   * @param {!MutationObserver} observer The observer.
   * @private
   */
  onMutation_(mutationsList, observer) {
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(this.watchChild_, this);
        mutation.removedNodes.forEach(this.unwatchChild_, this);
      }
    }
  }

  /**
   * Watch a child node.
   * @param {!Node} child The child.
   * @private
   */
  watchChild_(child) {
    // Ignore non-Element children (like comments), which cannot be watched for resize.
    if (child instanceof Element) {
      const childEl = $(child);
      if (!childEl.hasClass('resize-triggers') && !childEl.hasClass('resize-sensor')) {
        resize(childEl, this.onChildResizeFn_);
        this.watchedChildren_.push(child);
      }
    }
  }

  /**
   * Unwatch a child node.
   * @param {!Node} child The child.
   * @private
   */
  unwatchChild_(child) {
    // Ignore non-Element children (like comments), which cannot be watched for resize.
    if (child instanceof Element) {
      const index = this.watchedChildren_.indexOf(child);
      if (index > -1) {
        const childEl = $(child);
        removeResize(childEl, this.onChildResizeFn_);
        this.watchedChildren_.splice(index, 1);
      }
    }
  }

  /**
   * Updated the max allotted size for all children.
   * @private
   */
  updateSize_() {
    const childrenWidth = this.watchedChildren_.reduce((total, child) => total + $(child).outerWidth(true), 0);
    this.fullSize_ = Math.max(this.fullSize_, childrenWidth);
    this.updateCollapsed_();
  }

  /**
   * @private
   */
  updateCollapsed_() {
    if (this.element_) {
      // Set the collapsed state on the child scopes
      const collapsed = this.element_.outerWidth(true) < this.fullSize_;

      this.element_.children().toArray().forEach((child) => {
        const childScope = $(child).scope();
        if (childScope) {
          childScope['puny'] = collapsed;
        }
      });

      apply(this.scope_);
    }
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};

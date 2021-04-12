goog.provide('os.ui.util.PunyParentCtrl');
goog.provide('os.ui.util.punyParentDirective');

goog.require('goog.Throttle');
goog.require('goog.async.Delay');
goog.require('goog.dom.ViewportSizeMonitor');
goog.require('os.ui');
goog.require('os.ui.Module');


/**
 * If this elements width is less than all of its children. Apply puny state
 *
 * @return {angular.Directive}
 */
os.ui.util.punyParentDirective = function() {
  return {
    restrict: 'A',
    scope: true,
    controller: os.ui.util.PunyParentCtrl
  };
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.directive('punyparent', [os.ui.util.punyParentDirective]);



/**
 * Controller for the punyparent directive.
 * @param {!angular.Scope} $scope The Angular scope.
 * @param {!angular.JQLite} $element The root DOM element.
 * @constructor
 * @ngInject
 */
os.ui.util.PunyParentCtrl = function($scope, $element) {
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
   * @type {!Array<!Node>}
   * @private
   */
  this.watchedChildren_ = [];

  /**
   * Delay to debounce child size updates.
   * @type {goog.async.Delay}
   * @private
   */
  this.childResizeDelay_ = new goog.async.Delay(this.updateSize_, 50, this);

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
   * @type {goog.Throttle}
   * @private
   */
  this.vsmThrottle_ = new goog.Throttle(this.updateCollapsed_, 200, this);

  // Listen for viewport size changes.
  const vsm = goog.dom.ViewportSizeMonitor.getInstanceForWindow();
  vsm.listen(goog.events.EventType.RESIZE, this.vsmThrottle_.fire, false, this.vsmThrottle_);

  // Update the collapsed state when the root element size changes.
  os.ui.resize(this.element_, this.updateCollapsedFn_);
};


/**
 * Angular $onDestroy lifecycle hook.
 */
os.ui.util.PunyParentCtrl.prototype.$onDestroy = function() {
  os.ui.removeResize(this.element_, this.updateCollapsedFn_);

  this.observer_.disconnect();

  this.watchedChildren_.forEach((child) => {
    os.ui.removeResize($(child), this.onChildResizeFn_);
  });
  this.watchedChildren_.length = 0;

  goog.dispose(this.childResizeDelay_);
  this.childResizeDelay_ = null;

  const vsm = goog.dom.ViewportSizeMonitor.getInstanceForWindow();
  vsm.unlisten(goog.events.EventType.RESIZE, this.vsmThrottle_.fire, false, this.vsmThrottle_);

  goog.dispose(this.vsmThrottle_);
  this.vsmThrottle_ = null;

  this.scope_ = null;
  this.element_ = null;
};


/**
 * Handle mutation event.
 * @param {!Array<!MutationRecord>} mutationsList The mutation list.
 * @param {!MutationObserver} observer The observer.
 * @private
 */
os.ui.util.PunyParentCtrl.prototype.onMutation_ = function(mutationsList, observer) {
  for (const mutation of mutationsList) {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach(this.watchChild_, this);
      mutation.removedNodes.forEach(this.unwatchChild_, this);
    }
  }
};


/**
 * Watch a child node.
 * @param {!Node} child The child.
 * @private
 */
os.ui.util.PunyParentCtrl.prototype.watchChild_ = function(child) {
  const childEl = $(child);
  if (!childEl.hasClass('resize-triggers') && !childEl.hasClass('resize-sensor')) {
    os.ui.resize(childEl, this.onChildResizeFn_);
    this.watchedChildren_.push(child);
  }
};


/**
 * Unwatch a child node.
 * @param {!Node} child The child.
 * @private
 */
os.ui.util.PunyParentCtrl.prototype.unwatchChild_ = function(child) {
  const index = this.watchedChildren_.indexOf(child);
  if (index > -1) {
    const childEl = $(child);
    os.ui.removeResize(childEl, this.onChildResizeFn_);
    this.watchedChildren_.splice(index, 1);
  }
};


/**
 * Updated the max allotted size for all children.
 * @private
 */
os.ui.util.PunyParentCtrl.prototype.updateSize_ = function() {
  const childrenWidth = this.watchedChildren_.reduce((total, child) => total + $(child).outerWidth(true), 0);
  this.fullSize_ = Math.max(this.fullSize_, childrenWidth);
  this.updateCollapsed_();
};


/**
 * @private
 */
os.ui.util.PunyParentCtrl.prototype.updateCollapsed_ = function() {
  if (this.element_) {
    // Set the collapsed state on the child scopes
    const collapsed = this.element_.outerWidth(true) < this.fullSize_;

    this.element_.children().toArray().forEach((child) => {
      const childScope = $(child).scope();
      if (childScope) {
        childScope['puny'] = collapsed;
      }
    });

    os.ui.apply(this.scope_);
  }
};

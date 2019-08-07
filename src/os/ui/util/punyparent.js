goog.provide('os.ui.util.PunyParentCtrl');
goog.provide('os.ui.util.punyParentDirective');

goog.require('goog.Throttle');
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
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
os.ui.util.PunyParentCtrl = function($scope, $element) {
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
   * @type {goog.Throttle}
   * @private
   */
  this.throttle_ = new goog.Throttle(this.onThrottleResize_, 200, this);

  /**
   * Keep track of our maximum child size. This prevents saying we have enough space after a resize already occured
   * @type {number}
   * @private
   */
  this.fullSize = 0;

  var vsm = goog.dom.ViewportSizeMonitor.getInstanceForWindow();
  vsm.listen(goog.events.EventType.RESIZE, this.onResize_, false, this);

  $scope.$on('$destroy', this.destroy_.bind(this));
};


/**
 * @private
 */
os.ui.util.PunyParentCtrl.prototype.destroy_ = function() {
  var vsm = goog.dom.ViewportSizeMonitor.getInstanceForWindow();
  vsm.unlisten(goog.events.EventType.RESIZE, this.onResize_, false, this);

  if (this.throttle_) {
    this.throttle_.dispose();
    this.throttle_ = null;
  }
  this.scope_ = null;
  this.element_ = null;
};


/**
 * @private
 */
os.ui.util.PunyParentCtrl.prototype.onResize_ = function() {
  this.throttle_.fire();
};


/**
 * @private
 */
os.ui.util.PunyParentCtrl.prototype.onThrottleResize_ = function() {
  if (this.element_) {
    var children = this.element_.children().toArray();
    var childrenWidth = 0;
    children.forEach(function(child) {
      var c = $(child);
      // ignore the resize trigger since thats the parent size
      if (!c.hasClass('resize-triggers')) {
        childrenWidth += c.outerWidth(true);
      }
    });

    if (childrenWidth > this.fullSize) {
      this.fullSize = childrenWidth;
    }

    // Set the puny state on the child scope
    children.forEach(function(child) {
      var c = $(child);
      var cscope = c.scope();
      if (!c.hasClass('resize-triggers') && cscope) {
        cscope['puny'] = this.element_.outerWidth(true) < this.fullSize;
      }
    }.bind(this));
    os.ui.apply(this.scope_);
  }
};

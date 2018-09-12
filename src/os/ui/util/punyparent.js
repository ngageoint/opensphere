goog.provide('os.ui.util.PunyParentCtrl');
goog.provide('os.ui.util.punyParentDirective');
goog.require('os.ui.Module');


/**
 * If this elements width is less than all of its children. Apply puny state
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
 * @param {!angular.$timeout} $timeout
 * @constructor
 * @ngInject
 */
os.ui.util.PunyParentCtrl = function($scope, $element, $timeout) {
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
   * @type {Function}
   * @private
   */
  this.resizeFn_ = this.onResize_.bind(this);

  /**
   * Keep track of our maximum child size. This prevents saying we have enough space after a resize already occured
   * @type {number}
   * @private
   */
  this.fullSize = 0;

  $element.resize(this.resizeFn_);
  $scope.$on('$destroy', this.destroy_.bind(this));
};


/**
 * @private
 */
os.ui.util.PunyParentCtrl.prototype.destroy_ = function() {
  this.element_.removeResize(this.resizeFn_);
  this.scope_ = null;
  this.element_ = null;
  this.timeout_ = null;
};


/**
 * @private
 */
os.ui.util.PunyParentCtrl.prototype.onResize_ = function() {
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
};

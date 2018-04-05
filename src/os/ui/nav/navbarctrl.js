goog.provide('os.ui.NavBarCtrl');

goog.require('goog.dom.ViewportSizeMonitor');
goog.require('os.ui.list.ListEventType');



/**
 * Controller for NavBars
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
os.ui.NavBarCtrl = function($scope, $element) {
  /**
   * @type {?angular.Scope}
   * @protected
   */
  this.scope = $scope;

  /**
   * @type {?angular.JQLite}
   * @protected
   */
  this.element = $element;

  /**
   * @type {number}
   * @protected
   */
  this.maxSize = 0;

  /**
   * @type {goog.dom.ViewportSizeMonitor}
   * @protected
   */
  this.vsm = new goog.dom.ViewportSizeMonitor();

  /**
   * @type {boolean}
   */
  this.scope['punyWindow'] = window.innerWidth < (this.maxSize || os.ui.NavBarCtrl.DEFAULT_RESIZE_PX);

  os.ui.waitForAngular(this.onResize.bind(this));
  this.vsm.listen(goog.events.EventType.RESIZE, this.onResize, false, this);
  $scope.$on(os.ui.list.ListEventType.CHANGE, this.onResize.bind(this));
  $scope.$on('$destroy', this.destroy.bind(this));
};


/**
 * The default window width at which to update the nav contents.
 * @type {number}
 * @const
 */
os.ui.NavBarCtrl.DEFAULT_RESIZE_PX = 1350;


/**
 * Clean up.
 * @protected
 */
os.ui.NavBarCtrl.prototype.destroy = function() {
  this.scope = null;
  this.element = null;
  this.settings = null;
  this.vsm = null;
};


/**
 * Handles the browser resizing. Removes text from buttons for smaller windows.
 * @protected
 */
os.ui.NavBarCtrl.prototype.onResize = function() {
  if (!this.scope['punyWindow']) {
    // recompute the size whenever items are expanded, in case things are added to/removed from the nav
    this.maxSize = this.getNavContentSize() + 20;
  }

  this.scope['punyWindow'] = window.innerWidth < (this.maxSize || os.ui.NavBarCtrl.DEFAULT_RESIZE_PX);
  os.ui.apply(this.scope);
};


/**
 * Get the width of the items in the navbar
 * @return {number}
 * @protected
 */
os.ui.NavBarCtrl.prototype.getNavContentSize = function() {
  var size = 0;
  this.element.find('.nav-item').each(function(el) {
    size += $(this).outerWidth(true);
  });

  return size;
};

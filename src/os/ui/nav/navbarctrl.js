goog.provide('os.ui.NavBarCtrl');
goog.provide('os.ui.NavBarEvents');

goog.require('goog.dom.ViewportSizeMonitor');
goog.require('os.ui.list.ListEventType');
goog.require('os.ui.nav.EventType');



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
   * @type {boolean}
   */
  this.collapsed = true;

  /**
   * @type {goog.dom.ViewportSizeMonitor}
   * @protected
   */
  this.vsm = new goog.dom.ViewportSizeMonitor();

  /**
   * Backfill for scrolled transparent navbar
   * @type {boolean}
   */
  this.scope['filled'] = false;

  /**
   * If the brand is an svg file we want to embed the source
   * @type {boolean}
   */
  this.scope['svg'] = false;

  /**
   * Bootstrap navbar toggler breakpoint value (computed from size setting)
   * @type {?number}
   * @private
   */
  this['breakpointPx'] = null;

  os.dispatcher.listen(os.ui.nav.EventType.HIDE_NAV, this.onHideNavbar_, false, this);

  goog.events.listen(window, goog.events.EventType.SCROLL, this.formatNav_, false, this);

  os.dispatcher.listen(os.ui.nav.EventType.BG_TRANSPARENT, this.setTransparent_.bind(this));

  os.dispatcher.listen(os.ui.nav.EventType.BG_OPAQUE, this.setOpaque_.bind(this));

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
  goog.events.unlisten(window, goog.events.EventType.SCROLL, this.formatNav_, false, this);
  os.dispatcher.unlisten(os.ui.nav.EventType.HIDE_NAV, this.onHideNavbar_, false, this);
  os.dispatcher.unlisten(os.ui.nav.EventType.BG_TRANSPARENT, this.setTransparent_, false, this);
  os.dispatcher.unlisten(os.ui.nav.EventType.BG_OPAQUE, this.setOpaque_, false, this);

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
  this.formatNav_();
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
goog.exportProperty(
    os.ui.NavBarCtrl.prototype,
    'getNavContentSize',
    os.ui.NavBarCtrl.prototype.getNavContentSize);


/**
 * Toggle nav collapse
 */
os.ui.NavBarCtrl.prototype.toggleCollapse = function() {
  this.collapsed = !this.collapsed;
  if (this.collapsed) {
    os.dispatcher.dispatchEvent(os.ui.nav.EventType.COLLAPSE_NAV);
  } else {
    os.dispatcher.dispatchEvent(os.ui.nav.EventType.EXPAND_NAV);
  }
  this.formatNav_();
};
goog.exportProperty(
    os.ui.NavBarCtrl.prototype,
    'toggleCollapse',
    os.ui.NavBarCtrl.prototype.toggleCollapse);


/**
 * Show or hide the nav bar
 * @param {os.ui.nav.NavBarEvent} event
 * @private
 */
os.ui.NavBarCtrl.prototype.onHideNavbar_ = function(event) {
  this.scope['hideNav'] = event['state'];
  os.ui.apply(this.scope);
};


/**
 * Breakpoint used by Bootstrap to hide menu items and display toggler
 * @return {?number}
 * @private
 */
os.ui.NavBarCtrl.prototype.getBreakpointPx_ = function() {
  if (this['breakpointPx'] === null) {
    var breakpointPx = Number.parseInt(
        window.getComputedStyle(document.documentElement).getPropertyValue('--breakpoint-' +
            this['breakpointSize']), 10);
    this['breakpointPx'] = isNaN(breakpointPx) ? null : breakpointPx;
  }
  return this['breakpointPx'];
};


/**
 * Format the navbar based on nav collapse and window scroll
 * @private
 */
os.ui.NavBarCtrl.prototype.formatNav_ = function() {
  if (window.scrollY > 0 || window.innerWidth < this.getBreakpointPx_() && !this.collapsed) {
    this.scope['filled'] = true;
  } else {
    this.scope['filled'] = false;
  }
  os.ui.apply(this.scope);
};


/**
 * @private
 */
os.ui.NavBarCtrl.prototype.setTransparent_ = function() {
  this.scope['bgTransparent'] = 'true';
};


/**
 * @private
 */
os.ui.NavBarCtrl.prototype.setOpaque_ = function() {
  this.scope['bgTransparent'] = 'false';
};

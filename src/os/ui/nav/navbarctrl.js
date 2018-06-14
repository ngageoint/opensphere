goog.provide('os.ui.NavBarCtrl');
goog.provide('os.ui.NavBarEvents');
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
   * @private
   */
  this.element = $element;

  /**
   * Backfill for scrolled transparent navbar
   * @type {boolean}
   */
  this.scope['filled'] = false;

  /**
   * Should we hide the navbar?
   * @type {boolean}
   */
  this.scope['hideNav'] = false;

  /**
   * @type {boolean}
   */
  this.scope['bgTransparent'] = false;

  goog.events.listen(window, goog.events.EventType.SCROLL, this.formatNav_, false, this);
  os.dispatcher.listen(os.ui.nav.EventType.HIDE_NAV, this.onHideNavbar_, false, this);
  os.dispatcher.listen(os.ui.nav.EventType.BG_TRANSPARENT, this.setTransparent_.bind(this));
  $scope.$on('$destroy', this.destroy.bind(this));
};


/**
 * Clean up.
 * @protected
 */
os.ui.NavBarCtrl.prototype.destroy = function() {
  goog.events.unlisten(window, goog.events.EventType.SCROLL, this.formatNav_, false, this);
  os.dispatcher.unlisten(os.ui.nav.EventType.HIDE_NAV, this.onHideNavbar_, false, this);
  os.dispatcher.unlisten(os.ui.nav.EventType.BG_TRANSPARENT, this.setTransparent_, false, this);

  this.scope = null;
  this.element = null;
};


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
 * Format the navbar based on nav collapse and window scroll
 * @private
 */
os.ui.NavBarCtrl.prototype.formatNav_ = function() {
  this.scope['filled'] = window.scrollY > 0;
  os.ui.apply(this.scope);
};


/**
 * @param {os.ui.nav.NavBarEvent} event
 * @private
 */
os.ui.NavBarCtrl.prototype.setTransparent_ = function(event) {
  this.scope['bgTransparent'] = event['state'];
  os.ui.apply(this.scope);
};


/**
 * Get the width of the items in the navbar
 * @return {number}
 * @export
 */
os.ui.NavBarCtrl.prototype.getNavContentSize = function() {
  var size = 0;
  this.element.find('.nav-item').each(function(el) {
    size += $(this).outerWidth(true);
  });

  return size;
};

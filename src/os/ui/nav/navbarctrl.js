goog.provide('os.ui.NavBarCtrl');

goog.require('goog.Disposable');
goog.require('goog.events.Event');
goog.require('os.ui.nav.EventType');



/**
 * Controller for NavBars
 * @param {!angular.Scope} $scope The Angular scope.
 * @param {!angular.JQLite} $element The root DOM element.
 * @extends {goog.Disposable}
 * @constructor
 * @ngInject
 */
os.ui.NavBarCtrl = function($scope, $element) {
  os.ui.NavBarCtrl.base(this, 'constructor');

  /**
   * The Angular scope.
   * @type {?angular.Scope}
   * @protected
   */
  this.scope = $scope;

  /**
   * The root DOM element.
   * @type {?angular.JQLite}
   * @protected
   */
  this.element = $element;

  /**
   * Bound resize handler.
   * @type {Function}
   * @private
   */
  this.resizeFn_ = this.onResize_.bind(this);
  $element.resize(this.resizeFn_);

  $scope.$on('$destroy', this.dispose.bind(this));
};
goog.inherits(os.ui.NavBarCtrl, goog.Disposable);


/**
 * @inheritDoc
 */
os.ui.NavBarCtrl.prototype.disposeInternal = function() {
  os.ui.NavBarCtrl.base(this, 'disposeInternal');

  this.scope = null;
  this.element = null;
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


/**
 * Handle nav resize events.
 * @private
 */
os.ui.NavBarCtrl.prototype.onResize_ = function() {
  os.dispatcher.dispatchEvent(new goog.events.Event(os.ui.nav.EventType.RESIZE));
};

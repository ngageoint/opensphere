goog.provide('os.ui.NavBarCtrl');

goog.require('goog.Disposable');
goog.require('goog.events.Event');
goog.require('os.ui');
goog.require('os.ui.list');
goog.require('os.ui.nav.EventType');



/**
 * Controller for NavBars
 *
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
  os.ui.resize(this.element, this.resizeFn_);

  $scope.$on('$destroy', this.dispose.bind(this));
};
goog.inherits(os.ui.NavBarCtrl, goog.Disposable);


/**
 * @inheritDoc
 */
os.ui.NavBarCtrl.prototype.disposeInternal = function() {
  os.ui.NavBarCtrl.base(this, 'disposeInternal');

  if (this.element && this.resizeFn_) {
    os.ui.removeResize(this.element, this.resizeFn_);
  }

  this.scope = null;
  this.element = null;
};


/**
 * Get the width of the items in the navbar
 *
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
 * Get footer ng-class string based on loaded navbar lists
 *
 * @param {string=} opt_leftListId The optional left list id
 * @param {string=} opt_middleListId The optional middle list id
 * @param {string=} opt_rightListId The optional right list id
 * @return {Array.<string>} The resulting class string
 * @export
 */
os.ui.NavBarCtrl.prototype.getFooterDynamicClasses = function(opt_leftListId, opt_middleListId, opt_rightListId) {
  var classes = [];

  var ids = [opt_leftListId, opt_middleListId, opt_rightListId].filter(function(el) {
    return el;
  });

  if (this.navItemsFromSingleList_(ids)) {
    var numItemsLeft = this.numNavItems_(opt_leftListId);
    var numItemsMiddle = this.numNavItems_(opt_middleListId);
    var numItemsRight = this.numNavItems_(opt_rightListId);

    if (numItemsLeft || numItemsMiddle) {
      classes.push('mr-auto');
    } else if (numItemsRight || numItemsMiddle) {
      classes.push('ml-auto');
    }
  } else {
    classes.push('flex-fill');
  }

  return classes;
};


/**
 * Returns true if navbar only contains elements from one list
 *
 * @param {Array.<string>} listIds Array containing the list ids of the navbar lists
 * @return {boolean} true if NavBar elements come from a single list
 * @private
 */
os.ui.NavBarCtrl.prototype.navItemsFromSingleList_ = function(listIds) {
  var numListsPopulated = 0;
  listIds.forEach(function(id) {
    var list = os.ui.list.get(id);
    if (list && list.length > 0) {
      numListsPopulated++;
    }
  });

  return numListsPopulated == 1;
};


/**
 * Number of navItems within the given list id
 *
 * @param {string=} opt_listId The list id
 * @return {number} the number of navItems in the list
 * @private
 */
os.ui.NavBarCtrl.prototype.numNavItems_ = function(opt_listId) {
  return opt_listId && os.ui.list.get(opt_listId) ? os.ui.list.get(opt_listId).length : 0;
};


/**
 * Handle nav resize events.
 *
 * @private
 */
os.ui.NavBarCtrl.prototype.onResize_ = function() {
  os.dispatcher.dispatchEvent(new goog.events.Event(os.ui.nav.EventType.RESIZE));
};

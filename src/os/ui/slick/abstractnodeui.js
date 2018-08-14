goog.provide('os.ui.slick.AbstractNodeUICtrl');



/**
 * Abstract UI controller for tree nodes.
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
os.ui.slick.AbstractNodeUICtrl = function($scope, $element) {
  /**
   * @type {?angular.Scope}
   * @protected
   */
  this.scope = $scope;

  // we want to get the cell element (the parent) and listen for changes to the class name
  /**
   * @type {?angular.JQLite}
   * @protected
   */
  this.cellEl = $element.parent();

  $scope.$on('$destroy', this.destroy.bind(this));
};


/**
 * Clean up.
 * @protected
 */
os.ui.slick.AbstractNodeUICtrl.prototype.destroy = function() {
  this.scope = null;
  this.cellEl = null;
};


/**
 * Whether or not to show the element
 * @return {boolean}
 */
os.ui.slick.AbstractNodeUICtrl.prototype.show = function() {
  // selected class may be on the cell or the row
  return this.cellEl.hasClass('hovered') || this.cellEl.hasClass('selected') ||
      this.cellEl.parent().hasClass('selected');
};
goog.exportProperty(
    os.ui.slick.AbstractNodeUICtrl.prototype,
    'show',
    os.ui.slick.AbstractNodeUICtrl.prototype.show);

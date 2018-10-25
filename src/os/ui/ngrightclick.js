goog.provide('os.ui.RightClickCtrl');
goog.provide('os.ui.ngRightClickDirective');

goog.require('os.ui.Module');


/**
 * @return {angular.Directive}
 */
os.ui.ngRightClickDirective = function() {
  return {
    restrict: 'A',
    controller: os.ui.RightClickCtrl
  };
};


os.ui.Module.directive('ngRightClick', [os.ui.ngRightClickDirective]);



/**
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$parse} $parse
 * @param {!angular.Attributes} $attrs
 * @ngInject
 * @constructor
 */
os.ui.RightClickCtrl = function($scope, $element, $parse, $attrs) {
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
   * Right click handler.
   * @type {?angular.$parse.Expression}
   * @private
   */
  this.handler_ = $parse($attrs['ngRightClick']);

  $element.on('contextmenu', this.onContextMenu_.bind(this));
  $scope.$on('$destroy', this.destroy_.bind(this));
};


/**
 * Clean up.
 * @private
 */
os.ui.RightClickCtrl.prototype.destroy_ = function() {
  if (this.element_) {
    this.element_.off('contextmenu');
    this.element_ = null;
  }

  this.handler_ = null;
  this.scope_ = null;
};


/**
 * Handle context menu event on the element.
 * @param {angular.Scope.Event} evt The event.
 * @private
 */
os.ui.RightClickCtrl.prototype.onContextMenu_ = function(evt) {
  if (this.scope_) {
    this.scope_.$apply(function() {
      evt.preventDefault();
      evt.stopPropagation();
      if (this.scope_ && this.handler_) {
        this.handler_(this.scope_, {'$event': evt});
      }
    }.bind(this));
  }
};

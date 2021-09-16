goog.module('os.ui.NgRightClickUI');

const Module = goog.require('os.ui.Module');


/**
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'A',
  controller: Controller
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'ng-right-click';

Module.directive('ngRightClick', [directive]);

/**
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$parse} $parse
   * @param {!angular.Attributes} $attrs
   * @ngInject
   */
  constructor($scope, $element, $parse, $attrs) {
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
     * @type {?angular.parse.Expression}
     * @private
     */
    this.handler_ = $parse($attrs['ngRightClick']);

    $element.on('contextmenu', this.onContextMenu_.bind(this));
    $scope.$on('$destroy', this.destroy_.bind(this));
  }

  /**
   * Clean up.
   *
   * @private
   */
  destroy_() {
    if (this.element_) {
      this.element_.off('contextmenu');
      this.element_ = null;
    }

    this.handler_ = null;
    this.scope_ = null;
  }

  /**
   * Handle context menu event on the element.
   *
   * @param {angular.Scope.Event} evt The event.
   * @private
   */
  onContextMenu_(evt) {
    if (this.scope_) {
      this.scope_.$evalAsync(function() {
        evt.preventDefault();
        evt.stopPropagation();
        if (this.scope_ && this.handler_) {
          this.handler_(this.scope_, {'$event': evt});
        }
      }.bind(this));
    }
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};

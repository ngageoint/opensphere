goog.module('os.ui.dragDropDirective');
goog.module.declareLegacyNamespace();

const DragDrop = goog.require('os.ui.DragDrop');
const Module = goog.require('os.ui.Module');

/**
 * Enables elements as draggable (creating drag source and drop targets).
 * Provides basic behavior for drag and drop events and accepts function
 * parameters for the client to handle specialized behavior.
 *
 * Directive parameters:
 * dd-target-id The ID of the drop target. Turns the element into a drag target.
 *
 * Note: All event handler functions accept data and event as their parameters.
 *
 * dd-data Data to be passed along with drag/drop events.  Useful to carry the
 *    object which will be acted on.
 * dd-start Event handler function for drag start.
 * dd-end Event handler function for drag end.
 * dd-over Event handler function for drag over.
 * dd-out Event handler function for drag put.
 * dd-drop Event handler function for drag drop.
 * dd-min Setting for the minimum desired displacement before executing dd-drop
 *
 * Example usage:
 * ```
 * <div drag-drop dd-data="myObject" dd-drop="myLoadFunc">{{object.name}}></div>
 * ```
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'A',
  replace: false,
  link: dragDropLink,
  scope: {
    'ddTargetId': '@',
    'ddData': '=',
    'ddStart': '=?',
    'ddEnd': '=?',
    'ddOver': '=?',
    'ddOut': '=?',
    'ddDrop': '=',
    'ddMin': '=?'
  }
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'drag-drop';

/**
 * Register drag-drop directive.
 */
Module.directive('dragDrop', [directive]);

/**
 * Link function for draggable directive
 *
 * @param {!angular.Scope} $scope angular scope
 * @param {!angular.JQLite} $element to which this directive is applied
 * @param {!Object.<string, string>} $attrs Directive attributes
 */
const dragDropLink = function($scope, $element, $attrs) {
  let dragDrop = null;
  $attrs.$observe('dragDrop', function(attr) {
    if ($attrs['dragDrop'] !== undefined) {
      if (!dragDrop) {
        dragDrop = new DragDrop($scope, $element);
        $scope.$on('$destroy', dragDrop.destroy.bind(dragDrop));
      }
    } else if (dragDrop) {
      dragDrop.destroy();
      dragDrop = null;
    }
  });
};

exports = {
  directive,
  directiveTag
};

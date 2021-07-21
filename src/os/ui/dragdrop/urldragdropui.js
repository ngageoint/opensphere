goog.module('os.ui.urlDragDropDirective');
goog.module.declareLegacyNamespace();

const Module = goog.require('os.ui.Module');
const UrlDragDrop = goog.require('os.ui.UrlDragDrop');

/**
 * Enables an element to be a drag-drop target for URLs and files. When a URL drop
 * event is detected, this makes a call to the URL manager in os, which decides
 * what to do with it based on the handlers registered to it
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'A',
  replace: false,
  link: urlDragDropLink,
  scope: {
    'ddTargetId': '@',
    'ddDrop': '=?',
    'ddCapture': '@',
    'ddElement': '@',
    'ddText': '@?',
    'enabled': '=?',
    'allowInternal': '<?',
    'allowModal': '<?'
  }
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'url-drag-drop';

/**
 * Register url-drag-drop directive.
 */
Module.directive('urlDragDrop', [directive]);

/**
 * Link function for draggable directive
 *
 * @param {!angular.Scope} $scope angular scope
 * @param {!angular.JQLite} $element to which this directive is applied
 */
const urlDragDropLink = function($scope, $element) {
  const urlDragDrop = new UrlDragDrop($scope, $element);
  $scope.$on('$destroy', urlDragDrop.destroy.bind(urlDragDrop));
};

exports = {
  directive,
  directiveTag
};

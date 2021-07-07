goog.module('os.ui.column.columnRowDirective');
goog.module.declareLegacyNamespace();

const {ROOT} = goog.require('os');
const Module = goog.require('os.ui.Module');


/**
 * The columnrow directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: {
    'item': '='
  },
  templateUrl: ROOT + 'views/column/columnrow.html'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'columnrow';


/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);

exports = {
  directive,
  directiveTag
};

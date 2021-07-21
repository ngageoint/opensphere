goog.module('os.ui.filter.im.FilterImportModelUI');
goog.module.declareLegacyNamespace();

const {ROOT} = goog.require('os');
const Module = goog.require('os.ui.Module');

/**
 * The filterimportmodel directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  // this directive needs to be replace: false to display properly as it is recursive
  replace: false,
  scope: {
    'layerSelected': '=',
    'models': '=',
    'icon': '=',
    'found': '=',
    'isChild': '=?'
  },
  templateUrl: ROOT + 'views/filter/im/filterimportmodel.html'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'filterimportmodel';

/**
 * Add the directive to the module.
 */
Module.directive('filterimportmodel', [directive]);

exports = {
  directive,
  directiveTag
};

goog.module('os.ui.time.timeDirective');

const {ROOT} = goog.require('os');
const Module = goog.require('os.ui.Module');


/**
 * The time directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: {
    'hours': '=',
    'mins': '=',
    'secs': '=',
    'isRequired': '=?'
  },
  templateUrl: ROOT + 'views/time/time.html',
  controllerAs: 'time'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'time';

/**
 * Add the directive to the module.
 */
Module.directive('time', [directive]);

exports = {
  directive,
  directiveTag
};

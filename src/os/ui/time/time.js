goog.module('os.ui.time.timeDirective');
goog.module.declareLegacyNamespace();

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

  templateUrl: os.ROOT + 'views/time/time.html',
  controllerAs: 'time'
});


/**
 * Add the directive to the module.
 */
Module.directive('time', [directive]);
exports = directive;

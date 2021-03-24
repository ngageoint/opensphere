goog.module('os.ui.singleUrlFormDirective');

const Module = goog.require('os.ui.Module');
const {ROOT} = goog.require('os');


/**
 * The singleurlform directive.
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  templateUrl: ROOT + 'views/forms/singleurlform.html'
});


/**
 * Add the directive to the module.
 */
Module.directive('singleurlform', [directive]);

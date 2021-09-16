goog.module('os.ui.OSNavTopUI');

const {ROOT} = goog.require('os');
const Module = goog.require('os.ui.Module');


/**
 * The OpenSphere top nav bar.
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  templateUrl: ROOT + 'views/osnavtop.html'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'os-nav-top';

/**
 * Add the directive to the module.
 */
Module.directive('osNavTop', [directive]);

exports = {
  directive,
  directiveTag
};

goog.module('os.annotation.annotationOptionsDirective');

const {ROOT} = goog.require('os');
const {default: Module} = goog.require('os.ui.Module');


/**
 * An annotation to attach to the map.
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  templateUrl: ROOT + 'views/annotation/annotationoptions.html'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'annotationoptions';

/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);

exports = {
  directive,
  directiveTag
};

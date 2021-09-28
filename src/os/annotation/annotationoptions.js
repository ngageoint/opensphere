goog.declareModuleId('os.annotation.annotationOptionsDirective');

import {ROOT} from '../os.js';
import Module from '../ui/module.js';


/**
 * An annotation to attach to the map.
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  templateUrl: ROOT + 'views/annotation/annotationoptions.html'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'annotationoptions';

/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);

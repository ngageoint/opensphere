goog.declareModuleId('os.ui.singleUrlFormDirective');

import {ROOT} from '../os.js';
import Module from './module.js';


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

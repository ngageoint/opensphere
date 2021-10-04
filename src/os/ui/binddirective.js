goog.declareModuleId('os.ui.bindDirectiveDirective');

import Module from './module.js';


/**
 * The bind-directive directive. This directive's purpose is to act analogously to ng-bind-html, only
 * this will compile any directives in the passed string rather than just appending them as HTML.
 *
 * @param {!angular.$parse} $parse
 * @param {!angular.$compile} $compile
 * @return {angular.Directive}
 */
export const directive = ($parse, $compile) => {
  /**
   * @param {angular.JQLite} tElement The element.
   * @param {angular.Attributes=} tAttrs The attributes.
   * @return {Function}
   */
  const compileFn = (tElement, tAttrs) => {
    var bindDirectiveWatch = $parse(tAttrs['bindDirective']);
    $compile.$$addBindingClass(tElement);

    return function(scope, element, attr) {
      $compile.$$addBindingInfo(element, attr['bindDirective']);

      scope.$watch(bindDirectiveWatch, function(value) {
        element.html(value);

        // compile it, which will compile any directives contained therein
        $compile(element.children())(scope.$new());
      });
    };
  };

  return {
    restrict: 'A',
    compile: compileFn
  };
};

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'bind-directive';

/**
 * The injectable object that we will register with Angular.
 * @type {angular.Injectable}
 */
const bindDirectiveInjectable = ['$parse', '$compile', directive];

/**
 * Add the injectable to the module.
 */
Module.directive('bindDirective', bindDirectiveInjectable);

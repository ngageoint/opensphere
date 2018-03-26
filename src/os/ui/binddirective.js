goog.provide('os.ui.bindDirectiveDirective');

goog.require('os.ui.Module');


/**
 * The bind-directive directive. This directive's purpose is to act analogously to ng-bind-html, only
 * this will compile any directives in the passed string rather than just appending them as HTML.
 *
 * @param {!angular.$parse} $parse
 * @param {!angular.$compile} $compile
 * @return {angular.Directive}
 */
os.ui.bindDirectiveDirective = function($parse, $compile) {
  return {
    restrict: 'A',
    compile: function(tElement, tAttrs) {
      var bindDirectiveWatch = $parse(tAttrs['bindDirective']);
      $compile.$$addBindingClass(tElement);

      return function(scope, element, attr) {
        $compile.$$addBindingInfo(element, attr['bindDirective']);

        scope.$watch(bindDirectiveWatch, function(value) {
          // append the content to the child
          element.append(value);

          // compile it, which will compile any directives contained therein
          $compile(element.children())(scope.$new());
        });
      };
    }
  };
};


/**
 * The injectable object that we will register with Angular.
 * @type {angular.Injectable}
 */
os.ui.bindDirectiveInjectable = ['$parse', '$compile', os.ui.bindDirectiveDirective];


/**
 * Add the injectable to the module.
 */
os.ui.Module.directive('bindDirective', os.ui.bindDirectiveInjectable);

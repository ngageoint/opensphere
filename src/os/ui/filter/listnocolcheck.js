goog.provide('os.ui.filter.listNoColCheckDirective');

goog.require('os.ui.Module');


/**
 * A directive that allows for filtering on a numeric column but including a wildcard.
 * The normal directive restricts the filter to be the same type as the column (i.e. decimal).
 * But in this case, we need to allow for a numeric along with a '*'
 * @return {angular.Directive}
 */
os.ui.filter.listNoColCheckDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    templateUrl: os.ROOT + 'views/filter/listnocolcheck.html'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('fbListNoColCheck', [os.ui.filter.listNoColCheckDirective]);


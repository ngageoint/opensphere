goog.provide('os.ui.geo.geoDirective');
goog.require('os.geo');
goog.require('os.ui.Module');


/**
 * The geo directive, for position input validation.
 * @return {angular.Directive}
 */
os.ui.geo.geoDirective = function() {
  return {
    require: 'ngModel',
    link: os.ui.geo.geoLinkFn
  };
};


/**
 * Link function for the geo directive.
 * @param {!angular.Scope} scope The scope
 * @param {!angular.JQLite} elm The element
 * @param {Object} attrs Directive attributes
 * @param {!angular.NgModelController} ctrl The model controller
 */
os.ui.geo.geoLinkFn = function(scope, elm, attrs, ctrl) {
  var validate = function(val) {
    var origText = val;
    var result = os.geo.parseLatLon(val);
    if (goog.isDefAndNotNull(result) && Math.abs(result.lat) > 90) {
      // If the result isnt in range, set it to null to invalidate form
      result = null;
    }
    var valid = true;
    if (goog.isDefAndNotNull(result)) {
      valid = true;
    } else {
      try {
        var m = osasm.toLonLat(val);
        valid = goog.isArray(m) && m.length === 2;
      } catch (e) {
        valid = false;
      }
    }

    if (!ctrl.$pristine) {
      ctrl.$setValidity('pos', valid);
    }

    scope.$watch('required', function(val) {
      if (val) {
        ctrl.$setValidity('pos', valid);
      } else if (!origText) {
        ctrl.$setValidity('pos', true);
      } else {
        ctrl.$setValidity('pos', valid);
      }
    });

    return val;
  };

  // $formatters handles programmatic changes to the model, $parsers handles changes from the view
  ctrl.$formatters.unshift(validate);
  ctrl.$parsers.unshift(validate);
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('geo', [os.ui.geo.geoDirective]);

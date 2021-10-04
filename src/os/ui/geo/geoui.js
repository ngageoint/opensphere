goog.declareModuleId('os.ui.geo.GeoUI');

import {parseLatLon} from '../../geo/geo.js';
import Module from '../module.js';
import mgrs from './mgrs.js';


/**
 * The geo directive, for position input validation.
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  require: 'ngModel',
  link: geoLinkFn
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'geo';

/**
 * Link function for the geo directive.
 *
 * @param {!angular.Scope} scope The scope
 * @param {!angular.JQLite} elm The element
 * @param {Object} attrs Directive attributes
 * @param {!angular.NgModelController} ctrl The model controller
 */
const geoLinkFn = function(scope, elm, attrs, ctrl) {
  var validate = function(val) {
    var origText = val;
    var result = parseLatLon(val);
    if (result != null && Math.abs(result.lat) > 90) {
      // If the result isnt in range, set it to null to invalidate form
      result = null;
    }
    var valid = true;
    if (result != null) {
      valid = true;
    } else {
      try {
        var m = mgrs(val);
        valid = Array.isArray(m) && m.length === 2;
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
Module.directive(directiveTag, [directive]);

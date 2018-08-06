goog.provide('os.ui.geo.AltitudeCtrl');
goog.provide('os.ui.geo.AltitudeDirective');
goog.provide('os.ui.geo.AltitudeEventType');

goog.require('os.geo');
goog.require('os.ui.Module');
goog.require('os.ui.geo.geoDirective');
goog.require('os.ui.popover.popoverDirective');


/**
 * Angular events for the altitude directive.
 * @enum {string}
 */
os.ui.geo.AltitudeEventType = {
  MAP_ENABLED: 'altitude:mapEnabled',
  MAP_CLICK: 'altitude:mapClick'
};

/**
 * The altitude input directive.
 * @return {angular.Directive}
 */
os.ui.geo.AltitudeDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: os.ROOT + 'views/geo/altitude.html',
    scope: {
      'disabled': '=?',
      'required': '=?',
      'order': '=?',
      'form': '=',
      'geom': '=',
      'label': '@',
      'mapSupport': '@',
      'name': '@',
      'hideHint': '='
    },
    controller: os.ui.geo.AltitudeCtrl,
    controllerAs: 'altCtrl'
  };
};

/**
 * Add the directive to the module.
 */
os.ui.Module.directive('altitude', [os.ui.geo.AltitudeDirective]);



/**
 * Controller function for the locationedit directive
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
os.ui.geo.AltitudeCtrl = function($scope, $element) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * @type {?Function}
   * @private
   */
  this.mapListener_ = null;

  /**
   * @type {string}
   */
  this['label'] = goog.isDef($scope['label']) ? $scope['label'] : 'Altitude:';
  if (this['label'] == 'false') {
    this['label'] = null;
  }

  /**
   * @type {boolean}
   */
  this['mapEnabled'] = false;

  if (!goog.isDefAndNotNull(this.scope_['required'])) {
    this.scope_['required'] = true;
  }

  /**
   * @type {string}
   */
  $scope['popoverContent'] = 'Takes DD, DMS, DDM or MGRS.';
};

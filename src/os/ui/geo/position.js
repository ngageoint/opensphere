goog.provide('os.ui.geo.PositionCtrl');
goog.provide('os.ui.geo.PositionEventType');
goog.provide('os.ui.geo.positionDirective');

goog.require('os.geo');
goog.require('os.ui.Module');
goog.require('os.ui.geo.geoDirective');
goog.require('os.ui.popover.popoverDirective');


/**
 * Angular events for the position directive.
 * @enum {string}
 */
os.ui.geo.PositionEventType = {
  MAP_ENABLED: 'position:mapEnabled',
  MAP_CLICK: 'position:mapClick'
};


/**
 * The position input directive. This directive provides an input that accepts Lat/Lon, DMS, DDM and MGRS locations. It
 * also supports receiving map click events from an ancestor.
 *
 * Scope vars:
 *  - disabled: A boolean indicating an ancestor is performing an action that should disable the form.
 *  - required: If the control is required by the parent form.
 *  - form: The form containing this directive.
 *  - geom: The {@link osx.geo.Location} object that will be manipulated by the control.
 *  - mapSupport: If picking a location from the map should be supported.
 *  - name: Used to differentiate multiple instances of the position control on a single page.
 *  - hideHint: Hides the text hint under the control about how to use it.
 *
 * If the mapSupport var is set to 'true', a button will be displayed next to the position input to toggle picking
 * the location from a map. Clicking the button will $emit a {@link os.ui.geo.PositionEventType.MAP_ENABLED} event
 * with the current state of the button. When the control is activated, the position controller will listen for
 * {@link os.ui.geo.PositionEventType.MAP_CLICK} events to be $broadcast on the scope. These events should be fired
 * with a coordinate array in [lon, lat] format. The geom object will be updated with the coordinate.
 *
 * @return {angular.Directive}
 */
os.ui.geo.positionDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: os.ROOT + 'views/geo/position.html',
    scope: {
      'disabled': '=?',
      'required': '=?',
      'order': '=?',
      'form': '=',
      'geom': '=',
      'label': '@',
      'mapSupport': '@',
      'name': '@',
      'hideHint': '=',
      'showLabel': '=?',
      'bulk': '=?',
      'col': '=?'
    },
    controller: os.ui.geo.PositionCtrl,
    controllerAs: 'posCtrl'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('position', [os.ui.geo.positionDirective]);



/**
 * Controller function for the locationedit directive
 *
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
os.ui.geo.PositionCtrl = function($scope, $element) {
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
  this['label'] = $scope['label'] !== undefined ? $scope['label'] : 'Position';
  if (this['label'] == 'false') {
    this['label'] = null;
  }

  /**
   * @type {boolean}
   */
  this['mapEnabled'] = false;

  if (this.scope_['required'] == null) {
    this.scope_['required'] = true;
  }

  /**
   * The precision to use for display.
   * @type {number}
   */
  this.precision = Math.pow(10, os.ui.geo.PositionCtrl.DEFAULT_COORD_PRECISION);

  /**
   * @type {boolean}
   */
  this['showLabel'] = this.scope_['showLabel'] != null ? this.scope_['showLabel'] : true;

  /**
   * @type {string}
   */
  this['popoverTitle'] = 'Entering Position';

  /**
   * @type {string}
   */
  this['col'] = $scope['col'] != null ? $scope['col'] : '2';

  /**
   * @type {string}
   */
  $scope['popoverContent'] = 'Takes DD, DMS, DDM or MGRS. If Lat/Lon, the first coordinate is assumed ' +
      'to be latitude unless it is zero-padded (0683000.55 or 058.135), three-digits (105&deg;30\'10.1&quot; or ' +
      '105.3), or contains the direction (68 30 12 W or 105 E).';

  $scope.$watch('posText', function(event, val) {
    if (!this.scope_['required']) {
      this.scope_.$emit('positionText', this.scope_['geom'], this.scope_['posText']);
    }

    this.onPosText_();
  }.bind(this));
  $scope.$watch('order', this.onPosText_.bind(this));
  $scope.$watch('geom.lon', this.onCoord_.bind(this));
  $scope.$watch('geom.lat', this.onCoord_.bind(this));

  $scope.$on(os.ui.geo.PositionEventType.MAP_ENABLED, this.onMapEnabled_.bind(this));

  $scope.$on('resetForm', function(opt_name) {
    if (opt_name === undefined || opt_name == this.scope_['name']) {
      this.setMapEnabled_(false);
    }
  }.bind(this));
  $scope.$on('$destroy', this.destroy_.bind(this));
};


/**
 * The maximum allowed coordinate precision. This allows millimeter precision while avoiding scientific notation when
 * converting to a string.
 * @type {number}
 * @const
 */
os.ui.geo.PositionCtrl.DEFAULT_COORD_PRECISION = 8;


/**
 * Clean up.
 *
 * @private
 */
os.ui.geo.PositionCtrl.prototype.destroy_ = function() {
  if (this.mapListener_) {
    this.mapListener_();
    this.mapListener_ = null;
  }

  this.scope_ = null;
};


/**
 * Handle position text change.
 *
 * @private
 */
os.ui.geo.PositionCtrl.prototype.onPosText_ = function() {
  if (this.scope_['posText']) {
    var result = os.geo.parseLatLon(this.scope_['posText'], this.scope_['order']);
    if (result != null && Math.abs(result.lat) > 90) {
      // If the result isnt in range, set it to null to invalidate form
      result = null;
    }
    if (result == null) {
      try {
        var coord = osasm.toLonLat(this.scope_['posText']);
        result = /** @type {!osx.geo.Location} */ ({
          lon: coord[0],
          lat: coord[1]
        });
      } catch (e) {
      }
    }

    if (result != null) {
      this.scope_['geom']['lat'] = result.lat;
      this.scope_['geom']['lon'] = result.lon;
    }
  }
};


/**
 * Handle position change.
 *
 * @private
 */
os.ui.geo.PositionCtrl.prototype.onCoord_ = function() {
  if (!isNaN(this.scope_['geom']['lat']) && !isNaN(this.scope_['geom']['lon'])) {
    if (this.scope_['posText']) {
      var result = os.geo.parseLatLon(this.scope_['posText'], this.scope_['order']);
      if (result != null) {
        if (Math.abs(result.lat - this.scope_['geom']['lat']) > os.geo.EPSILON ||
            Math.abs(result.lon - this.scope_['geom']['lon']) > os.geo.EPSILON) {
          this.formatLatLon_();
        }
      }
    } else {
      this.formatLatLon_();
    }
  } else {
    this.scope_['posText'] = '';
  }
};


/**
 * Correctly format coordinates.
 *
 * @private
 */
os.ui.geo.PositionCtrl.prototype.formatLatLon_ = function() {
  var lat = this.scope_['geom']['lat'];
  var lon = this.scope_['geom']['lon'];
  var latHemisphere = lat >= 0 ? 'N ' : 'S ';
  var lonHemisphere = lon >= 0 ? 'E' : 'W';
  var coordsFormatted = '' + Math.abs(lat) + latHemisphere + Math.abs(lon) + lonHemisphere;
  this.scope_['posText'] = coordsFormatted;
};


/**
 * Toggles listening for map click events via the UI, propagating an event upward.
 *
 * @export
 */
os.ui.geo.PositionCtrl.prototype.toggleMapEnabled = function() {
  this.setMapEnabled_(!this['mapEnabled']);
};


/**
 * Update the location from a map click.
 *
 * @param {angular.Scope.Event} event The Angular event
 * @param {Array.<number>} coordinates The coordinates as [lon, lat]
 * @param {boolean=} opt_disable If map clicks should be disabled
 * @private
 */
os.ui.geo.PositionCtrl.prototype.onMapClick_ = function(event, coordinates, opt_disable) {
  if (!this.scope_['disabled'] && coordinates && coordinates.length > 1) {
    this.scope_['geom']['lon'] = Math.round(coordinates[0] * this.precision) / this.precision;
    this.scope_['geom']['lat'] = Math.round(coordinates[1] * this.precision) / this.precision;

    this.formatLatLon_();

    if (opt_disable) {
      this.setMapEnabled_(false);
    }

    os.ui.apply(this.scope_);
  }
};


/**
 * Handle map enabled scope event.
 *
 * @param {angular.Scope.Event} event The Angular event
 * @param {boolean=} opt_value If map clicks should be disabled
 * @param {string=} opt_name The position control name
 * @private
 */
os.ui.geo.PositionCtrl.prototype.onMapEnabled_ = function(event, opt_value, opt_name) {
  if (event.targetScope !== this.scope_) {
    // only handle if fired by another scope
    if (opt_name != null && opt_value != null && opt_name === this.scope_['name']) {
      // and everything is defined + we're the target
      this.setMapEnabled_(opt_value);
    }
  }
};


/**
 * Handles if map clicks are propagated down to the location form.
 *
 * @param {boolean} value If the map should be used for location clicks.
 * @private
 */
os.ui.geo.PositionCtrl.prototype.setMapEnabled_ = function(value) {
  if (this['mapEnabled'] !== value) {
    this['mapEnabled'] = value;

    if (this.mapListener_) {
      this.mapListener_();
      this.mapListener_ = null;
    }

    if (this['mapEnabled']) {
      this.mapListener_ = this.scope_.$on(os.ui.geo.PositionEventType.MAP_CLICK, this.onMapClick_.bind(this));
    }

    this.scope_.$emit(os.ui.geo.PositionEventType.MAP_ENABLED, this['mapEnabled'], this.scope_['name']);
    os.ui.apply(this.scope_);
  }
};

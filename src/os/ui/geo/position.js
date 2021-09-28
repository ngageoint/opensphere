goog.declareModuleId('os.ui.geo.PositionUI');

import '../popover/popover.js';
import './geoui.js';
import {EPSILON, parseLatLon} from '../../geo/geo.js';
import {ROOT} from '../../os.js';
import Module from '../module.js';
import {apply} from '../ui.js';
import mgrs from './mgrs.js';
import PositionEventType from './positioneventtype.js';


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
 * the location from a map. Clicking the button will $emit a {@link PositionEventType.MAP_ENABLED} event
 * with the current state of the button. When the control is activated, the position controller will listen for
 * {@link os.ui.geo.PositionEventType.MAP_CLICK} events to be $broadcast on the scope. These events should be fired
 * with a coordinate array in [lon, lat] format. The geom object will be updated with the coordinate.
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  templateUrl: ROOT + 'views/geo/position.html',
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
  controller: Controller,
  controllerAs: 'posCtrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'position';

/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller function for the locationedit directive
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
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
    this.precision = Math.pow(10, Controller.DEFAULT_COORD_PRECISION);

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

    $scope.$on(PositionEventType.MAP_ENABLED, this.onMapEnabled_.bind(this));

    $scope.$on('resetForm', function(opt_name) {
      if (opt_name === undefined || opt_name == this.scope_['name']) {
        this.setMapEnabled_(false);
      }
    }.bind(this));
    $scope.$on('$destroy', this.destroy_.bind(this));
  }

  /**
   * Clean up.
   *
   * @private
   */
  destroy_() {
    if (this.mapListener_) {
      this.mapListener_();
      this.mapListener_ = null;
    }

    this.scope_ = null;
  }

  /**
   * Handle position text change.
   *
   * @private
   */
  onPosText_() {
    const text = this.scope_['posText'];
    if (text) {
      var result = parseLatLon(text, this.scope_['order']);
      if (result != null && Math.abs(result.lat) > 90) {
        // If the result isnt in range, set it to null to invalidate form
        result = null;
      }
      if (result == null) {
        try {
          const coord = mgrs(text);
          if (coord) {
            result = /** @type {!osx.geo.Location} */ ({
              lon: coord[0],
              lat: coord[1]
            });
          }
        } catch (e) {
        }
      }

      if (result != null) {
        this.scope_['geom']['lat'] = result.lat;
        this.scope_['geom']['lon'] = result.lon;
      }
    }
  }

  /**
   * Handle position change.
   *
   * @private
   */
  onCoord_() {
    if (!isNaN(this.scope_['geom']['lat']) && !isNaN(this.scope_['geom']['lon'])) {
      if (this.scope_['posText']) {
        var result = parseLatLon(this.scope_['posText'], this.scope_['order']);
        if (result != null) {
          if (Math.abs(result.lat - this.scope_['geom']['lat']) > EPSILON ||
              Math.abs(result.lon - this.scope_['geom']['lon']) > EPSILON) {
            this.formatLatLon_();
          }
        }
      } else {
        this.formatLatLon_();
      }
    } else {
      this.scope_['posText'] = '';
    }
  }

  /**
   * Correctly format coordinates.
   *
   * @private
   */
  formatLatLon_() {
    var lat = this.scope_['geom']['lat'];
    var lon = this.scope_['geom']['lon'];
    var latHemisphere = lat >= 0 ? 'N ' : 'S ';
    var lonHemisphere = lon >= 0 ? 'E' : 'W';
    var coordsFormatted = '' + Math.abs(lat) + latHemisphere + Math.abs(lon) + lonHemisphere;
    this.scope_['posText'] = coordsFormatted;
  }

  /**
   * Toggles listening for map click events via the UI, propagating an event upward.
   *
   * @export
   */
  toggleMapEnabled() {
    this.setMapEnabled_(!this['mapEnabled']);
  }

  /**
   * Update the location from a map click.
   *
   * @param {angular.Scope.Event} event The Angular event
   * @param {Array.<number>} coordinates The coordinates as [lon, lat]
   * @param {boolean=} opt_disable If map clicks should be disabled
   * @private
   */
  onMapClick_(event, coordinates, opt_disable) {
    if (!this.scope_['disabled'] && coordinates && coordinates.length > 1) {
      this.scope_['geom']['lon'] = Math.round(coordinates[0] * this.precision) / this.precision;
      this.scope_['geom']['lat'] = Math.round(coordinates[1] * this.precision) / this.precision;

      this.formatLatLon_();

      if (opt_disable) {
        this.setMapEnabled_(false);
      }

      apply(this.scope_);
    }
  }

  /**
   * Handle map enabled scope event.
   *
   * @param {angular.Scope.Event} event The Angular event
   * @param {boolean=} opt_value If map clicks should be disabled
   * @param {string=} opt_name The position control name
   * @private
   */
  onMapEnabled_(event, opt_value, opt_name) {
    if (event.targetScope !== this.scope_) {
      // only handle if fired by another scope
      if (opt_name != null && opt_value != null && opt_name === this.scope_['name']) {
        // and everything is defined + we're the target
        this.setMapEnabled_(opt_value);
      }
    }
  }

  /**
   * Handles if map clicks are propagated down to the location form.
   *
   * @param {boolean} value If the map should be used for location clicks.
   * @private
   */
  setMapEnabled_(value) {
    if (this['mapEnabled'] !== value) {
      this['mapEnabled'] = value;

      if (this.mapListener_) {
        this.mapListener_();
        this.mapListener_ = null;
      }

      if (this['mapEnabled']) {
        this.mapListener_ = this.scope_.$on(PositionEventType.MAP_CLICK, this.onMapClick_.bind(this));
      }

      this.scope_.$emit(PositionEventType.MAP_ENABLED, this['mapEnabled'], this.scope_['name']);
      apply(this.scope_);
    }
  }
}

/**
 * The maximum allowed coordinate precision. This allows millimeter precision while avoiding scientific notation when
 * converting to a string.
 * @type {number}
 * @const
 */
Controller.DEFAULT_COORD_PRECISION = 8;

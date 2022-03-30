goog.declareModuleId('os.ui.query.area.UserAreaUI');

import {remove} from 'ol/src/array.js';
import {getArea} from 'ol/src/extent.js';
import Feature from 'ol/src/Feature.js';
import GeometryType from 'ol/src/geom/GeometryType.js';
import Point from 'ol/src/geom/Point.js';
import {fromExtent} from 'ol/src/geom/Polygon.js';
import {getUid} from 'ol/src/util.js';

import '../../geo/position.js';
import '../../util/validationmessage.js';
import Settings from '../../../config/settings.js';
import RecordField from '../../../data/recordfield.js';
import EventType from '../../../events/eventtype.js';
import {getFunctionalExtent} from '../../../extent.js';
import {filterFalsey} from '../../../fn/fn.js';
import {PREFER_LON_FIRST, isRectangular, parseLatLon} from '../../../geo/geo.js';
import {normalizeLongitude} from '../../../geo/geo2.js';
import {buffer, validate} from '../../../geo/jsts.js';
import GeometryField from '../../../geom/geometryfield.js';
import * as interpolate from '../../../interpolate.js';
import Method from '../../../interpolatemethod.js';
import {getIMapContainer} from '../../../map/mapinstance.js';
import {convertUnits} from '../../../math/math.js';
import Units from '../../../math/units.js';
import {ROOT} from '../../../os.js';
import {PREVIEW_CONFIG} from '../../../style/style.js';
import Module from '../../module.js';
import {apply} from '../../ui.js';
import {close} from '../../window.js';
import WindowEventType from '../../windoweventtype.js';

const Disposable = goog.require('goog.Disposable');
const {equals} = goog.require('goog.array');
const Delay = goog.require('goog.async.Delay');
const dispose = goog.require('goog.dispose');
const {getDocument} = goog.require('goog.dom');
const KeyCodes = goog.require('goog.events.KeyCodes');
const KeyEvent = goog.require('goog.events.KeyEvent');
const KeyHandler = goog.require('goog.events.KeyHandler');

/**
 * Supported area input types.
 * @enum {string}
 */
const AreaType = {
  BBOX: 'bbox',
  CIRCLE: 'circle',
  POLYGON: 'polygon'
};

/**
 * UI details for each area type.
 * @type {Object}
 */
const AreaTypeDetails = {
  'bbox': {
    'name': 'Bounding Box',
    'icon': 'fa-square-o',
    'tooltip': 'Define an area by bounding box corners.'
  },
  'circle': {
    'name': 'Circle',
    'icon': 'fa-circle-o',
    'tooltip': 'Define an area by center point and radius.'
  },
  'polygon': {
    'name': 'Polygon',
    'icon': 'fa-star-o',
    'tooltip': 'Define an area from a list of coordinates.'
  }
};

/**
 * Directive to enter a user-defined area.
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: true,
  templateUrl: ROOT + 'views/query/area/userarea.html',
  controller: Controller,
  controllerAs: 'ctrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'userarea';

/**
 * Add the directive to the Angular module.
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for the userarea directive.
 * @unrestricted
 */
export class Controller extends Disposable {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope The Angular scope.
   * @param {!angular.JQLite} $element The root DOM element.
   * @param {!angular.$timeout} $timeout The Angular $timeout service.
   * @ngInject
   */
  constructor($scope, $element, $timeout) {
    super();

    /**
     * The Angular scope.
     * @type {angular.Scope|undefined}
     * @protected
     */
    this.scope = $scope;

    /**
     * The root DOM element.
     * @type {angular.JQLite|undefined}
     * @protected
     */
    this.element = $element;

    /**
     * Area passed to the form to be edited.
     * @type {Feature|undefined}
     * @protected
     */
    this.editArea = /** @type {Feature|undefined} */ ($scope['area']);

    /**
     * Handle keyboard events.
     * @type {KeyHandler|undefined}
     * @protected
     */
    this.keyHandler = new KeyHandler(getDocument());
    this.keyHandler.listen(KeyEvent.EventType.KEY, this.handleKeyEvent, false, this);

    /**
     * Delay to update the area from the form.
     * @type {Delay|undefined}
     * @protected
     */
    this.updateDelay = new Delay(this.onUpdateDelay, 250, this);

    /**
     * @type {Feature|undefined}
     */
    this['area'] = undefined;

    /**
     * The input area type.
     * @type {string}
     */
    this['areaType'] = AreaType.BBOX;

    /**
     * The allowed input area types.
     * @type {!Array<string>}
     */
    this['areaTypes'] = this.scope['areaTypes'] || Object.values(AreaType);

    /**
     * @type {string}
     */
    this['name'] = this.editArea && this.editArea.get('title') || 'New Area';

    /**
     * Only allow editing bounding boxes. We should eventually provide draw/edit controls for all geometries, but we
     * don't have that capability yet.
     * @type {boolean}
     */
    this['canEditGeometry'] = true;

    /**
     * @type {string}
     */
    this['errorMsg'] = '';

    /**
     * If coordinates should be parsed with longitude first.
     * @type {boolean}
     */
    this['lonFirst'] = false;

    /**
     * The preferred coordinate order.
     * @type {number|undefined}
     */
    this['coordOrder'] = undefined;

    /**
     * @type {osx.geo.Location}
     */
    this['corner1'] = {};

    /**
     * @type {osx.geo.Location}
     */
    this['corner2'] = {};

    /**
     * @type {string}
     */
    this['coordinates'] = '';

    /**
     * @type {osx.geo.Location}
     */
    this['center'] = {};

    /**
     * @type {number|undefined}
     */
    this['radius'] = undefined;

    /**
     * Radius units.
     * @type {string}
     */
    this['radiusUnits'] = Units.KILOMETERS;

    /**
     * Supported radius units.
     * @type {!Array<!Units>}
     */
    this['units'] = [
      Units.NAUTICAL_MILES,
      Units.MILES,
      Units.KILOMETERS,
      Units.METERS
    ];

    /**
     * Flag for whether the box should be reversed. We prefer the shorter path by default, this sets the longer path.
     * @type {boolean}
     */
    this['reverseBox'] = false;

    /**
     * @type {string}
     */
    this['reverseHelp'] = `Reverse the horizontal direction of your box, causing it to take the longer path between
        your defined corners instead of the shorter one.`;

    /**
     * @type {string}
     */
    this['customPopoverContent'] = `Enter coordinates with spaces between latitude/longitude and commas separating
        coordinate pairs or MGRS values. The polygon will be validated/closed if necessary.<br><br>
        Takes DD, DMS, DDM or MGRS. If Lat/Lon, the first coordinate is assumed to
        be latitude unless it is zero-padded (0683000.55 or 058.135), three-digits (105&deg;30'10.1&quot; or
        105.3), or contains the direction (68 30 12 W or 105 E).`;

    /**
     * The number of polygon coordinates that could not be parsed.
     * @type {number}
     */
    this['numInvalidCoords'] = 0;

    if (this.editArea) {
      // remove unsupported edit types
      remove(this['areaTypes'], AreaType.CIRCLE);

      // prepopulate the form from the provided area
      var geometry = this.editArea.getGeometry();
      if (geometry) {
        geometry = geometry.clone();
        geometry.toLonLat();

        var extent = geometry.getExtent();
        var type = geometry.getType();
        if (type == GeometryType.POLYGON) {
          var coords = /** @type {!Polygon} */ (geometry).getCoordinates();
          if (coords && coords.length == 1) {
            this['canEditGeometry'] = true;

            if (isRectangular(coords[0], extent)) {
              this['areaType'] = AreaType.BBOX;
            } else {
              this['areaType'] = AreaType.POLYGON;
            }

            // prepopulate bbox fields
            this['corner1']['lon'] = this.toFixed(extent[0]);
            this['corner1']['lat'] = this.toFixed(extent[1]);
            this['corner2']['lon'] = this.toFixed(extent[2]);
            this['corner2']['lat'] = this.toFixed(extent[3]);

            // prepopulate polygon field
            this['coordinates'] = coords[0].map(function(c) {
              return this.toFixed(c[1]) + ' ' + this.toFixed(c[0]);
            }, this).join(',');
          } else {
            this['canEditGeometry'] = false;
          }
        } else {
          this['canEditGeometry'] = false;
        }
      }
    }

    this.updateArea();

    $scope.$watch('ctrl.areaType', this.updateArea.bind(this));
    $scope.$watch('ctrl.corner1.lon', this.updateArea.bind(this));
    $scope.$watch('ctrl.corner1.lat', this.updateArea.bind(this));
    $scope.$watch('ctrl.corner2.lon', this.updateArea.bind(this));
    $scope.$watch('ctrl.corner2.lat', this.updateArea.bind(this));
    $scope.$watch('ctrl.center.lon', this.updateArea.bind(this));
    $scope.$watch('ctrl.center.lat', this.updateArea.bind(this));

    Settings.getInstance().listen(interpolate.SettingsKey.INTERPOLATION, this.updateArea, false, this);

    $scope.$on('$destroy', this.dispose.bind(this));

    // trigger window auto height after the DOM is rendered
    $timeout(function() {
      $scope.$emit(WindowEventType.READY);
    });
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    Settings.getInstance().unlisten(interpolate.SettingsKey.INTERPOLATION, this.updateArea, false, this);

    this.setArea(undefined);

    dispose(this.keyHandler);
    this.keyHandler = undefined;

    dispose(this.updateDelay);
    this.updateDelay = undefined;

    this.element = undefined;
    this.scope = undefined;
  }

  /**
   * Fire the cancel callback and close the window.
   *
   * @export
   */
  cancel() {
    if (this.scope && this.scope['cancel']) {
      this.scope['cancel'](EventType.CANCEL);
    }

    this.close();
  }

  /**
   * Fire the confirmation callback and close the window.
   *
   * @export
   */
  confirm() {
    if (this.scope && this.scope['confirm'] && this['area']) {
      var area = this.editArea;
      if (area) {
        // update the area passed to the controller
        var clone = this['area'].getGeometry().clone();
        area.setGeometry(clone);
        area.set(interpolate.ORIGINAL_GEOM_FIELD, clone, true);
        area.set('title', this['name'], true);

        var interpolationMethod = this['area'].get(interpolate.METHOD_FIELD);
        area.set(interpolate.METHOD_FIELD, interpolationMethod, true);
      } else {
        // new area
        area = /** @type {!Feature} */ (this['area']);
        area.set('title', this['name'], true);
        area.unset(RecordField.DRAWING_LAYER_NODE, true);
      }

      this.scope['confirm'](area);
    }

    this.close();
  }

  /**
   * Close the window.
   *
   * @protected
   */
  close() {
    if (this.element) {
      close(this.element);
    }
  }

  /**
   * Handles key events
   *
   * @param {KeyEvent} event
   * @protected
   */
  handleKeyEvent(event) {
    if (event.keyCode == KeyCodes.ESC) {
      this.cancel();
    }
  }

  /**
   * Get the user-facing name for an area type.
   *
   * @param {string} type The area type.
   * @return {string} The user-facing name for the area type.
   * @export
   */
  getAreaTypeName(type) {
    var typeDetails = AreaTypeDetails[type];
    if (typeDetails && typeDetails['name']) {
      return typeDetails['name'];
    }

    return 'Unspecified Type';
  }

  /**
   * Get the user-facing name for an area type.
   *
   * @param {string} type The area type.
   * @return {string} The user-facing name for the area type.
   * @export
   */
  getAreaTypeIcon(type) {
    var typeDetails = AreaTypeDetails[type];
    if (typeDetails && typeDetails['icon']) {
      return typeDetails['icon'];
    }

    return 'fa-calculator';
  }

  /**
   * Get the user-facing tooltip for an area type.
   *
   * @param {string} type The area type.
   * @return {string} The user-facing tooltip for the area type.
   * @export
   */
  getAreaTypeTooltip(type) {
    var typeDetails = AreaTypeDetails[type];
    if (typeDetails && typeDetails['tooltip']) {
      return typeDetails['tooltip'];
    }

    return 'Enter coordinates to define an area.';
  }

  /**
   * Set the current area for the form.
   *
   * @param {Feature|undefined} area The area.
   * @protected
   */
  setArea(area) {
    var mapContainer = getIMapContainer();

    if (this['area']) {
      // remove the existing preview
      mapContainer.removeFeature(this['area']);
    }

    this['area'] = area;

    if (area) {
      // display and fly to a preview of the area
      var geometry = area.getGeometry();

      if (geometry) {
        mapContainer.addFeature(area, PREVIEW_CONFIG);

        var extent = this['reverseBox'] ? geometry.getExtent() : getFunctionalExtent(geometry);
        mapContainer.flyToExtent(extent, 1.5);
      }
    }
  }

  /**
   * Update the name on the area.
   *
   * @export
   */
  onLonFirstChange() {
    this['coordOrder'] = this['lonFirst'] ? PREFER_LON_FIRST : undefined;
    this.updateArea();
  }

  /**
   * Update the area from the form.
   *
   * @export
   */
  updateArea() {
    if (this.updateDelay) {
      this.updateDelay.start();
    }
  }

  /**
   * Update the area from the form.
   *
   * @protected
   */
  onUpdateDelay() {
    if (!this.isDisposed()) {
      var area;
      var geometry;

      // only create the area if the area form is valid
      if (this.scope['areaForm']['$valid']) {
        var conf = interpolate.getConfig();
        var interpolationMethod = conf['method'];

        switch (this['areaType']) {
          case AreaType.BBOX:
            geometry = this.getBbox();
            interpolationMethod = Method.RHUMB;
            break;
          case AreaType.CIRCLE:
            geometry = this.getCircle();
            interpolationMethod = Method.NONE;
            break;
          case AreaType.POLYGON:
            geometry = this.getPolygon();
            break;
          default:
            break;
        }

        if (geometry) {
          area = new Feature(geometry);
          area.set(RecordField.DRAWING_LAYER_NODE, false, true);
          area.set(interpolate.METHOD_FIELD, interpolationMethod, true);
          area.set('title', this['name'], true);
          area.setId(getUid(geometry));
          geometry.osTransform();
        }
      }

      this.setArea(area);
      apply(this.scope);
    }
  }

  /**
   * Create an extend from bounding box coordinates.
   *
   * @return {Array<number>|undefined}
   * @protected
   */
  getExtent() {
    var extent;
    var lon1 = this['corner1']['lon'];
    var lat1 = this['corner1']['lat'];
    var lon2 = this['corner2']['lon'];
    var lat2 = this['corner2']['lat'];

    if (lon1 != null && lat1 != null && lon2 != null && lat2 != null) {
      // correct the order so our extent is [minX, minY, maxX, maxY]
      extent = [
        lon1 < lon2 ? lon1 : lon2,
        lat1 < lat2 ? lat1 : lat2,
        lon2 > lon1 ? lon2 : lon1,
        lat2 > lat1 ? lat2 : lat1
      ];
    }

    return extent;
  }

  /**
   * Update the geometry from bounding box fields.
   *
   * @return {Geometry|undefined}
   * @protected
   */
  getBbox() {
    if (this['canEditGeometry'] || !this.scope['geometry']) {
      var extent = this.getExtent();

      if (extent && getArea(extent) > 1E-6) {
        var minX = extent[0];
        var minY = extent[1];
        var maxX = extent[2];
        var maxY = extent[3];
        var maxXNormalizedRight = normalizeLongitude(maxX, minX, minX + 360);
        var maxXNormalizedLeft = normalizeLongitude(maxX, minX, minX - 360);
        var geometry;

        if (this['reverseBox']) {
          // create the geometry in the opposite direction from the extent
          maxX = Math.abs(maxX - minX) < 180 ? maxXNormalizedLeft : maxXNormalizedRight;

          // construct the polygon coordinates with the center points included to force wrapping the intended direction
          var middleLon = (minX + maxX) / 2;
          var coords = [
            [minX, minY],
            [minX, maxY],
            [middleLon, maxY],
            [maxX, maxY],
            [maxX, minY],
            [middleLon, minY],
            [minX, minY]
          ];

          geometry = new Polygon([coords]);
          geometry.set(GeometryField.NORMALIZED, true);

          // perform the rhumb interpolation
          interpolate.beginTempInterpolation(undefined, Method.RHUMB);
          interpolate.interpolateGeom(geometry);
          interpolate.endTempInterpolation();
        } else {
          // create the shortest path geometry, but still normalize it in case it crosses the antimeridian
          // we only want a true rectangular polygon here as interpolating it adds unnecessary complexity
          maxX = Math.abs(maxX - minX) > 180 ? maxXNormalizedLeft : maxXNormalizedRight;
          geometry = fromExtent([minX, minY, maxX, maxY]);
        }
      }
    } else {
      // editing was disabled, so send the original geometry
      geometry = /** @type {Geometry|undefined} */ (this.scope['geometry']);
    }

    return geometry;
  }

  /**
   * Update the geometry from circle fields.
   *
   * @return {Geometry|undefined}
   * @protected
   */
  getCircle() {
    var center = [this['center']['lon'], this['center']['lat']];
    var point = new Point(center);
    var radius = convertUnits(this['radius'], Units.METERS, this['radiusUnits']);
    return buffer(point, radius, true);
  }

  /**
   * Update the geometry from polygon fields.
   *
   * @return {Geometry|undefined}
   * @protected
   */
  getPolygon() {
    var geometry;

    this['numInvalidCoords'] = 0;

    if (this['coordinates']) {
      var coords = this['coordinates'].split(',').map(function(str) {
        try {
          str = str.trim();

          var result = parseLatLon(str, this['coordOrder']);
          if (result && Math.abs(result.lat) > 90) {
            result = undefined;
          }

          if (!result) {
            result = osasm.toLonLat(str);
          } else {
            result = [result.lon, result.lat];
          }
        } catch (e) {
          result = undefined;
        }

        if (!result) {
          this['numInvalidCoords']++;
        }

        return result;
      }, this).filter(filterFalsey);

      if (coords.length > 2) {
        if (!equals(coords[0], coords[coords.length - 1])) {
          coords.push(coords[0]);
        }

        if (coords.length > 3) {
          geometry = new Polygon([coords]);

          // fix any topology errors in the polygon. if it still isn't valid (same geometry returned), drop it.
          var validGeometry = validate(geometry, true);
          if (validGeometry !== geometry) {
            geometry = validGeometry;
          } else {
            geometry = undefined;
          }
        }
      }
    }

    return geometry;
  }

  /**
   * Convert a coordinate to fixed decimal notation and strip trailing 0's. This prevents exponential notation, which
   * will break the position parser.
   *
   * @param {number} coord The coordinate.
   * @return {string} The coordinate, for display in the UI.
   * @protected
   */
  toFixed(coord) {
    return coord.toFixed(14).replace(/\.?0+$/, '');
  }
}

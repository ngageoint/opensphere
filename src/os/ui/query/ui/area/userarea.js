goog.provide('os.ui.query.ui.area.UserAreaCtrl');
goog.provide('os.ui.query.ui.area.userAreaDirective');

goog.require('goog.Disposable');
goog.require('goog.Promise');
goog.require('goog.async.Delay');
goog.require('goog.dom');
goog.require('goog.events.KeyHandler');
goog.require('ol.Feature');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('os.events.EventType');
goog.require('os.geo.jsts');
goog.require('os.interpolate');
goog.require('os.map');
goog.require('os.style');
goog.require('os.ui.Module');
goog.require('os.ui.action.ActionEvent');
goog.require('os.ui.action.EventType');
goog.require('os.ui.geo.positionDirective');
goog.require('os.ui.window');


/**
 * Supported area input types.
 * @enum {string}
 */
os.ui.query.ui.area.AreaType = {
  BBOX: 'bbox',
  CIRCLE: 'circle',
  POLYGON: 'polygon'
};


/**
 * UI details for each area type.
 * @type {Object}
 */
os.ui.query.ui.area.AreaTypeDetails = {
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
 * @return {angular.Directive}
 */
os.ui.query.ui.area.userAreaDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: true,
    templateUrl: os.ROOT + 'views/query/area/userarea.html',
    controller: os.ui.query.ui.area.UserAreaCtrl,
    controllerAs: 'ctrl'
  };
};


/**
 * Add the directive to the Angular module.
 */
os.ui.Module.directive('userarea', [os.ui.query.ui.area.userAreaDirective]);


/**
 * Controller for the userarea directive.
 * @param {!angular.Scope} $scope The Angular scope.
 * @param {!angular.JQLite} $element The root DOM element.
 * @param {!angular.$timeout} $timeout The Angular $timeout service.
 * @extends {goog.Disposable}
 * @constructor
 * @ngInject
 */
os.ui.query.ui.area.UserAreaCtrl = function($scope, $element, $timeout) {
  os.ui.query.ui.area.UserAreaCtrl.base(this, 'constructor');

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
   * @type {ol.Feature|undefined}
   * @protected
   */
  this.editArea = /** @type {ol.Feature|undefined} */ ($scope['area']);

  /**
   * Handle keyboard events.
   * @type {goog.events.KeyHandler|undefined}
   * @protected
   */
  this.keyHandler = new goog.events.KeyHandler(goog.dom.getDocument());
  this.keyHandler.listen(goog.events.KeyHandler.EventType.KEY, this.handleKeyEvent, false, this);

  /**
   * Delay to update the area from the form.
   * @type {goog.async.Delay|undefined}
   * @protected
   */
  this.updateDelay = new goog.async.Delay(this.onUpdateDelay, 250, this);

  /**
   * @type {ol.Feature|undefined}
   */
  this['area'] = undefined;

  /**
   * The input area type.
   * @type {string}
   */
  this['areaType'] = os.ui.query.ui.area.AreaType.BBOX;

  /**
   * The allowed input area types.
   * @type {!Array<string>}
   */
  this['areaTypes'] = this.scope['areaTypes'] || goog.object.getValues(os.ui.query.ui.area.AreaType);

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
   * @type {os.math.Unit}
   */
  this['radiusUnits'] = os.math.Units.KILOMETERS;

  /**
   * Supported radius units.
   * @type {!Array<!os.math.Units>}
   */
  this['units'] = [
    os.math.Units.NAUTICAL_MILES,
    os.math.Units.MILES,
    os.math.Units.KILOMETERS,
    os.math.Units.METERS
  ];

  /**
   * @type {string}
   */
  this['customPopoverContent'] = 'Enter coordinates with spaces between latitude/longitude and commas separating ' +
      'coordinate pairs or MGRS values. The polygon will be validated/closed if necessary.<br><br>' +
      'Takes DMS, Decimal Degrees, or MGRS. If Lat/Lon, the first coordinate is assumed to ' +
      'be latitude unless it is zero-padded (0683000.55 or 058.135), three-digits (105&deg;30\'10.1&quot; or ' +
      '105.3), or contains the direction (68 30 12 W or 105 E).';

  /**
   * The number of polygon coordinates that could not be parsed.
   * @type {number}
   */
  this['numInvalidCoords'] = 0;

  if (this.editArea) {
    // remove unsupported edit types
    goog.array.remove(this['areaTypes'], os.ui.query.ui.area.AreaType.CIRCLE);

    // prepopulate the form from the provided area
    var geometry = this.editArea.getGeometry();
    if (geometry) {
      geometry = geometry.clone();
      geometry.toLonLat();

      var extent = geometry.getExtent();
      var type = geometry.getType();
      if (type == ol.geom.GeometryType.POLYGON) {
        var coords = /** @type {!ol.geom.Polygon} */ (geometry).getCoordinates();
        if (coords && coords.length == 1) {
          this['canEditGeometry'] = true;

          if (os.geo.isRectangular(coords[0], extent)) {
            this['areaType'] = os.ui.query.ui.area.AreaType.BBOX;
          } else {
            this['areaType'] = os.ui.query.ui.area.AreaType.POLYGON;
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

  os.settings.listen(os.interpolate.SettingsKey.INTERPOLATION, this.updateArea, false, this);

  $scope.$on('$destroy', this.dispose.bind(this));

  // trigger window auto height after the DOM is rendered
  $timeout(function() {
    $scope.$emit(os.ui.WindowEventType.READY);
  });
};
goog.inherits(os.ui.query.ui.area.UserAreaCtrl, goog.Disposable);


/**
 * @inheritDoc
 */
os.ui.query.ui.area.UserAreaCtrl.prototype.disposeInternal = function() {
  os.ui.query.ui.area.UserAreaCtrl.base(this, 'disposeInternal');

  os.settings.unlisten(os.interpolate.SettingsKey.INTERPOLATION, this.updateArea, false, this);

  this.setArea(undefined);

  goog.dispose(this.keyHandler);
  this.keyHandler = undefined;

  goog.dispose(this.updateDelay);
  this.updateDelay = undefined;

  this.element = undefined;
  this.scope = undefined;
};


/**
 * Fire the cancel callback and close the window.
 */
os.ui.query.ui.area.UserAreaCtrl.prototype.cancel = function() {
  if (this.scope && this.scope['cancel']) {
    this.scope['cancel'](os.events.EventType.CANCEL);
  }

  this.close();
};
goog.exportProperty(
    os.ui.query.ui.area.UserAreaCtrl.prototype,
    'cancel',
    os.ui.query.ui.area.UserAreaCtrl.prototype.cancel);


/**
 * Fire the confirmation callback and close the window.
 */
os.ui.query.ui.area.UserAreaCtrl.prototype.confirm = function() {
  if (this.scope && this.scope['confirm'] && this['area']) {
    var area = this.editArea;
    if (area) {
      // update the area passed to the controller
      var clone = this['area'].getGeometry().clone();
      area.setGeometry(clone);
      area.set(os.interpolate.ORIGINAL_GEOM_FIELD, clone, true);
      area.set('title', this['name'], true);

      var interpolationMethod = this['area'].get(os.interpolate.METHOD_FIELD);
      area.set(os.interpolate.METHOD_FIELD, interpolationMethod, true);
    } else {
      // new area
      area = /** @type {!ol.Feature} */ (this['area']);
      area.set('title', this['name'], true);
      area.unset(os.data.RecordField.DRAWING_LAYER_NODE, true);
    }

    this.scope['confirm'](area);
  }

  this.close();
};
goog.exportProperty(
    os.ui.query.ui.area.UserAreaCtrl.prototype,
    'confirm',
    os.ui.query.ui.area.UserAreaCtrl.prototype.confirm);


/**
 * Close the window.
 * @protected
 */
os.ui.query.ui.area.UserAreaCtrl.prototype.close = function() {
  if (this.element) {
    os.ui.window.close(this.element);
  }
};


/**
 * Handles key events
 * @param {goog.events.KeyEvent} event
 * @protected
 */
os.ui.query.ui.area.UserAreaCtrl.prototype.handleKeyEvent = function(event) {
  if (event.keyCode == goog.events.KeyCodes.ESC) {
    this.cancel();
  }
};


/**
 * Get the user-facing name for an area type.
 * @param {string} type The area type.
 * @return {string} The user-facing name for the area type.
 */
os.ui.query.ui.area.UserAreaCtrl.prototype.getAreaTypeName = function(type) {
  var typeDetails = os.ui.query.ui.area.AreaTypeDetails[type];
  if (typeDetails && typeDetails['name']) {
    return typeDetails['name'];
  }

  return 'Unspecified Type';
};
goog.exportProperty(
    os.ui.query.ui.area.UserAreaCtrl.prototype,
    'getAreaTypeName',
    os.ui.query.ui.area.UserAreaCtrl.prototype.getAreaTypeName);


/**
 * Get the user-facing name for an area type.
 * @param {string} type The area type.
 * @return {string} The user-facing name for the area type.
 */
os.ui.query.ui.area.UserAreaCtrl.prototype.getAreaTypeIcon = function(type) {
  var typeDetails = os.ui.query.ui.area.AreaTypeDetails[type];
  if (typeDetails && typeDetails['icon']) {
    return typeDetails['icon'];
  }

  return 'fa-calculator';
};
goog.exportProperty(
    os.ui.query.ui.area.UserAreaCtrl.prototype,
    'getAreaTypeIcon',
    os.ui.query.ui.area.UserAreaCtrl.prototype.getAreaTypeIcon);


/**
 * Get the user-facing tooltip for an area type.
 * @param {string} type The area type.
 * @return {string} The user-facing tooltip for the area type.
 */
os.ui.query.ui.area.UserAreaCtrl.prototype.getAreaTypeTooltip = function(type) {
  var typeDetails = os.ui.query.ui.area.AreaTypeDetails[type];
  if (typeDetails && typeDetails['tooltip']) {
    return typeDetails['tooltip'];
  }

  return 'Enter coordinates to define an area.';
};
goog.exportProperty(
    os.ui.query.ui.area.UserAreaCtrl.prototype,
    'getAreaTypeTooltip',
    os.ui.query.ui.area.UserAreaCtrl.prototype.getAreaTypeTooltip);


/**
 * Set the current area for the form.
 * @param {ol.Feature|undefined} area The area.
 * @protected
 */
os.ui.query.ui.area.UserAreaCtrl.prototype.setArea = function(area) {
  if (this['area'] && os.map.mapContainer) {
    // remove the existing preview
    os.map.mapContainer.removeFeature(this['area']);
  }

  this['area'] = area;

  if (area && os.map.mapContainer) {
    // display and fly to a preview of the area
    var mapContainer = os.map.mapContainer;
    mapContainer.addFeature(area, os.style.PREVIEW_CONFIG);
    mapContainer.flyToExtent(area.getGeometry().getExtent(), 1.5);
  }
};


/**
 * Update the name on the area.
 */
os.ui.query.ui.area.UserAreaCtrl.prototype.onLonFirstChange = function() {
  this['coordOrder'] = this['lonFirst'] ? os.geo.PREFER_LON_FIRST : undefined;
  this.updateArea();
};
goog.exportProperty(
    os.ui.query.ui.area.UserAreaCtrl.prototype,
    'onLonFirstChange',
    os.ui.query.ui.area.UserAreaCtrl.prototype.onLonFirstChange);


/**
 * Update the area from the form.
 */
os.ui.query.ui.area.UserAreaCtrl.prototype.updateArea = function() {
  if (this.updateDelay) {
    this.updateDelay.start();
  }
};
goog.exportProperty(
    os.ui.query.ui.area.UserAreaCtrl.prototype,
    'updateArea',
    os.ui.query.ui.area.UserAreaCtrl.prototype.updateArea);


/**
 * Update the area from the form.
 * @protected
 */
os.ui.query.ui.area.UserAreaCtrl.prototype.onUpdateDelay = function() {
  if (!this.isDisposed()) {
    var area;
    var geometry;

    // only create the area if the area form is valid
    if (this.scope['areaForm']['$valid']) {
      var conf = os.interpolate.getConfig();
      var interpolationMethod = conf['method'];

      switch (this['areaType']) {
        case os.ui.query.ui.area.AreaType.BBOX:
          geometry = this.getBbox();
          interpolationMethod = os.interpolate.Method.NONE;
          break;
        case os.ui.query.ui.area.AreaType.CIRCLE:
          geometry = this.getCircle();
          interpolationMethod = os.interpolate.Method.NONE;
          break;
        case os.ui.query.ui.area.AreaType.POLYGON:
          geometry = this.getPolygon();
          break;
        default:
          break;
      }

      if (geometry) {
        area = new ol.Feature(geometry);
        area.set(os.data.RecordField.DRAWING_LAYER_NODE, false, true);
        area.set(os.interpolate.METHOD_FIELD, interpolationMethod, true);
        area.set('title', this['name'], true);
        area.setId(ol.getUid(geometry));
        geometry.osTransform();
      }
    }

    this.setArea(area);
    os.ui.apply(this.scope);
  }
};


/**
 * Create an extend from bounding box coordinates.
 * @return {Array<number>|undefined}
 * @protected
 */
os.ui.query.ui.area.UserAreaCtrl.prototype.getExtent = function() {
  var extent;
  if (this['corner1']['lon'] != null && this['corner1']['lat'] != null &&
      this['corner2']['lon'] != null && this['corner2']['lat'] != null) {
    extent = [
      this['corner1']['lon'],
      this['corner1']['lat'],
      this['corner2']['lon'],
      this['corner2']['lat']
    ];
  }

  return extent;
};


/**
 * Update the geometry from bounding box fields.
 * @return {ol.geom.Geometry|undefined}
 * @protected
 */
os.ui.query.ui.area.UserAreaCtrl.prototype.getBbox = function() {
  var geometry;
  if (this['canEditGeometry'] || !this.scope['geometry']) {
    var extent = this.getExtent();
    if (extent) {
      geometry = ol.geom.Polygon.fromExtent(extent);
    }
  } else {
    // editing was disabled, so send the original geometry
    geometry = /** @type {ol.geom.Geometry|undefined} */ (this.scope['geometry']);
  }

  return geometry;
};


/**
 * Update the geometry from circle fields.
 * @return {ol.geom.Geometry|undefined}
 * @protected
 */
os.ui.query.ui.area.UserAreaCtrl.prototype.getCircle = function() {
  var center = [this['center']['lon'], this['center']['lat']];
  var point = new ol.geom.Point(center);
  var radius = os.math.convertUnits(this['radius'], os.math.Units.METERS, this['radiusUnits']);
  return os.geo.jsts.buffer(point, radius, true);
};


/**
 * Update the geometry from polygon fields.
 * @return {ol.geom.Geometry|undefined}
 * @protected
 */
os.ui.query.ui.area.UserAreaCtrl.prototype.getPolygon = function() {
  var geometry;

  this['numInvalidCoords'] = 0;

  if (this['coordinates']) {
    var coords = this['coordinates'].split(',').map(function(str) {
      try {
        str = str.trim();

        var result = os.geo.parseLatLon(str, this['coordOrder']);
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
    }, this).filter(os.fn.filterFalsey);

    if (coords.length > 2) {
      if (!goog.array.equals(coords[0], coords[coords.length - 1])) {
        coords.push(coords[0]);
      }

      if (coords.length > 3) {
        geometry = new ol.geom.Polygon([coords]);

        // fix any topology errors in the polygon. if it still isn't valid (same geometry returned), drop it.
        var validGeometry = os.geo.jsts.validate(geometry, true);
        if (validGeometry !== geometry) {
          geometry = validGeometry;
        } else {
          geometry = undefined;
        }
      }
    }
  }

  return geometry;
};


/**
 * Convert a coordinate to fixed decimal notation and strip trailing 0's. This prevents exponential notation, which
 * will break the position parser.
 * @param {number} coord The coordinate.
 * @return {string} The coordinate, for display in the UI.
 * @protected
 */
os.ui.query.ui.area.UserAreaCtrl.prototype.toFixed = function(coord) {
  return coord.toFixed(14).replace(/\.?0+$/, '');
};


/**
 * Open a UI to get a user-defined area.
 * @param {ol.Feature=} opt_area The area.
 * @param {Array<string>=} opt_areaTypes The allowed area types.
 * @param {boolean=} opt_modal If the window should be modal.
 * @return {!goog.Promise} A promise that resolves to the entered area, or is rejected if the UI is closed.
 */
os.ui.query.ui.area.getUserArea = function(opt_area, opt_areaTypes, opt_modal) {
  return new goog.Promise(function(resolve, reject) {
    var id = opt_area ? opt_area.getId() : undefined;
    var title = 'Enter Area Coordinates';
    var icon = 'fa-calculator';

    if (id) {
      title = os.ui.query.EDIT_WIN_LABEL;
      icon = 'fa-pencil';
    } else if (opt_area) {
      title = 'Save Area';
      icon = 'fa-globe';
    }

    var windowOptions = {
      'x': 'center',
      'y': 'center',
      'label': title,
      'icon': 'fa ' + icon,
      'height': 'auto',
      'width': 500,
      'modal': opt_modal || false,
      'no-scroll': true,
      'show-close': true
    };

    var scopeOptions = {
      'confirm': resolve,
      'cancel': reject,
      'area': opt_area,
      'areaTypes': opt_areaTypes
    };

    os.ui.window.create(windowOptions, '<userarea></userarea>', undefined, undefined, undefined,
        scopeOptions);
  });
};

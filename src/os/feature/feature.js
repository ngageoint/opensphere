goog.declareModuleId('os.feature');

import * as olExtent from 'ol/src/extent.js';
import Feature from 'ol/src/Feature.js';
import GeometryCollection from 'ol/src/geom/GeometryCollection.js';
import GeometryLayout from 'ol/src/geom/GeometryLayout.js';
import LineString from 'ol/src/geom/LineString.js';
import MultiLineString from 'ol/src/geom/MultiLineString.js';
import MultiPolygon from 'ol/src/geom/MultiPolygon.js';
import Point from 'ol/src/geom/Point.js';
import Polygon from 'ol/src/geom/Polygon.js';
import {toLonLat} from 'ol/src/proj.js';
import {VectorSourceEvent} from 'ol/src/source/Vector.js';
import VectorEventType from 'ol/src/source/VectorEventType.js';
import {getUid} from 'ol/src/util.js';

import * as osBearing from '../bearing/bearing.js';
import BearingType from '../bearing/bearingtype.js';
import CommandProcessor from '../command/commandprocessor.js';
import FlyToExtent from '../command/flytoextentcmd.js';
import DataManager from '../data/datamanager.js';
import RecordField from '../data/recordfield.js';
import Fields from '../fields/fields.js';
import * as fields from '../fields/index.js';
import {reduceExtentFromGeometries} from '../fn/fn.js';
import * as geo from '../geo/geo.js';
import * as osGeoJsts from '../geo/jsts.js';
import Ellipse from '../geom/ellipse.js';
import GeometryField from '../geom/geometryfield.js';
import MappingManager from '../im/mapping/mappingmanager.js';
import instanceOf from '../instanceof.js';
import * as interpolate from '../interpolate.js';
import Method from '../interpolatemethod.js';
import LayerId from '../layer/layerid.js';
import * as osMap from '../map/map.js';
import {getIMapContainer} from '../map/mapinstance.js';
import {convertUnits, parseNumber} from '../math/math.js';
import Units from '../math/units.js';
import SourceClass from '../source/sourceclass.js';
import * as osStyle from '../style/style.js';
import StyleField from '../style/stylefield.js';
import {getStyleManager} from '../style/styleinstance.js';
import StyleType from '../style/styletype.js';
import TimelineController from '../time/timelinecontroller.js';
import {quoteString} from '../ui/filter/filterstring.js';

import DynamicFeature from './dynamicfeature.js';

const {defaultCompare} = goog.require('goog.array');
const {containsValue} = goog.require('goog.object');
const reflect = goog.require('goog.reflect');
const {floatAwareCompare} = goog.require('goog.string');

const {default: ISource} = goog.requireType('os.source.ISource');
const {default: VectorSource} = goog.requireType('os.source.Vector');
const {default: ITime} = goog.requireType('os.time.ITime');


/**
 * A function used to sort features.
 * @typedef {function(!Feature, !Feature):number}
 */
export let SortFn;

/**
 * Defines set of options for creating the line of bearing
 * @typedef {{
 *   arrowLength: (number|undefined),
 *   arrowUnits: (string|undefined),
 *   bearingColumn: (string|undefined),
 *   bearingError: (number|undefined),
 *   bearingErrorColumn: (string|undefined),
 *   columnLength: (number|undefined),
 *   length: (number|undefined),
 *   lengthUnits: (string|undefined),
 *   lengthColumn: (string|undefined),
 *   lengthType: (string|undefined),
 *   lengthError: (number|undefined),
 *   lengthErrorUnits: (string|undefined),
 *   lengthErrorColumn: (string|undefined),
 *   showArrow: (boolean|undefined),
 *   showEllipse: (boolean|undefined),
 *   showError: (boolean|undefined)
 * }}
 */
export let LOBOptions;

/**
 * Feature property change events.
 * @enum {string}
 */
export const PropertyChange = {
  COLOR: 'feature:color',
  STYLE: 'feature:style'
};

/**
 * Regular expression to match a title field on a feature.
 * @type {RegExp}
 */
export const TITLE_REGEX = /^(name|title)$/i;

/**
 * @type {function(Array<Feature>)|undefined}
 */
let flyToOverride;

/**
 * Set the flyTo override.
 * @param {function(Array<Feature>)|undefined} value The override.
 */
export const setFlyToOverride = (value) => {
  flyToOverride = value;
};

/**
 * @param {null|undefined|Feature|Array<Feature>} features
 */
export const flyTo = function(features) {
  if (!features) {
    return;
  }

  if (!Array.isArray(features)) {
    features = [features];
  }

  if (flyToOverride) {
    flyToOverride(/** @type {Array<Feature>} */ (features));
  } else {
    var extent = getGeometries(features).reduce(reduceExtentFromGeometries, olExtent.createEmpty());
    var cmd = new FlyToExtent(extent);
    CommandProcessor.getInstance().addCommand(cmd);
  }
};

/**
 * Auto detect and apply column mappings to features.
 *
 * @param {!Array<!Feature>} features The features
 * @param {number=} opt_count Optional count of features for the automap to check, defaulting to 1.
 */
export const autoMap = function(features, opt_count) {
  if (features && features.length > 0) {
    var mm = MappingManager.getInstance();
    var detectFeatures = opt_count !== undefined ? features.slice(0, opt_count) : [features[0]];
    var mappings = mm.autoDetect(detectFeatures);
    mappings.forEach(function(mapping) {
      for (var i = 0; i < features.length; i++) {
        mapping.execute(features[i]);
      }
    });
  }
};

/**
 * Simplify the geometry on a feature. Intended to reduce memory footprint and simplify geometry operations.
 *
 * @param {Feature} feature The feature.
 */
export const simplifyGeometry = function(feature) {
  if (feature) {
    var geom = feature.getGeometry();
    if (geom) {
      var flatGeom = geo.flattenGeometry(geom);
      if (flatGeom != geom) {
        feature.setGeometry(flatGeom);
      }
    }
  }
};

/**
 * Get the semi-major axis for a feature.
 *
 * @param {Feature} feature The feature.
 * @param {Units=} opt_units The desired units. Defaults to nautical miles.
 * @return {number|undefined} The semi-major axis value, or undefined if not found.
 */
export const getSemiMajor = function(feature, opt_units) {
  var value = getEllipseField_(feature,
      fields.DEFAULT_SEMI_MAJ_COL_NAME,
      Fields.SEMI_MAJOR,
      Fields.SEMI_MAJOR_UNITS,
      opt_units);

  // don't return negative values, and treat 0 as undefined
  return value ? Math.abs(value) : undefined;
};

/**
 * Get the semi-minor axis for a feature.
 *
 * @param {Feature} feature The feature.
 * @param {Units=} opt_units The desired units. Defaults to nautical miles.
 * @return {number|undefined} The semi-minor axis value, or undefined if not found.
 */
export const getSemiMinor = function(feature, opt_units) {
  var value = getEllipseField_(feature,
      fields.DEFAULT_SEMI_MIN_COL_NAME,
      Fields.SEMI_MINOR,
      Fields.SEMI_MINOR_UNITS,
      opt_units);

  // don't return negative values, and treat 0 as undefined
  return value ? Math.abs(value) : undefined;
};

/**
 * Get the orientation for a feature, in degrees.
 *
 * @param {Feature} feature The feature.
 * @return {number|undefined} The orientation value, or undefined if not found.
 */
export const getOrientation = function(feature) {
  var orientation = parseNumber(feature.get(Fields.ORIENTATION));
  return !isNaN(orientation) ? orientation : undefined;
};

/**
 * Get the radius for a feature.
 *
 * @param {Feature} feature The feature.
 * @param {Units=} opt_units The desired units. Defaults to nautical miles.
 * @return {number|undefined} The radius axis value, or undefined if not found.
 */
export const getRadius = function(feature, opt_units) {
  var value = getEllipseField_(feature,
      fields.DEFAULT_RADIUS_COL_NAME,
      Fields.RADIUS,
      Fields.RADIUS_UNITS,
      opt_units);

  // don't return negative values, and treat 0 as undefined
  return value ? Math.abs(value) : undefined;
};

/**
 * Get the bearing for a feature, in degrees.
 *
 * @param {Feature} feature The feature.
 * @return {number|undefined} The orientation value, or undefined if not found.
 */
export const getBearing = function(feature) {
  var bearing = parseNumber(feature.get(Fields.BEARING));
  return !isNaN(bearing) ? bearing : undefined;
};

/**
 * Get the semi-major axis for a feature.
 *
 * @param {Feature} feature The feature.
 * @param {string|undefined} nmiField The application mapped field containing the value in nautical miles.
 * @param {string|undefined} defaultField The default field.
 * @param {string|undefined} defaultUnitsField The default units field.
 * @param {Units=} opt_units The desired units. Defaults to nautical miles.
 * @return {number|undefined} The ellipse field value, or undefined if not found.
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
const getEllipseField_ = function(feature, nmiField, defaultField, defaultUnitsField, opt_units) {
  var value = NaN;
  var currentUnits;
  var targetUnits = opt_units || Units.NAUTICAL_MILES;

  if (feature) {
    // try the mapped column first
    if (nmiField && feature.values_) {
      value = parseNumber(feature.values_[nmiField]);
    }

    if (!isNaN(value)) {
      // semi-minor has been mapped to nmi
      currentUnits = Units.NAUTICAL_MILES;
    } else if (defaultField && feature.values_) {
      // semi-minor has not been mapped, so try default field names
      value = parseNumber(feature.values_[defaultField]);

      if (defaultUnitsField && feature.values_) {
        currentUnits = /** @type {string|undefined} */ (feature.values_[defaultUnitsField]);
      }
    }

    if (!isNaN(value)) {
      if (currentUnits && containsValue(Units, currentUnits)) {
        // units known, translate to target units
        value = convertUnits(value, targetUnits, currentUnits);
      } else {
        // take a guess at what the units represent
        value = geo.convertEllipseValue(value);
      }
    }
  }

  // don't return NaN
  return !isNaN(value) ? value : undefined;
};

/**
 * Creates an ellipse from a feature if it has the necessary data.
 *
 * @param {Feature} feature The feature
 * @param {boolean=} opt_replace If an existing ellipse should be replaced
 * @return {Ellipse|undefined} The ellipse, if one could be generated
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
export const createEllipse = function(feature, opt_replace) {
  var ellipse;

  if (!opt_replace && feature.values_) {
    ellipse = /** @type {(Ellipse|undefined)} */ (feature.values_[RecordField.ELLIPSE]);
    if (ellipse instanceof Ellipse) {
      // ellipse already created for this feature
      return ellipse;
    }
  }

  var geom = feature ? feature.getGeometry() : null;
  if (geom instanceof Point) {
    // the feature must have a center point, and either semi-major/semi-minor/orientation OR a radius to generate an
    // ellipse. no values should ever be assumed.
    var center = toLonLat(geom.getFirstCoordinate(), osMap.PROJECTION);
    if (center) {
      var semiMajor = getSemiMajor(feature, Units.METERS);
      var semiMinor = getSemiMinor(feature, Units.METERS);
      var orientation = getOrientation(feature);
      var radius = getRadius(feature, Units.METERS);

      if (semiMajor && semiMinor && orientation != null) {
        ellipse = new Ellipse(center, semiMajor, semiMinor, orientation);
      } else if (radius) {
        ellipse = new Ellipse(center, radius);
      }
    }

    if (ellipse && ellipse.values_ && geom.values_) {
      ellipse.values_[RecordField.ALTITUDE_MODE] = geom.values_[RecordField.ALTITUDE_MODE];
    }
  }

  // if an ellipse couldn't be created, use the original geometry so it's still rendered on the map
  feature.set(RecordField.ELLIPSE, ellipse || geom);

  return ellipse;
};

/**
 * Returns a column value from a feature.
 * If the column is not provided or doesn't exist it will return a default value or NaN
 * If the column exists but is not a number it will return a NaN
 *
 * @param {Feature} feature The feature
 * @param {string=} opt_column column on feature to use
 * @param {number=} opt_default fallback value if column doesn't exist
 * @return {number} some value
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
export const getColumnValue = function(feature, opt_column, opt_default) {
  if (opt_column) {
    if (feature.values_ && feature.values_[opt_column] != null) {
      var val = parseFloat(feature.values_[opt_column]);
      if (val == feature.values_[opt_column]) { // this prevents against a partial conversion ie 7 != '7ate9'
        return val;
      }
    }
    return NaN; // invalid value in column
  }
  return opt_default ? opt_default : NaN; // column doesn't exist
};

/**
 * Creates a line of bearing from a feature if it has the necessary data.
 *
 * @param {Feature} feature The feature
 * @param {boolean=} opt_replace If an existing lob should be replaced
 * @param {LOBOptions=} opt_lobOpts the options for rendering line of bearing
 * @return {LineString|MultiLineString|Geometry|undefined} The lob, if one could be generated
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
export const createLineOfBearing = function(feature, opt_replace, opt_lobOpts) {
  var lob;

  if (!opt_replace && feature.values_) {
    lob = /** @type {(LineString|undefined)} */ (feature.values_[RecordField.LINE_OF_BEARING]);
    if (lob instanceof MultiLineString) { // lob already created for this feature
      return lob;
    }
  }

  var geom = feature ? feature.getGeometry() : null;
  if (opt_lobOpts && geom instanceof Point) {
    // the feature must have a center point and a bearing to generate a lob. no values should ever be assumed.
    var center = toLonLat(geom.getFirstCoordinate(), osMap.PROJECTION);
    var bearing = getColumnValue(feature, opt_lobOpts.bearingColumn);
    var length = opt_lobOpts.lengthType == 'column' ? // get from column unless manual
      getColumnValue(feature, opt_lobOpts.lengthColumn, 0) : 1;
    if (center && bearing != null && !isNaN(bearing) && length) {
      // sanitize
      bearing = bearing % 360;
      bearing += bearing <= 0 ? 360 : 0;
      var coords = [];
      if (center.length < 3) {
        center[2] = 0;
      }

      var multiplier = opt_lobOpts.lengthType == 'column' ? opt_lobOpts.columnLength : opt_lobOpts.length;
      multiplier = multiplier || osStyle.DEFAULT_LOB_LENGTH;
      var lengthUnits = opt_lobOpts.lengthUnits || osStyle.DEFAULT_UNITS;
      var convertedLength = convertUnits(length, osStyle.DEFAULT_UNITS, lengthUnits);
      var effectiveBearing = length < 0 ? (bearing + 180) % 360 : bearing; // flip it if the length will be negative
      var effectiveLength = Math.min(Math.abs(convertedLength * multiplier), geo.MAX_LINE_LENGTH);

      // now do some calcs
      var end = osasm.geodesicDirect(center, effectiveBearing, effectiveLength);
      end[2] = center[2];
      var inverse = osasm.geodesicInverse(center, end);
      var endBearing = inverse.finalBearing;

      // create the line and split it across the date line so it renders correctly on a 2D map
      lob = new LineString([center, end], GeometryLayout.XYZM);
      lob = geo.splitOnDateLine(lob);
      if (lob instanceof LineString) {
        coords.push(lob.getCoordinates());
      }

      if (opt_lobOpts.showArrow) {
        var arrowUnits = opt_lobOpts.arrowUnits || osStyle.DEFAULT_UNITS;
        var arrowLength = opt_lobOpts.arrowLength || osStyle.DEFAULT_ARROW_SIZE;
        var convertedArrowLength = convertUnits(arrowLength, osStyle.DEFAULT_UNITS, arrowUnits);
        var effectiveArrowLength = Math.min(convertedArrowLength, geo.MAX_LINE_LENGTH);
        var right = osasm.geodesicDirect(end, endBearing + 180 - 45, effectiveArrowLength);
        right.push(center[2]);
        var rightArm = new LineString([end, right], GeometryLayout.XYZM);
        rightArm = geo.splitOnDateLine(rightArm);
        if (rightArm instanceof LineString) {
          coords.push(rightArm.getCoordinates());
        }

        var left = osasm.geodesicDirect(end, endBearing + 180 + 45, effectiveArrowLength);
        left.push(center[2]);
        var leftArm = new LineString([end, left], GeometryLayout.XYZM);
        leftArm = geo.splitOnDateLine(leftArm);
        if (leftArm instanceof LineString) {
          coords.push(leftArm.getCoordinates());
        }
      }

      // lob must be a MultiLineString
      if (coords.length > 0) {
        lob = new MultiLineString(coords, GeometryLayout.XYZM);
        lob.set(GeometryField.NORMALIZED, true);
        lob.osTransform();
      }

      var plusArc = null;
      var minusArc = null;
      if (opt_lobOpts.showError) { // draw error arcs
        var lengthErrorUnits = opt_lobOpts.lengthErrorUnits || osStyle.DEFAULT_UNITS;
        var lengthError = Math.abs(getColumnValue(feature, opt_lobOpts.lengthErrorColumn));
        var lengthErrorMultiplier = opt_lobOpts.lengthError !== undefined ?
          opt_lobOpts.lengthError : osStyle.DEFAULT_LOB_LENGTH_ERROR;
        var bearingError = Math.abs(getColumnValue(feature, opt_lobOpts.bearingErrorColumn));
        var bearingErrorMultiplier = opt_lobOpts.bearingError !== undefined ?
          opt_lobOpts.bearingError : osStyle.DEFAULT_LOB_BEARING_ERROR;
        if (bearingError === null || isNaN(bearingError)) {
          bearingError = 1;
        }
        if (lengthError === null || isNaN(lengthError)) {
          lengthError = 1;
        }
        var cLengthError = convertUnits(lengthError, osStyle.DEFAULT_UNITS, lengthErrorUnits) *
            lengthErrorMultiplier;
        if (bearingError > 0 && bearingErrorMultiplier > 0) {
          var plusPts = geo.interpolateArc(center, effectiveLength + cLengthError,
              Math.min(bearingError * bearingErrorMultiplier * 2, 360), bearing);
          plusArc = new LineString(plusPts, GeometryLayout.XYZM);
          plusArc = geo.splitOnDateLine(plusArc);
          plusArc.set(GeometryField.NORMALIZED, true);
          plusArc.osTransform();

          if (lengthError > 0 && lengthErrorMultiplier > 0) { // only draw one arc if it is zero
            var pts = geo.interpolateArc(center, effectiveLength - cLengthError,
                Math.min(bearingError * bearingErrorMultiplier * 2, 360), bearing);
            minusArc = new LineString(pts, GeometryLayout.XYZM);
            minusArc = geo.splitOnDateLine(minusArc);
            minusArc.set(GeometryField.NORMALIZED, true);
            minusArc.osTransform();
          }
        } else if (lengthError > 0 && lengthErrorMultiplier > 0) { // no bearing error perpendicular line instead of arc
          var uLineCenter = osasm.geodesicDirect(end, endBearing + 180, -cLengthError);
          var uLineRight = osasm.geodesicDirect(uLineCenter, endBearing + 90, -cLengthError);
          uLineRight.push(center[2]);
          var uLineLeft = osasm.geodesicDirect(uLineCenter, endBearing - 90, -cLengthError);
          uLineLeft.push(center[2]);
          plusArc = new LineString([uLineLeft, uLineRight], GeometryLayout.XYZM);
          plusArc = geo.splitOnDateLine(plusArc);
          plusArc.set(GeometryField.NORMALIZED, true);
          plusArc.osTransform();

          var bLineCenter = osasm.geodesicDirect(end, endBearing + 180, cLengthError);
          var bLineRight = osasm.geodesicDirect(bLineCenter, endBearing + 90, cLengthError);
          bLineRight.push(center[2]);
          var bLineLeft = osasm.geodesicDirect(bLineCenter, endBearing - 90, cLengthError);
          bLineLeft.push(center[2]);
          minusArc = new LineString([bLineLeft, bLineRight], GeometryLayout.XYZM);
          minusArc = geo.splitOnDateLine(minusArc);
          minusArc.set(GeometryField.NORMALIZED, true);
          minusArc.osTransform();
        }
      }
      interpolate.interpolateGeom(lob);
      feature.set(RecordField.LINE_OF_BEARING_ERROR_HIGH, plusArc);
      feature.set(RecordField.LINE_OF_BEARING_ERROR_LOW, minusArc);
    }

    if (opt_lobOpts.showEllipse) { // TODO remove this if we ever allow independent styles
      createEllipse(feature);
    } else {
      feature.set(RecordField.ELLIPSE, null);
    }
  }

  // if a lob couldn't be created, use the original geometry so it's still rendered on the map
  feature.set(RecordField.LINE_OF_BEARING, lob || geom);

  return lob;
};

/**
 * Generates a set of ring geometries from an options object.
 * @param {?Feature} feature The feature to generate rings for.
 * @param {boolean=} opt_replace Whether to replace an existing ring.
 * @return {Geometry|undefined} The rings.
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
export const createRings = function(feature, opt_replace) {
  var ringGeom;

  if (feature && feature.values_) {
    if (!opt_replace) {
      ringGeom = /** @type {GeometryCollection} */ (feature.values_[RecordField.RING]);
      if (ringGeom instanceof GeometryCollection) {
        return ringGeom;
      }
    }

    cleanRingGeoms(feature);

    var options = /** @type {osx.feature.RingOptions} */ (feature.get(RecordField.RING_OPTIONS));
    var geometry = feature.getGeometry();
    var center = null;

    if (geometry && geometry instanceof Point) {
      center = toLonLat(geometry.getCoordinates(), osMap.PROJECTION);
    } else if (geometry) {
      // We can import range rings as a polygon, still with ring options; the center from getCenter may not be correct
      var lon = Number(feature.get(Fields.LON));
      var lat = Number(feature.get(Fields.LAT));
      center = [lon, lat];
    }

    if (options && options.enabled && options.rings && center) {
      // calculate the geomag object and get the current interpolation function to use
      var date = new Date(TimelineController.getInstance().getCurrent());
      var directInterpFn = interpolate.getMethod() == Method.GEODESIC ?
          osasm.geodesicDirect : osasm.rhumbDirect;

      // calculate the magnetic declination
      var declination = 0;
      if (options.bearingType == BearingType.MAGNETIC) {
        // set the declination value if we're set to magnetic north
        var geomag = osBearing.geomag(center, date);
        declination = /** @type {number} */ (geomag['dec']);
      }


      var rings = options.rings;
      var startAngle = (options.startAngle || 0) + declination;
      var widthAngle = options.widthAngle || 0;
      var largestRing = rings.reduce((acc, current) => acc.radius > current.radius ? acc : current, 0);
      var geoms = [];
      var labels = [];
      var previousCoordinates;

      // iterate over the rings and create either arcs or circles from them
      rings.forEach(function(ring, i, arr) {
        var units = ring.units;
        var radius = ring.radius;

        if (units && radius) {
          // units need to be in meters to use with the interpolation functions
          radius = convertUnits(radius, Units.METERS, units);
          var geom;
          var coordinates;

          if (options.arcs) {
            coordinates = geo.interpolateArc(center, radius, widthAngle, startAngle);
            geom = new LineString(coordinates);

            if (ring === largestRing) {
              // largest ring, so create the endcap geometries and stitch it into a polygon so it can be filled
              var endCoord1 = directInterpFn(center, startAngle - widthAngle / 2, radius);
              var endCoord2 = directInterpFn(center, startAngle + widthAngle / 2, radius);

              var startCap = new LineString([center, endCoord1]);
              var endCap = new LineString([center, endCoord2]);
              var polyCoords = [];
              polyCoords = polyCoords.concat(startCap.getCoordinates());
              polyCoords = polyCoords.concat(geom.getCoordinates());
              polyCoords = polyCoords.concat(endCap.getCoordinates().reverse());

              geom = new Polygon([polyCoords]);
            }
          } else {
            // interpolateCircle wasn't working correctly... so use ellipse with semimajor = semiminor instead
            coordinates = geo.interpolateEllipse(center, radius, radius, 0);

            // Create the first ring normally, but subsequent rings should be created with the previous ring as
            // a hole. This prevents their fills from stacking in the central zones.
            geom = previousCoordinates ?
                new Polygon([coordinates, previousCoordinates]) : new Polygon([coordinates]);

            previousCoordinates = coordinates.slice();
          }

          geoms.push(geom);
        }
      });

      if (options.crosshair) {
        // create the crosshair starting from north
        var northBearing = declination < 0 ? declination + 360 : declination;

        if (largestRing) {
          var distance = largestRing.radius || 40;
          var units = largestRing.units;

          // convert to meters and add 10% so the crosshairs reach past the outermost ring
          distance = convertUnits(distance, Units.METERS, units) * 1.1;

          // the create the lines at 90 degree angles from north (whether magnetic or true)
          var coord1 = directInterpFn(center, northBearing, distance);
          var coord2 = directInterpFn(center, northBearing - 180, distance);

          var verticalLine = new LineString([coord1, center, coord2]);

          var coord3 = directInterpFn(center, northBearing - 90, distance);
          var coord4 = directInterpFn(center, northBearing + 90, distance);

          var horizontalLine = new LineString([coord3, center, coord4]);

          geoms.push(verticalLine);
          geoms.push(horizontalLine);

          if (options.labels) {
            var northGeom = new Point(coord1);
            var northKey = RecordField.RING_LABEL + 'north';
            feature.set(northKey, northGeom);

            var labelConfig = {
              'geometry': northKey,
              'text': 'N',
              'zIndex': 100
            };

            labels.push(labelConfig);
          }
        }
      }

      if (options.labels) {
        rings.forEach(function(ring, i) {
          var distance = ring.radius;

          if (distance) {
            // edge case: don't draw labels for null/0 radius rings
            var units = ring.units;
            distance = convertUnits(distance, Units.METERS, units);

            var coord = osasm.rhumbDirect(center, options.arcs ? declination + options.startAngle : 90, distance);
            var geom = new Point(coord);
            var key = RecordField.RING_LABEL + i;
            feature.set(key, geom);

            var labelConfig = {
              'geometry': key,
              'text': ring.radius + units,
              'textAlign': 'left',
              'offsetX': 4,
              'zIndex': 100
            };

            labels.push(labelConfig);
          }
        });
      }

      // create the geometry collection, transform it and interpolate it now
      ringGeom = new GeometryCollection(geoms);
      ringGeom.osTransform();
      interpolate.interpolateGeom(ringGeom);
    }

    feature.set(RecordField.RING, ringGeom);
    feature.set(StyleField.ADDITIONAL_LABELS, labels);
  }

  return ringGeom;
};

/**
 * Cleans the ring geometries off of a feature. This is necessary because the geometries for positioning additional
 * labels are held by the feature to allow the renderer to know where to draw them.
 *
 * @param {Feature} feature The feature
 */
export const cleanRingGeoms = function(feature) {
  if (feature) {
    for (var i = 0; i < 100; i++) {
      var key = RecordField.RING_LABEL + i;
      var geom = feature.get(key);

      if (geom) {
        feature.unset(key);
      } else {
        // all cleaned up, so break
        break;
      }
    }

    feature.unset(RecordField.RING_LABEL + 'north');
  }
};

/**
 * Set the altitude component on a feature if it has a point geometry.
 *
 * @param {Feature} feature The feature
 * @param {string=} opt_field The altitude field
 */
export const setAltitude = function(feature, opt_field) {
  var field = opt_field || Fields.ALT;
  var geom = feature.getGeometry();
  if (geom instanceof Point) {
    var coords = geom.getFlatCoordinates();
    if (coords.length < 3 || coords[2] === 0) {
      var altitude = Number(feature.get(field) || 0);
      if (isNaN(altitude)) {
        altitude = 0;
      }

      coords[2] = altitude;
      geom.setFlatCoordinates(GeometryLayout.XYZ, coords);
    }
  }
};

/**
 * Automatically populate coordinate fields on a feature. Requires a point geometry to set fields.
 *
 * @param {Feature} feature The feature
 * @param {boolean=} opt_replace If existing values should be replaced
 * @param {Geometry=} opt_geometry Alternate geometry to populate the fields
 * @param {boolean=} opt_silent
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
export const populateCoordFields = function(feature, opt_replace, opt_geometry, opt_silent) {
  if (!feature.values_) {
    return;
  }
  var changed = false;
  var geom = opt_geometry || feature.getGeometry();
  if (geom instanceof Point) {
    var coords = geom.getFlatCoordinates();
    if (coords.length > 1) {
      coords = toLonLat(coords, osMap.PROJECTION);

      if (opt_replace || feature.values_[Fields.MGRS] == undefined) {
        feature.values_[Fields.MGRS] = osasm.toMGRS(coords);
        changed = true;
      }

      if (opt_replace || feature.values_[Fields.LAT] == undefined) {
        feature.values_[Fields.LAT] = coords[1];
        changed = true;
      }

      if (opt_replace || feature.values_[Fields.LON] == undefined) {
        feature.values_[Fields.LON] = coords[0];
        changed = true;
      }

      if (opt_replace || feature.values_[Fields.ALT] == undefined) {
        if (coords[2]) {
          feature.values_[Fields.ALT] = coords[2];
          changed = true;
        }
      }

      if (opt_replace || feature.values_[Fields.LAT_DMS] == undefined) {
        feature.values_[Fields.LAT_DMS] = geo.toSexagesimal(coords[1], false);
        changed = true;
      }

      if (opt_replace || feature.values_[Fields.LON_DMS] == undefined) {
        feature.values_[Fields.LON_DMS] = geo.toSexagesimal(coords[0], true);
        changed = true;
      }

      if (opt_replace || feature.values_[Fields.LAT_DDM] == undefined) {
        feature.values_[Fields.LAT_DDM] = geo.toDegreesDecimalMinutes(coords[1], false);
        changed = true;
      }

      if (opt_replace || feature.values_[Fields.LON_DDM] == undefined) {
        feature.values_[Fields.LON_DDM] = geo.toDegreesDecimalMinutes(coords[0], true);
        changed = true;
      }
    }
  }

  // fire a change event if anything was updated, so the UI can update
  if (!opt_silent && changed) {
    feature.changed();
  }
};

/**
 * Gets a field value from an {@link Feature}.
 *
 * @param {Feature} item
 * @param {string} field
 * @return {*} The value
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
export const getField = function(item, field) {
  return item ? item.values_[field] : undefined;
};

/**
 * Get the title from a feature, matching a property (case insensitive) called 'name' or 'title'.
 *
 * @param {Feature} feature The feature.
 * @return {string|undefined} The feature title, or undefined if not found.
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
export const getTitle = function(feature) {
  var title;
  if (feature) {
    for (var key in feature.values_) {
      if (TITLE_REGEX.test(key)) {
        var value = feature.values_[key];
        if (value && typeof value === 'string') {
          title = value;
          break;
        }
      }
    }
  }

  return title;
};

/**
 * Get the property name for the {@link Feature#values_} property. This is necessary for compiled code because
 * `values_` will be renamed by the Closure compiler.
 * @type {string}
 */
export const VALUES_FIELD = reflect.objectProperty('values_', new Feature());

/**
 * Create a filter function expression to get a value from a feature.
 *
 * @param {string} itemVar The feature variable name.
 * @param {string} field The field to get.
 * @return {string} The get expression.
 */
export const filterFnGetter = function(itemVar, field) {
  // create the string: itemVar.values_["column_name"]
  // make the field safe for use as an object property name, to prevent injection attacks
  return itemVar + '.' + VALUES_FIELD + ' ? ' + itemVar + '.' + VALUES_FIELD + '[' + quoteString(field) + ']' +
  ' : undefined';
};

/**
 * If a field is internal to the application and should be skipped by user-facing features.
 *
 * @param {string} field The metadata field
 * @return {boolean}
 */
export const isInternalField = function(field) {
  return RecordField.REGEXP.test(field) || StyleType.REGEXP.test(field) ||
      StyleField.REGEXP.test(field);
};

/**
 * Get the layer id of a feature
 *
 * @param {Feature|RenderFeature} feature The feature
 * @return {string|undefined}
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
export const getLayerId = function(feature) {
  var sourceId = undefined;
  if (feature && feature.values_) {
    sourceId = /** @type {string|undefined} */ (feature.values_[RecordField.SOURCE_ID]);
  }
  return sourceId;
};

/**
 * Get the layer containing a feature. This accounts for features that may be rendered in a
 * {@link os.layer.AnimationOverlay}, which uses an OL layer/source with hit detection disabled. In that case, find
 * the original layer from the map.
 *
 * @param {Feature|RenderFeature} feature The feature
 * @return {Layer}
 */
export const getLayer = function(feature) {
  var layer = null;
  var mapContainer = getIMapContainer();
  if (feature && mapContainer) {
    var sourceId = getLayerId(feature);
    if (sourceId) {
      // look up the layer via the id
      layer = mapContainer.getLayer(sourceId);
    }
  }

  return layer;
};

/**
 * Get the source containing a feature. This accounts for features that may be rendered in a
 * {@link os.layer.AnimationOverlay}, which uses an OL layer/source with hit detection disabled. In that case, find
 * the original source from the data manager.
 *
 * @param {Feature|RenderFeature} feature The feature
 * @param {Layer=} opt_layer The layer containing the feature
 * @return {VectorSource} The source, if it can be found
 */
export const getSource = function(feature, opt_layer) {
  var source = null;
  if (opt_layer != null) {
    // layer was provided - make sure the source is an OS source
    var layerSource = opt_layer.getSource();
    if (instanceOf(layerSource, SourceClass.VECTOR)) {
      source = /** @type {!VectorSource} */ (layerSource);
    }
  }

  if (source == null && feature != null) {
    // no layer or not an OS source, so check if the feature has the source id
    var sourceId = getLayerId(feature);
    if (sourceId) {
      // have the source id - check if it's in the data manager
      source = DataManager.getInstance().getSource(sourceId);
    }
  }

  return source;
};

/**
 * Get the color of a feature.
 *
 * @param {Feature} feature The feature.
 * @param {ISource=} opt_source The source containing the feature, or null to ignore source color.
 * @param {(Array<number>|string)=} opt_default The default color, `null` to indicate no color.
 * @param {StyleField=} opt_colorField The style field to use in locating the color.
 * @return {Array<number>|string} The color.
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
export const getColor = function(feature, opt_source, opt_default, opt_colorField) {
  var defaultColor = opt_default !== undefined ? opt_default : osStyle.DEFAULT_LAYER_COLOR;

  if (feature && feature.values_) {
    var color = /** @type {string|undefined} */ (feature.values_[RecordField.COLOR]);

    if (color === undefined) {
      // check the layer config to see if it's replacing feature styles
      // the config here will not be modified, so get it directly from the manager for speed
      // (rather than getting a new one merged together for changing)
      var layerConfig = getStyleManager().getLayerConfig(getLayerId(feature) || '');
      if (layerConfig && layerConfig[StyleField.REPLACE_STYLE]) {
        color = osStyle.getConfigColor(layerConfig, false, opt_colorField);
      }
    }

    if (color === undefined) {
      var featureConfig = /** @type {Array<Object>|Object|undefined} */ (feature.values_[StyleType.FEATURE]);
      if (featureConfig) {
        if (Array.isArray(featureConfig)) {
          for (var i = 0; !color && i < featureConfig.length; i++) {
            color = osStyle.getConfigColor(featureConfig[i], false, opt_colorField);

            // stop on the first color found, allowing null if set as the default
            if (color || (color === null && defaultColor === null)) {
              break;
            }
          }
        } else {
          color = osStyle.getConfigColor(featureConfig, false, opt_colorField);
        }
      }
    }

    if (color || (color === null && defaultColor === null)) {
      // if the default color was provided as null, allow returning that as the color
      return /** @type {Array<number>|string} */ (color);
    } else if (opt_source) {
      // fall back on the source color
      return opt_source.getColor();
    } else if (opt_source !== null) {
      // try to locate the source
      var source = getSource(feature);
      if (source) {
        return source.getColor();
      }
    }
  }

  return defaultColor;
};

/**
 * Get the fill color of a feature.
 * @param {Feature} feature The feature.
 * @param {ISource=} opt_source The source containing the feature, or null to ignore source color.
 * @param {(Array<number>|string)=} opt_default The default color.
 * @return {Array<number>|string} The color.
 */
export const getFillColor = function(feature, opt_source, opt_default) {
  // default to null to indicate no fill
  return getColor(feature, opt_source, opt_default || null, StyleField.FILL);
};

/**
 * Get the stroke color of a feature.
 * @param {Feature} feature The feature.
 * @param {ISource=} opt_source The source containing the feature, or null to ignore source color.
 * @param {(Array<number>|string)=} opt_default The default color.
 * @return {Array<number>|string} The color.
 */
export const getStrokeColor = function(feature, opt_source, opt_default) {
  // default to null to indicate no stroke
  return getColor(feature, opt_source, opt_default || null, StyleField.STROKE);
};

/**
 * Get the stroke width of a feature.
 * @param {Feature} feature The feature.
 * @return {number|null} The stroke width.
 */
export const getStrokeWidth = function(feature) {
  if (feature.getStyle() && feature.getStyle().length > 0) {
    var style = /** @type {Array<Style>} */(feature.getStyle())[0];
    if (style.getStroke() && style.getStroke().getWidth()) {
      var width = style.getStroke().getWidth();
      if (width !== undefined) {
        return width;
      } else {
        return null;
      }
    }
  }
  return null;
};

/**
 * Gets the shape name for a feature.
 *
 * @param {!Feature} feature The feature
 * @param {VectorSource=} opt_source The source containing the feature
 * @param {boolean=} opt_preferSource If the source shape should be preferred over the feature shape.
 * @return {string|undefined}
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
export const getShapeName = function(feature, opt_source, opt_preferSource) {
  var shapeName;
  if (feature.values_) {
    shapeName = /** @type {string|undefined} */ (feature.values_[StyleField.SHAPE]);

    if (!shapeName || opt_preferSource) {
      // get the source shape if the feature didn't define its own shape, or the source shape is preferred
      var source = opt_source || getSource(feature);
      if (source && instanceOf(source, SourceClass.VECTOR)) {
        var sourceShape = source.getGeometryShape();
        if (opt_preferSource || sourceShape !== osStyle.ShapeType.DEFAULT) {
          shapeName = sourceShape;
        }
      }
    }
  }

  return shapeName;
};

/**
 * Gets the center shape name for a feature.
 *
 * @param {!Feature} feature The feature
 * @param {VectorSource=} opt_source The source containing the feature
 * @param {boolean=} opt_preferSource If the source shape should be preferred over the feature shape.
 * @return {string|undefined}
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
export const getCenterShapeName = function(feature, opt_source, opt_preferSource) {
  var shapeName;
  if (feature.values_) {
    /** @type {string|undefined} */ (feature.values_[StyleField.CENTER_SHAPE]);

    if (!shapeName || opt_preferSource) {
      // get the source shape if the feature didn't define its own shape, or the source shape is preferred
      var source = opt_source || getSource(feature);
      if (source && instanceOf(source, SourceClass.VECTOR)) {
        var sourceShape = source.getCenterGeometryShape();
        if (opt_preferSource || sourceShape !== osStyle.ShapeType.DEFAULT) {
          shapeName = sourceShape;
        }
      }
    }
  }

  return shapeName;
};

/**
 * Hides the label for a feature.
 *
 * @param {Feature} feature The feature
 * @return {boolean} If the label was hidden, or false if it was hidden already.
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
export const hideLabel = function(feature) {
  if (feature && feature.values_ && feature.values_[StyleField.SHOW_LABELS] !== false) {
    feature.values_[StyleField.SHOW_LABELS] = false;
    return true;
  }

  return false;
};

/**
 * Shows the label for a feature.
 *
 * @param {Feature} feature The feature
 * @return {boolean} If the label was hidden, or false if it was hidden already.
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
export const showLabel = function(feature) {
  if (feature && feature.values_ && feature.values_[StyleField.SHOW_LABELS] !== true) {
    feature.values_[StyleField.SHOW_LABELS] = true;
    return true;
  }

  return false;
};

/**
 * Updates the feature (typically after style changes)
 *
 * @param {Feature} feature The feature
 * @param {Source=} opt_source The source containing the feature
 */
export const update = function(feature, opt_source) {
  if (!opt_source) {
    opt_source = getSource(feature);
  }

  var mapContainer = getIMapContainer();
  if (!opt_source && mapContainer && mapContainer.containsFeature(feature)) {
    opt_source = mapContainer.getLayer(LayerId.DRAW).getSource();
  }

  var id = feature.getId();
  if (id && opt_source && /** @type {OLVectorSource} */ (opt_source).getFeatureById(id)) {
    // for 3D synchronizer
    opt_source.dispatchEvent(new VectorSourceEvent(VectorEventType.CHANGEFEATURE, feature));
    // for 2D
    opt_source.changed();
  }
};

/**
 * Remove features from application
 *
 * @param {!string} sourceId
 * @param {Array<Feature>} features
 */
export const removeFeatures = function(sourceId, features) {
  var source = DataManager.getInstance().getSource(sourceId);
  if (source && features) {
    source.removeFeatures(features);
  }
};

/**
 * Copy a feature, saving its current style as a local feature style.
 *
 * @param {!Feature} feature The feature to copy
 * @param {Object=} opt_layerConfig The feature's layer config
 * @return {!Feature}
 */
export const copyFeature = function(feature, opt_layerConfig) {
  var clone = feature.clone();
  clone.setId(getUid(clone));

  // copy the feature's current style to a new config and set it on the cloned feature
  // base config priority: feature config > layer config > default config
  var baseConfig = /** @type {Object|undefined} */ (feature.get(StyleType.FEATURE)) || opt_layerConfig ||
      osStyle.DEFAULT_VECTOR_CONFIG;
  var featureConfig = osStyle.createFeatureConfig(feature, baseConfig, opt_layerConfig);
  clone.set(StyleType.FEATURE, featureConfig);

  var shapeName = getShapeName(feature);
  if (shapeName) {
    // default shape is point for vector layers, icon for KML layers. check the config to see if it should be an icon.
    if (shapeName == osStyle.ShapeType.DEFAULT) {
      shapeName = osStyle.isIconConfig(featureConfig) ? osStyle.ShapeType.ICON : osStyle.ShapeType.POINT;
    }

    // places doesn't support selected styles
    shapeName = shapeName.replace(/^Selected /, '');

    clone.set(StyleField.SHAPE, shapeName);
  }

  var centerShapeName = getCenterShapeName(feature);
  if (centerShapeName) {
    // default shape is point for vector layers, icon for KML layers. check the config to see if it should be an icon.
    if (centerShapeName == osStyle.ShapeType.DEFAULT) {
      centerShapeName = osStyle.isIconConfig(featureConfig) ? osStyle.ShapeType.ICON : osStyle.ShapeType.POINT;
    }

    // places doesn't support selected styles
    centerShapeName = centerShapeName.replace(/^Selected /, '');

    clone.set(StyleField.CENTER_SHAPE, centerShapeName);
  }

  return clone;
};

/**
 * Sets an opacity multiplier on every feature in a set.
 *
 * @param {Array<!Feature>} features
 * @param {number} opacity
 * @param {VectorSource=} opt_source
 * @suppress {accessControls}
 */
export const updateFeaturesFadeStyle = function(features, opacity, opt_source) {
  var source = opt_source || getSource(features[0]);

  if (source) {
    for (var i = 0, n = features.length; i < n; i++) {
      var feature = features[i];

      // don't fade dynamic features because they are always displayed
      if (feature && feature.values_ && !(feature instanceof DynamicFeature)) {
        // we need to make a copy/clone of the style to mess with the config
        var layerConfig = osStyle.getLayerConfig(feature, source);
        var baseConfig = /** @type {Object|undefined} */
            (feature.values_[StyleType.FEATURE]) ||
            layerConfig ||
            osStyle.DEFAULT_VECTOR_CONFIG;
        osStyle.setConfigOpacityColor(baseConfig, opacity, true);

        var style = osStyle.createFeatureStyle(feature, baseConfig, layerConfig);
        feature.setStyle(style);
      }
    }
  }
};

/**
 * Test if a feature's source id matches the provided source id.
 *
 * @param {string} sourceId The source id to match
 * @param {!Feature} feature The feature to test
 * @return {boolean}
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
export const sourceIdEquals = function(sourceId, feature) {
  return feature.values_ ? feature.values_[RecordField.SOURCE_ID] == sourceId : false;
};

/**
 * Sorts two features by a field.
 *
 * @param {string} field The sort field
 * @param {!Feature} a The first feature
 * @param {!Feature} b The second feature
 * @return {number}
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
export const sortByField = function(field, a, b) {
  var aValue = a.values_[field];
  var bValue = b.values_[field];

  if (aValue != null && bValue != null) {
    if (typeof aValue == 'string' && typeof bValue == 'string') {
      return floatAwareCompare(aValue, bValue);
    }

    return defaultCompare(aValue, bValue);
  } else if (aValue != null) {
    return -1;
  } else if (bValue != null) {
    return 1;
  }

  return 0;
};

/**
 * Sorts two features by their start time, in ascending order.
 *
 * @param {!Feature} a The first feature.
 * @param {!Feature} b The second feature.
 * @return {number}
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
export const sortByTime = function(a, b) {
  var aTimeObj = /** @type {ITime|undefined} */ (a.values_[RecordField.TIME]);
  var bTimeObj = /** @type {ITime|undefined} */ (b.values_[RecordField.TIME]);

  if (aTimeObj && bTimeObj) {
    var aTime = aTimeObj.getStart();
    var bTime = bTimeObj.getStart();
    return aTime > bTime ? 1 : aTime < bTime ? -1 : 0;
  } else if (aTimeObj) {
    return 1;
  } else if (bTimeObj) {
    return -1;
  }

  return 0;
};

/**
 * Sorts two features by their start time, in descending order.
 *
 * @param {!Feature} a The first feature.
 * @param {!Feature} b The second feature.
 * @return {number}
 */
export const sortByTimeDesc = function(a, b) {
  return sortByTime(b, a);
};

/**
 * Compares two features by their id.
 *
 * @param {!Feature} a First feature
 * @param {!Feature} b Second feature
 * @return {number}
 *
 * Inlined everything for performance reasons. Function calls are too expensive for how often this can be called.
 * @suppress {accessControls}
 */
export const idCompare = function(a, b) {
  return a.id_ > b.id_ ? 1 : a.id_ < b.id_ ? -1 : 0;
};

/**
 * Validates a features geometries, attempting to repair invalid polygons and removing them if they are beyond fixing
 *
 * @param {!Feature} feature thing to validate geometries on
 * @param {boolean=} opt_quiet If alerts should be suppressed
 * @return {number} number of invalid polygons removed
 */
export const validateGeometries = function(feature, opt_quiet) {
  var geometry = feature.getGeometry();
  var count = 0;
  if (geometry instanceof GeometryCollection) {
    var geometries = geometry.getGeometriesArray();
    for (var i = geometries.length; i > 0; i--) {
      if (geometries[i] instanceof Polygon || geometries[i] instanceof MultiPolygon) {
        var geom = validatePolygonType(geometries[i], opt_quiet);
        if (geom !== undefined) {
          geometries[i] = geom;
        } else {
          geometries.splice(i, 1);
          count++;
        }
      }
    }
  } else if (geometry instanceof Polygon || geometry instanceof MultiPolygon) {
    var geom = validatePolygonType(geometry, opt_quiet);
    if (geom === undefined) {
      count++;
    }
    feature.setGeometry(geom);
  }
  return count;
};

/**
 * Validation helper for polygon types.
 *
 * MultiPolygon geometries have their internal polygons individually validated, and removed if they fail the validation.
 * Otherwise the structure of the MultiPolygon is not affected.
 *
 * @param {Geometry} geometry The polygon-type geometry to validate
 * @param {boolean=} opt_quiet If alerts should be suppressed
 * @return {Geometry|undefined} a valid polygon, or undefined if invalid
 */
const validatePolygonType = function(geometry, opt_quiet) {
  if (geometry instanceof MultiPolygon) {
    const validPolygons = [];
    for (let i = 0, n = geometry.getEndss().length; i < n; ++i) {
      const geom = osGeoJsts.validate(geometry.getPolygon(i), opt_quiet, true);
      if (geom !== undefined) {
        validPolygons.push(geom);
      }
    }

    if (validPolygons.length) {
      const newGeo = geometry.clone();
      newGeo.setCoordinates([], newGeo.getLayout());
      for (const poly of validPolygons) {
        newGeo.appendPolygon(poly);
      }
      return newGeo;
    }

    return undefined;
  }

  return osGeoJsts.validate(geometry, opt_quiet, true);
};


/**
 * @param {Feature} feature
 * @param {function(!Geometry):(boolean|undefined)} callback Return
 *   false to shortcut the loop
 */
export const forEachGeometry = function(feature, callback) {
  if (feature) {
    var mainGeom = feature.getGeometry();
    var mainGeomSeen = false;

    var style = feature.getStyle();
    var styles = Array.isArray(style) ? style : [style];

    for (var s = 0, ss = styles.length; s < ss; s++) {
      if (styles[s]) {
        var geomFunc = styles[s].getGeometryFunction();
        if (geomFunc) {
          var geom = geomFunc(feature);
          if (geom) {
            if (geom === mainGeom) {
              mainGeomSeen = true;
            }

            var retVal = callback(geom);
            if (retVal != null && !retVal) {
              break;
            }
          }
        }
      }
    }

    if (mainGeom && !mainGeomSeen) {
      callback(mainGeom);
    }
  }
};

/**
 * Gets all associated geometries for a feature or list of features.
 * @param {(Feature|Array<Feature>)} features
 * @return {!Array<Geometry>} The array of all the geometries.
 */
export const getGeometries = function(features) {
  const arr = [];
  const callback = (geom) => {
    arr.push(geom);
    return true;
  };

  if (Array.isArray(features)) {
    features.forEach((f) => forEachGeometry(f, callback));
  } else {
    forEachGeometry(features, callback);
  }

  return arr;
};

/**
 * If a feature is currently rendering a polygonal geometry.
 * @param {Feature} feature The feature.
 * @return {boolean} If one or more styles on the feature are rendering a polygon.
 */
export const hasPolygon = function(feature) {
  var hasPolygon = false;

  if (feature) {
    forEachGeometry(feature, function(geometry) {
      if (geo.isGeometryPolygonal(geometry, true)) {
        // found one, stop processing geometries
        hasPolygon = true;
        return false;
      }
      // continue processing geometries
      return true;
    });
  }

  return hasPolygon;
};

/**
 * Finds the first color in the items so the User has some consistency
 *
 * @param {Array<!Feature>|null} items
 * @return {string} the color
 */
export const getFirstColor = function(items) {
  var str = osStyle.DEFAULT_LAYER_COLOR;
  if (!items) return str;
  var color;

  for (const item of items) {
    color = /** @type {string} */ (item.get(RecordField.COLOR));
    if (color) break;
  }

  return color ? color : str;
};

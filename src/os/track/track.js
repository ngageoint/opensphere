goog.declareModuleId('os.track');

import Feature from 'ol/src/Feature.js';
import GeometryCollection from 'ol/src/geom/GeometryCollection.js';
import GeometryLayout from 'ol/src/geom/GeometryLayout.js';
import GeometryType from 'ol/src/geom/GeometryType.js';
import LineString from 'ol/src/geom/LineString.js';
import MultiLineString from 'ol/src/geom/MultiLineString.js';
import MultiPoint from 'ol/src/geom/MultiPoint.js';
import Point from 'ol/src/geom/Point.js';
import {assign} from 'ol/src/obj.js';

import * as osArray from '../array/array.js';
import RecordField from '../data/recordfield.js';
import EventType from '../events/eventtype.js';
import PropertyChangeEvent from '../events/propertychangeevent.js';
import DynamicFeature from '../feature/dynamicfeature.js';
import DynamicPropertyChange from '../feature/dynamicpropertychange.js';
import * as osFeature from '../feature/feature.js';
import Fields from '../fields/fields.js';
import * as fn from '../fn/fn.js';
import * as geo from '../geo/geo.js';
import GeometryField from '../geom/geometryfield.js';
import * as interpolate from '../interpolate.js';
import Method from '../interpolatemethod.js';
import * as osObject from '../object/object.js';
import * as osStyle from '../style/style.js';
import StyleField from '../style/stylefield.js';
import StyleType from '../style/styletype.js';
import TimelineController from '../time/timelinecontroller.js';
import TimeRange from '../time/timerange.js';
import {Controller as FeatureEditCtrl} from '../ui/featureedit.js';
import * as kml from '../ui/file/kml/kml.js';
import * as column from '../ui/slick/column.js';
import * as ConfirmColumnUI from '../ui/window/confirmcolumn.js';
import * as ConfirmTextUI from '../ui/window/confirmtext.js';
import UnitManager from '../unit/unitmanager.js';
import TrackField from './trackfield.js';

const Promise = goog.require('goog.Promise');
const googArray = goog.require('goog.array');
const dispose = goog.require('goog.dispose');
const log = goog.require('goog.log');
const math = goog.require('goog.math');
const googString = goog.require('goog.string');

const {default: ColumnDefinition} = goog.requireType('os.data.ColumnDefinition');
const {default: ITime} = goog.requireType('os.time.ITime');
const {default: AddOptions} = goog.requireType('os.track.AddOptions');
const {default: CreateOptions} = goog.requireType('os.track.CreateOptions');
const {default: SplitOptions} = goog.requireType('os.track.SplitOptions');
const {default: TrackFeatureLike} = goog.requireType('os.track.TrackFeatureLike');
const {default: TrackLike} = goog.requireType('os.track.TrackLike');
const {default: ConfirmColumnOptions} = goog.requireType('os.ui.window.ConfirmColumnOptions');


/**
 * Logger.
 * @type {goog.log.Logger}
 */
const logger = log.getLogger('os.track');

/**
 * Identifier for track components.
 * @type {string}
 */
export const ID = 'track';

/**
 * The FontAwesome track icon.
 * @type {string}
 */
export const ICON = 'fa-share-alt';

/**
 * Text to display when elapsed distance/duration is zero.
 * @type {number}
 */
export const ELAPSED_ZERO = 0;

/**
 * Text to display when total distance/duration is zero.
 * @type {string}
 */
export const TOTAL_ZERO = 'Unknown';

/**
 * Style config for the track.
 * @type {!Object<string, *>}
 */
export const TRACK_CONFIG = {
  'stroke': {
    'width': osStyle.DEFAULT_STROKE_WIDTH
  },
  'zIndex': 0
};

/**
 * Style config for the track current position marker.
 * @type {!Object<string, *>}
 */
export const CURRENT_CONFIG = {
  'geometry': TrackField.CURRENT_POSITION,
  'image': {
    'type': 'icon',
    'scale': 1,
    'src': kml.DEFAULT_ICON_PATH
  }
};

/**
 * Style used for hiding geometries such as the line and marker
 */
export const HIDE_GEOMETRY = '__hidden__';

/**
 * Test if a feature is a track.
 *
 * @param {Feature} feature The feature.
 * @return {boolean} If the feature is a track.
 */
export const isTrackFeature = function(feature) {
  return !!feature && feature.get(RecordField.FEATURE_TYPE) === ID;
};

/**
 * Gets a field value from a feature.
 *
 * @param {string} field
 * @param {Feature} feature
 * @return {*} The value
 */
export const getFeatureValue = function(field, feature) {
  return feature ? feature.get(field) : undefined;
};

/**
 * Get the start time for a feature.
 *
 * @param {Feature} feature
 * @return {number|undefined} The value
 */
export const getStartTime = function(feature) {
  var time = feature ? /** @type {ITime|undefined} */ (feature.get(RecordField.TIME)) : undefined;
  if (time) {
    return time.getStart();
  }

  return undefined;
};

/**
 * Sort track coordinates by their sort field.
 *
 * @param {!ol.Coordinate} a The first coordinate to be compared.
 * @param {!ol.Coordinate} b The second coordinate to be compared.
 * @return {number} The sort value.
 */
export const sortCoordinatesByValue = function(a, b) {
  var aValue = a[a.length - 1];
  var bValue = b[b.length - 1];
  return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
};

/**
 * Get a list of coordinates to include in a track from a set of features. The features must have a common field with
 * values that can be naturally sorted. Any features lacking a point geometry or a value in the sort field will be
 * ignored. If sorted by `RecordField.TIME`, the track may be animated over time.
 *
 * @param {!Array<!Feature>} features The features.
 * @param {string} sortField The track sort field.
 * @param {Object=} opt_metadataMap Optional map to store feature metadata by sort key.
 * @return {!Array<!ol.Coordinate>|undefined} The coordinates, or undefined if no coordinates were found.
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
export const getTrackCoordinates = function(features, sortField, opt_metadataMap) {
  var getValueFn = sortField == RecordField.TIME ? getStartTime :
    getFeatureValue.bind(null, sortField);

  var coordinates = features.map(function(feature) {
    var pointCoord;
    var value = /** @type {number|undefined} */ (getValueFn(feature));
    if (value == null) {
      // ignore the feature if it doesn't have a sort value
      return undefined;
    }

    var geometry = feature.getGeometry();
    if (geometry instanceof Point) {
      pointCoord = geometry.getFirstCoordinate();
    } else if (geometry instanceof GeometryCollection) {
      var geometries = geometry.getGeometriesArray();
      for (var i = 0; i < geometries.length; i++) {
        var next = geometries[i];
        if (next instanceof Point) {
          if (pointCoord) {
            // if multiple points are found, discard the point. we can't be certain which to include in the track and
            // cannot use multiple points at a single sort value.
            pointCoord = undefined;
            break;
          } else {
            pointCoord = next.getFirstCoordinate();
          }
        }
      }
    } else if (geometry instanceof MultiPoint) {
      var stride = geometry.getStride();
      var flatCoordinates = geometry.getFlatCoordinates();
      if (flatCoordinates.length === stride) {
        // single point in the geometry - use it!
        pointCoord = flatCoordinates.slice();
      }
    }

    if (pointCoord) {
      if (pointCoord.length < 3) {
        // add altitude for consistency across all track geometries
        pointCoord.push(0);
      }

      // add the sort value
      pointCoord.push(value);

      // if a metadata map was provided, populate it with values for the feature
      if (opt_metadataMap) {
        opt_metadataMap[value] = {};

        for (var key in feature.values_) {
          if (!osFeature.isInternalField(key)) {
            opt_metadataMap[value][key] = feature.values_[key];
          }
        }
      }
    }

    return pointCoord;
  }).filter(fn.filterFalsey);

  // sort the resulting coordinates by the sort value
  coordinates.sort(sortCoordinatesByValue);

  return coordinates;
};

/**
 * Creates a track from the provided options.
 *
 * @param {!CreateOptions} options The track creation options.
 * @return {TrackFeatureLike|undefined} The track feature.
 */
let createTrack_ = function(options) {
  var sortField = options.sortField || RecordField.TIME;
  var trackColor = options.color;
  var coordinates = options.coordinates;
  var features = options.features;
  var geometry = options.geometry;
  var metadataMap = options.features && options.includeMetadata ? {} : undefined;

  if (!geometry) {
    if (coordinates) {
      coordinates.sort(sortCoordinatesByValue);
    } else if (features && features.length) {
      coordinates = getTrackCoordinates(features, sortField, metadataMap);

      // if the color wasn't provided via options, determine the color from the features/source
      if (!trackColor && features.length) {
        trackColor = /** @type {string|undefined} */ (features[0].get(RecordField.COLOR));

        if (!trackColor) {
          var source = osFeature.getSource(features[0]);
          if (source) {
            trackColor = source ? source.getColor() : undefined;
          }
        }
      }
    }

    if (coordinates && coordinates.length) {
      geometry = new LineString(coordinates, GeometryLayout.XYZM);
    }
  }

  if (!geometry) {
    return undefined;
  }

  if (geometry instanceof LineString) {
    geometry.toLonLat();
    geometry = geo.splitOnDateLine(geometry);
    geometry.osTransform();
  }

  // prevent any further normalization of the geometry
  geometry.set(GeometryField.NORMALIZED, true);
  geometry.set(interpolate.METHOD_FIELD, Method.NONE);

  // create the track feature
  var track;
  if (sortField === RecordField.TIME) {
    track = new DynamicFeature(geometry,
        initDynamic,
        disposeDynamic,
        updateDynamic);
  } else {
    track = new Feature(geometry);
  }

  var trackId = options.id || (ID + '-' + googString.getRandomString());
  track.setId(trackId);
  track.set(Fields.ID, trackId);
  track.set(RecordField.FEATURE_TYPE, ID);

  if (metadataMap) {
    track.set(TrackField.METADATA_MAP, metadataMap);
  }

  // add a geometry to display the current track position
  updateCurrentPosition(track);

  // set the track name, defaulting to the id if one isn't provided
  track.set(Fields.LOWERCASE_NAME, options.name || trackId);

  // save the field used to sort coordinates in the track
  track.set(TrackField.SORT_FIELD, sortField);

  var distance = updateDistance(track, true);
  var duration = updateDuration(track);
  updateAverageSpeed(track, distance, duration);
  updateTime(track);

  // set the style config for the track
  var trackStyle = /** @type {!Object<string, *>} */ (osObject.unsafeClone(TRACK_CONFIG));
  var currentStyle = /** @type {!Object<string, *>} */ (osObject.unsafeClone(CURRENT_CONFIG));
  if (options.useLayerStyle) {
    delete trackStyle['stroke'];
    delete currentStyle['image'];
  } else {
    trackColor = trackColor || osStyle.DEFAULT_LAYER_COLOR;
    osStyle.setConfigColor(trackStyle, trackColor, [StyleField.STROKE]);
    osStyle.setConfigColor(currentStyle, trackColor, [StyleField.IMAGE]);
  }
  track.set(StyleType.FEATURE, [trackStyle, currentStyle]);

  if (options.label !== null) {
    // configure default label for the track
    osFeature.showLabel(track);
    var labelStyle = {
      'column': options.label || Fields.LOWERCASE_NAME,
      'showColumn': false
    };
    currentStyle[StyleField.LABELS] = [labelStyle];
  }

  // display the current position as an icon
  track.set(StyleField.SHAPE, osStyle.ShapeType.ICON);

  // update styles on the track
  osStyle.setFeatureStyle(track);

  return track;
};

/**
 * Creates a track from the provided options.
 *
 * @param {!CreateOptions} options The track creation options.
 * @return {TrackFeatureLike|undefined} The track feature.
 */
export const createTrack = function(options) {
  return createTrack_(options);
};

/**
 * Replace default createTrack implementation
 *
 * @param {!function(!CreateOptions):(TrackFeatureLike|undefined)} f The new implementation
 */
export const setCreateTrack = function(f) {
  createTrack_ = f;
};

/**
 * Adds coordinates or features to an existing track.
 * @param {!AddOptions} options The options.
 * @return {!Array<!(ol.Coordinate|Feature)>} The added coordinates or features, depending on the options.
 * @suppress {accessControls} To allow direct access to line coordinates.
 */
let addToTrack_ = function(options) {
  var added = [];
  var metadataMap = options.features && options.includeMetadata ? {} : undefined;

  var track = options.track;
  if (!track) {
    log.error(logger, 'Unable to add to track: track not provided.');
    return added;
  }

  var sortField = /** @type {string|undefined} */ (track.get(TrackField.SORT_FIELD));
  if (!sortField) {
    log.error(logger, 'Unable to add coordinates to track: track is missing sorting data.');
    return added;
  }

  var features = options.features;
  var coordinates = options.coordinates;
  if (!coordinates && !features) {
    log.error(logger, 'Unable to add to track: coordinates/features not provided.');
    return added;
  }

  if (!coordinates && features) {
    coordinates = getTrackCoordinates(features, sortField, metadataMap);

    var skippedFeatures = features.length - coordinates.length;
    if (skippedFeatures) {
      log.info(logger, 'Skipped ' + skippedFeatures + ' features due to unknown coordinate.');
    }
  } else if (coordinates) {
    coordinates.sort(sortCoordinatesByValue);
  }

  var skippedCoords = 0;
  if (coordinates.length) {
    // add point(s) to the original geometry, in case the track was interpolated
    var geometry = /** @type {!TrackLike} */ (track.get(interpolate.ORIGINAL_GEOM_FIELD) ||
        track.getGeometry());

    // merge the split line so coordinates can be added in the correct location
    geometry.toLonLat();
    geometry = geo.mergeLineGeometry(geometry);
    geometry.osTransform();

    var flatCoordinates = geometry.flatCoordinates;
    var stride = geometry.stride;

    for (var i = 0; i < coordinates.length; i++) {
      var coordinate = coordinates[i];
      if (coordinate.length != stride) {
        // if the coordinate length doesn't match the track geometry stride, it can't be inserted
        skippedCoords++;
        continue;
      }

      // figure out where the value fits in the array. if the value value already exists, just skip the feature to
      // avoid duplicate values.
      var value = /** @type {number|undefined} */ (coordinate[coordinate.length - 1]);
      var insertIndex = osArray.binaryStrideSearch(flatCoordinates, value, stride, stride - 1);
      if (insertIndex < 0) {
        // insert coordinates in the corresponding location
        googArray.insertArrayAt(flatCoordinates, coordinate, ~insertIndex);
        added.push(features ? features[i] : coordinate);
      } else {
        skippedCoords++;
      }
    }
  }

  // update the geometry on the track if coordinates were added
  if (skippedCoords < coordinates.length) {
    setGeometry(track, /** @type {!TrackLike} */ (geometry));

    if (metadataMap) {
      var existing = /** @type {Object|undefined} */ (track.get(TrackField.METADATA_MAP));
      if (!existing) {
        existing = {};
        track.set(TrackField.METADATA_MAP, existing);
      }
      assign(existing, metadataMap);
    }
  }

  if (skippedCoords) {
    log.info(logger, 'Skipped ' + skippedCoords +
        ' coordinates due to missing/duplicate sort value.');
  }

  return added;
};

/**
 * Adds coordinates or features to an existing track.
 * @param {!AddOptions} options The options.
 * @return {!Array<!(ol.Coordinate|Feature)>} The added coordinates or features, depending on the options.
 */
export const addToTrack = function(options) {
  return addToTrack_(options);
};

/**
 * Replace default addToTrack implementation
 *
 * @param {!function(!AddOptions):!Array<!(ol.Coordinate|Feature)>} f The new implementation
 */
export const setAddToTrack = function(f) {
  addToTrack_ = f;
};

/**
 * Clamp track points within the provided sort range.
 *
 * @param {!Feature} track The track.
 * @param {string|number} start The start value.
 * @param {string|number} end The end value.
 *
 * @suppress {accessControls} To allow direct access to feature metadata and line coordinates.
 */
export const clamp = function(track, start, end) {
  // add point(s) to the original geometry, in case the track was interpolated
  var geometry = /** @type {!(TrackLike)} */ (track.values_[interpolate.ORIGINAL_GEOM_FIELD] ||
      track.getGeometry());

  // merge the split line so features can be added in the correct location
  geometry.toLonLat();
  geometry = geo.mergeLineGeometry(geometry);
  geometry.osTransform();

  var stride = geometry.stride;

  var startIndex = osArray.binaryStrideSearch(geometry.flatCoordinates, start, stride, stride - 1);
  var endIndex = osArray.binaryStrideSearch(geometry.flatCoordinates, end, stride, stride - 1);

  if (startIndex < 0) {
    startIndex = ~startIndex;
  }

  if (endIndex < 0) {
    endIndex = ~endIndex;
  } else {
    endIndex += stride;
  }

  if (endIndex - startIndex != geometry.flatCoordinates.length) {
    var prevLength = geometry.flatCoordinates.length;
    if (startIndex < endIndex) {
      // splice the clamped range from the array
      var newCoords = geometry.flatCoordinates.splice(startIndex, endIndex - startIndex);

      // remove metadata for remaining coordinates
      pruneMetadata_(track, geometry.flatCoordinates, stride);

      // set flat coordinates to the clamped list
      geometry.flatCoordinates = newCoords;
    } else {
      geometry.flatCoordinates.length = 0;
      track.values_[TrackField.METADATA_MAP] = {};
    }

    // update the geometry on the track
    if (geometry.flatCoordinates.length !== prevLength) {
      setGeometry(track, geometry);
    }
  }
};

/**
 * Truncate a track to a maximum number of points. Keeps the most recent points.
 *
 * @param {!Feature} track The track.
 * @param {number} size The size.
 *
 * @suppress {accessControls} To allow direct access to feature metadata and line coordinates.
 */
export const truncate = function(track, size) {
  // ensure size is >= 0
  size = Math.max(0, size);

  // add point(s) to the original geometry, in case the track was interpolated
  var geometry = /** @type {!(TrackLike)} */ (track.values_[interpolate.ORIGINAL_GEOM_FIELD] ||
      track.getGeometry());

  if (geometry.getType() === GeometryType.MULTI_LINE_STRING) {
    // merge the split line so coordinates can be truncated to the correct size
    geometry.toLonLat();
    geometry = geo.mergeLineGeometry(geometry);
    geometry.osTransform();
  }

  var flatCoordinates = geometry.flatCoordinates;
  var stride = geometry.stride;
  var numCoords = size * stride;

  if (flatCoordinates.length > numCoords) {
    var removed = flatCoordinates.splice(0, flatCoordinates.length - numCoords);
    setGeometry(track, geometry);

    // remove old metadata fields from the track
    pruneMetadata_(track, removed, stride);
  }
};

/**
 * Prune the metadata map for a track, removing metadata by indexed sort values.
 * @param {!Feature} track The track.
 * @param {!Array} values The values to remove.
 * @param {number=} opt_stride If provided, the `values` array stride. Use if providing a list of flat coordinates that
 *                             contain sort values as the last coordinate value.
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
const pruneMetadata_ = function(track, values, opt_stride) {
  var stride = Math.max(0, opt_stride || 1);

  var metadataMap = /** @type {Object|undefined} */ (track.values_[TrackField.METADATA_MAP]);
  if (metadataMap) {
    for (var i = 0; i < values.length; i += stride) {
      var next = values[i + stride - 1];
      if (next != null) {
        metadataMap[next] = undefined;
      }
    }

    track.values_[TrackField.METADATA_MAP] = osObject.prune(metadataMap);
  }
};

/**
 * Dispose of the current position/line geometries and remove them from the feature.
 *
 * @param {!Feature} track The track
 */
export const disposeAnimationGeometries = function(track) {
  var currentPosition = track.get(TrackField.CURRENT_POSITION);
  track.set(TrackField.CURRENT_POSITION, undefined);
  dispose(currentPosition);

  var currentLine = track.get(TrackField.CURRENT_LINE);
  if (getShowLine(track)) {
    track.set(TrackField.CURRENT_LINE, undefined);
  }
  dispose(currentLine);
};

/**
 * Shows or hides the track line
 *
 * @param {!Feature} track The track
 * @param {boolean} show
 * @param {boolean=} opt_update
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
export const setShowLine = function(track, show, opt_update) {
  var trackStyles = /** @type {Array<Object<string, *>>} */ (track.values_[StyleType.FEATURE]);
  if (trackStyles.length > 1) {
    var lineConfig = trackStyles[0];
    var dynamic = track instanceof DynamicFeature && track.isDynamicEnabled;
    var lineGeometry = show ? (dynamic ? TrackField.CURRENT_LINE : undefined) : HIDE_GEOMETRY;
    if (lineConfig['geometry'] !== lineGeometry) {
      lineConfig['geometry'] = lineGeometry;

      // set the style config for the track
      osStyle.setFeatureStyle(track);
      track.changed();
    }
  }
};

/**
 * Shows or hides the track line
 *
 * @param {!Feature} track The track
 * @return {boolean}
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
export const getShowLine = function(track) {
  var trackStyles = /** @type {Array<Object<string, *>>} */ (track.values_[StyleType.FEATURE]);
  return trackStyles.length > 0 && trackStyles[0]['geometry'] != HIDE_GEOMETRY;
};

/**
 * Shows or hides the track marker
 *
 * @param {!Feature} track The track
 * @param {boolean} show
 * @param {boolean=} opt_update
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
export const setShowMarker = function(track, show, opt_update) {
  var trackStyles = /** @type {Array<Object<string, *>>} */ (track.values_[StyleType.FEATURE]);
  if (trackStyles.length > 1) { // recreate marker style
    var currentGeometry = show ? TrackField.CURRENT_POSITION : HIDE_GEOMETRY;
    var currentConfig = trackStyles[1];
    if (currentConfig['geometry'] !== currentGeometry ||
        track.values_[StyleField.LABEL_GEOMETRY] !== currentGeometry) {
      currentConfig['geometry'] = currentGeometry;
      track.values_[StyleField.LABEL_GEOMETRY] = currentGeometry;

      // set the style config for the track
      if (opt_update) {
        osStyle.setFeatureStyle(track);
        track.changed();
      }
    }
  }
};

/**
 * Turn interpolation of track marker on or off
 *
 * @param {!Feature} track The track
 * @param {boolean} doInterpolation
 */
export const setInterpolateMarker = function(track, doInterpolation) {
  track.set(TrackField.INTERPOLATE_MARKER, doInterpolation);
  var range = TimelineController.getInstance().getCurrentRange();
  updateDynamic(track, range.start, range.end);
};

/**
 * Get if interpolation of track marker is on or off
 *
 * @param {!Feature} track The track
 * @return {boolean}
 */
export const getInterpolateMarker = function(track) {
  return track.get(TrackField.INTERPOLATE_MARKER) !== false;
};

/**
 * Update the geometry for a track.
 *
 * @param {!Feature} track The track
 * @param {!ol.geom.Geometry} geometry The track geometry.
 */
export const setGeometry = function(track, geometry) {
  // split across the date line again
  geometry.toLonLat();
  geometry = geo.splitOnDateLine(geometry);
  geometry.osTransform();

  // prevent further normalization of the geometry
  geometry.set(GeometryField.NORMALIZED, true);

  // recreate animation geometries
  disposeAnimationGeometries(track);

  // update the original geometry and interpolate the track again
  track.set(interpolate.ORIGINAL_GEOM_FIELD, geometry);
  interpolate.interpolateFeature(track);

  // update metadata fields on the track
  var distance = updateDistance(track, true);
  var duration = updateDuration(track);
  updateAverageSpeed(track, distance, duration);
  updateTime(track);
  updateCurrentPosition(track);

  // notify listeners that the track geometry has changed
  track.dispatchEvent(new PropertyChangeEvent(DynamicPropertyChange.GEOMETRY));
};

/**
 * Update the current position displayed on a track.
 *
 * @param {!Feature} track The track
 *
 * @suppress {accessControls} To allow direct access to line coordinates.
 */
export const updateCurrentPosition = function(track) {
  var geometry = track.get(TrackField.CURRENT_LINE) || track.getGeometry();
  if (geometry) {
    var flatCoordinates = geometry.flatCoordinates;
    var stride = geometry.stride;
    var newPosition = flatCoordinates.slice(flatCoordinates.length - stride);

    // update the current position to the last coordinate in the track
    var currentPosition = /** @type {Point|undefined} */ (track.get(TrackField.CURRENT_POSITION));
    if (!currentPosition) {
      // doesn't exist, so create a new one and set it as the label geometry
      currentPosition = new Point(newPosition);
      track.set(TrackField.CURRENT_POSITION, currentPosition);
      track.set(StyleField.LABEL_GEOMETRY, TrackField.CURRENT_POSITION);
    } else {
      // update the existing position
      currentPosition.setFlatCoordinates(geometry.getLayout(), newPosition);
    }

    // update coordinate fields to display in the list/feature info
    osFeature.populateCoordFields(track, true, currentPosition);

    // update the extra metadata for the current position
    updateMetadata(track, flatCoordinates, stride);

    // update the style in case coordinate fields are used as labels
    osStyle.setFeatureStyle(track);
  }
};

/**
 * Update the distance column(s) on a track.
 *
 * @param {!Feature} track The track to update.
 * @param {boolean=} opt_updateTotal If the total distance should be updated.
 * @return {number} applied distance
 */
export const updateDistance = function(track, opt_updateTotal) {
  var um = UnitManager.getInstance();
  var distance = 0;
  if (opt_updateTotal) {
    // set the human-readable total distance on the track
    var geometry = track.getGeometry();
    var dist = getGeometryDistance(geometry);
    if (dist > 0) {
      distance = Math.round(dist * 100) / 100;
      track.set(TrackField.TOTAL_DISTANCE,
          um.formatToBestFit('distance', distance, 'm', um.getBaseSystem(), 3));
    } else {
      track.set(TrackField.TOTAL_DISTANCE, ELAPSED_ZERO);
    }
  }

  var current = /** @type {ol.geom.Geometry|undefined} */ (track.get(TrackField.CURRENT_LINE));
  if (current) {
    // set the human-readable elapsed distance on the track
    var dist = getGeometryDistance(current);
    if (dist > 0) {
      distance = Math.round(dist * 100) / 100;
      track.set(TrackField.ELAPSED_DISTANCE,
          um.formatToBestFit('distance', distance, 'm', um.getBaseSystem(), 3));
    } else {
      track.set(TrackField.ELAPSED_DISTANCE, ELAPSED_ZERO);
    }
  } else {
    // set to the total distance
    var geometry = track.getGeometry();
    var dist = getGeometryDistance(geometry);
    if (dist > 0) {
      distance = Math.round(dist * 100) / 100;
    }
    track.set(TrackField.ELAPSED_DISTANCE, track.get(TrackField.TOTAL_DISTANCE));
  }
  return distance;
};

/**
 * Update the duration column on a track.
 *
 * @param {!Feature} track The track to update
 * @return {number} the elapsed duration
 */
export const updateDuration = function(track) {
  var trackGeometry = /** @type {LineString} */ (track.getGeometry());
  var sortField = track.get(TrackField.SORT_FIELD);
  var duration = 0;
  if (trackGeometry && sortField == RecordField.TIME) {
    var coordinates = trackGeometry.getFlatCoordinates();
    var stride = trackGeometry.getStride();
    var startTime = coordinates[stride - 1];
    var endTime = coordinates[coordinates.length - 1];

    // set the human-readable duration on the track
    var totalDuration = endTime - startTime;
    track.set(TrackField.TOTAL_DURATION,
        totalDuration > 0 ? moment.duration(totalDuration).humanize() : TOTAL_ZERO);

    var current = /** @type {ol.geom.Geometry|undefined} */ (track.get(TrackField.CURRENT_LINE));
    if (current) {
      // partial track is being displayed, so compute the elapsed duration
      var currentRange = getGeometryTime(current);
      duration = Math.min(totalDuration, currentRange);
      track.set(TrackField.ELAPSED_DURATION,
          duration > 0 ? moment.duration(duration).humanize() : ELAPSED_ZERO);
    } else {
      // full track is being displayed, so use the total duration
      duration = totalDuration;
      track.set(TrackField.ELAPSED_DURATION, track.get(TrackField.TOTAL_DURATION));
    }
  } else {
    // the track does not have time values - can't resolve duration
    track.set(TrackField.ELAPSED_DURATION, TOTAL_ZERO);
    track.set(TrackField.TOTAL_DURATION, TOTAL_ZERO);
  }
  return duration;
};

/**
 * Update the average speed on a track
 *
 * @param {!Feature} track The track to update
 * @param {number} distance
 * @param {number} duration
 */
export const updateAverageSpeed = function(track, distance, duration) {
  var distanceString = ELAPSED_ZERO;
  if (distance > 0) {
    var dist = distance / (duration / 3600);
    distanceString = dist.toFixed(3) + ' km/h';
  }
  track.set(TrackField.ELAPSED_AVERAGE_SPEED, distanceString);
};

/**
 * Update the time range on a track.
 *
 * @param {!Feature} track The track to update
 */
export const updateTime = function(track) {
  var sortField = track.get(TrackField.SORT_FIELD);
  if (sortField == RecordField.TIME) {
    var oldTime = /** @type {ITime|undefined} */ (track.get(RecordField.TIME));
    var trackTime;

    var trackGeometry = /** @type {LineString} */ (track.getGeometry());
    if (trackGeometry) {
      var coordinates = trackGeometry.getFlatCoordinates();
      var stride = trackGeometry.getStride();
      var startTime = coordinates[stride - 1];
      var endTime = coordinates[coordinates.length - 1];
      trackTime = new TimeRange(startTime, endTime);
    }

    track.set(RecordField.TIME, trackTime);

    // update the source time model if:
    //  - times are not directly equal (both undefined) AND
    //  - either time is undefined, or the time range changed
    if (oldTime != trackTime && (!trackTime || !oldTime || !trackTime.equals(oldTime))) {
      var source = osFeature.getSource(track);
      if (source) {
        source.reindexTimeModel();
      }
    }
  }
};

/**
 * Get the distance for a line geometry.
 *
 * @param {ol.geom.Geometry|undefined} geometry The geometry.
 * @return {number} The distance.
 */
export const getGeometryDistance = function(geometry) {
  var distance = 0;

  if (geometry instanceof LineString) {
    geometry.toLonLat();
    distance = getLineDistance(geometry.getCoordinates());
    geometry.osTransform();
  } else if (geometry instanceof MultiLineString) {
    geometry.toLonLat();
    distance = getMultiLineDistance(geometry.getCoordinates());
    geometry.osTransform();
  }

  return distance;
};

/**
 * Get the distance (in meters) covered by a set of coordinates.
 *
 * @param {Array<ol.Coordinate>} coords The line coordinates
 * @return {number} The distance in meters
 */
export const getLineDistance = function(coords) {
  var distance = 0;
  if (coords && coords.length > 1) {
    for (var i = 1; i < coords.length; i++) {
      distance += osasm.geodesicInverse(coords[i - 1], coords[i]).distance;
    }
  }

  return distance;
};

/**
 * Get the distance (in meters) covered by a set of coordinates for a multi-line.
 *
 * @param {Array<Array<ol.Coordinate>>} coords The multi-line coordinates
 * @return {number} The distance in meters
 */
export const getMultiLineDistance = function(coords) {
  var distance = 0;
  if (coords) {
    coords.forEach(function(c) {
      distance += getLineDistance(c);
    });
  }

  return distance;
};

/**
 * Get the time for a line geometry.
 *
 * @param {ol.geom.Geometry|undefined} geometry The geometry.
 * @return {number} The time
 */
export const getGeometryTime = function(geometry) {
  var time = 0;

  if (geometry instanceof LineString) {
    time = getLineTime(geometry.getCoordinates());
  } else if (geometry instanceof MultiLineString) {
    time = getMultiLineTime(geometry.getCoordinates());
  }

  return time;
};

/**
 * Get the time (in seconds) covered by a set of coordinates.
 *
 * @param {Array<ol.Coordinate>} coords The line coordinates
 * @return {number} The time
 */
export const getLineTime = function(coords) {
  var time = 0;
  if (coords && coords.length > 1) {
    var first = coords[0];
    var last = coords[coords.length - 1];
    time = last[last.length - 1] - first[first.length - 1];
  }

  return time;
};

/**
 * Get the time (in meters) covered by a set of coordinates for a multi-line.
 *
 * @param {Array<Array<ol.Coordinate>>} coords The multi-line coordinates
 * @return {number} The time
 */
export const getMultiLineTime = function(coords) {
  var time = 0;
  if (coords) {
    coords.forEach(function(c) {
      time += getLineTime(c);
    });
  }

  return time;
};

/**
 * Test a feature to check if it has a value in the sort field.
 *
 * @param {!Feature} feature The feature
 * @param {string=} opt_sortField The sort field
 * @return {!Promise}
 */
export const getSortField = function(feature, opt_sortField) {
  return new Promise(function(resolve, reject) {
    var sortField = opt_sortField || RecordField.TIME;
    var getValueFn = sortField == RecordField.TIME ? getStartTime :
      getFeatureValue.bind(null, sortField);

    var value = getValueFn(feature);
    if (value == null || value == '') {
      var source = osFeature.getSource(feature);
      if (source) {
        var columns = source.getColumns();
        columns.sort(column.sortByField.bind(null, 'name'));

        var prompt;
        if (sortField == RecordField.TIME) {
          prompt = 'Track features do not have a time component. Please choose a column that can be used to sort ' +
              'points in the track.';
        } else {
          prompt = 'Features do not have a value defined for the sort field "' + sortField + '". ' +
              'Please choose a new column to sort points in the track:';
        }

        promptForField(columns, prompt).then(function(newColumn) {
          getSortField(feature, newColumn['field']).then(function(sortField) {
            resolve(sortField);
          }, function(err) {
            reject(EventType.CANCEL);
          });
        }, function() {
          reject(EventType.CANCEL);
        });
      }
    } else {
      // field is present, so resolve the promise
      resolve(sortField);
    }
  });
};

/**
 * Prompt the user to choose a track title.
 *
 * @param {string=} opt_default The default value
 * @return {!Promise}
 */
export const promptForTitle = function(opt_default) {
  return new Promise(function(resolve, reject) {
    ConfirmTextUI.launchConfirmText(/** @type {!osx.window.ConfirmTextOptions} */ ({
      confirm: resolve,
      cancel: reject,
      defaultValue: opt_default,
      select: true,
      prompt: 'Please provide a name for the track:',
      windowOptions: /** @type {!osx.window.WindowOptions} */ ({
        label: 'Track Name',
        icon: 'fa ' + ICON,
        modal: true
      })
    }));
  });
};

/**
 * Prompt the user to choose a track title, and if original metadata should be included.
 *
 * @param {string=} opt_default The default title. Defaults to an empty string.
 * @param {boolean=} opt_includeMetadata If metadata should be included. Defaults to false.
 * @return {!Promise}
 */
export const promptForTitleAndMetadata = function(opt_default = '', opt_includeMetadata = false) {
  let includeMetadata = opt_includeMetadata;
  const setIncludeMetadata = (value) => {
    includeMetadata = value;
  };

  return new Promise(function(resolve, reject) {
    ConfirmTextUI.launchConfirmText(/** @type {!osx.window.ConfirmTextOptions} */ ({
      confirm: (title) => {
        resolve({title, includeMetadata});
      },
      cancel: reject,
      defaultValue: opt_default,
      checkboxText: 'Include original metadata in track',
      checkbox: setIncludeMetadata,
      checkValue: includeMetadata,
      select: true,
      prompt: 'Please provide a name for the track:',
      windowOptions: /** @type {!osx.window.WindowOptions} */ ({
        label: 'Track Name',
        icon: 'fa ' + ICON,
        modal: true
      })
    }));
  });
};

/**
 * Prompt the user to choose a track.
 *
 * @param {Array<ColumnDefinition>} columns The columns
 * @param {string} prompt The dialog prompt
 * @return {!Promise}
 */
export const promptForField = function(columns, prompt) {
  return new Promise(function(resolve, reject) {
    ConfirmColumnUI.launchConfirmColumn(/** @type {!ConfirmColumnOptions} */ ({
      confirm: resolve,
      cancel: reject,
      columns: columns,
      prompt: prompt,
      windowOptions: /** @type {!osx.window.WindowOptions} */ ({
        label: 'Choose Track Sort Column',
        width: 400,
        icon: 'fa fa-warning',
        modal: true
      })
    }));
  });
};

/**
 * Switch the track to its animating state.
 *
 * @param {!Feature} track The track feature.
 */
export const initDynamic = function(track) {
  // switch the displayed track geometry to show the "current" line
  var trackStyles = /** @type {Array<Object<string, *>>} */ (track.get(StyleType.FEATURE));
  var trackStyle = trackStyles ? trackStyles[0] : null;
  if (trackStyle) {
    if (getShowLine(track)) {
      trackStyle['geometry'] = TrackField.CURRENT_LINE;
    }

    FeatureEditCtrl.restoreFeatureLabels(track);
    osStyle.setFeatureStyle(track);
  }
};

/**
 * Switch the track to its non-animating state.
 *
 * @param {!Feature} track The track feature.
 * @param {boolean=} opt_disposing If the feature is being disposed.
 */
export const disposeDynamic = function(track, opt_disposing) {
  // dispose of the current track geometry and remove it from the feature
  disposeAnimationGeometries(track);

  if (!opt_disposing) {
    // switch the style back to rendering the original track
    var trackStyles = /** @type {Array<Object<string, *>>} */ (track.get(StyleType.FEATURE));
    var trackStyle = trackStyles ? trackStyles[0] : null;
    if (trackStyle) {
      setShowMarker(track, true);
      if (getShowLine(track)) {
        delete trackStyle['geometry'];
      }
      osStyle.setFeatureStyle(track);
    }

    // reset coordinate fields and update time/distance to the full track
    var distance = updateDistance(track);
    var duration = updateDuration(track);
    updateAverageSpeed(track, distance, duration);
    updateCurrentPosition(track);
  }
};

/**
 * Update a track feature to represent the track at a provided timestamp.
 *
 * @param {!Feature} track The track.
 * @param {number} startTime The start timestamp.
 * @param {number} endTime The end timestamp.
 */
export const updateDynamic = function(track, startTime, endTime) {
  var sortField = track.get(TrackField.SORT_FIELD);
  if (sortField !== RecordField.TIME) {
    // isn't sorted by time - can't create a current track
    return;
  }

  var trackGeometry = track.getGeometry();
  if (!(trackGeometry instanceof LineString || trackGeometry instanceof MultiLineString)) {
    // shouldn't happen, but this will fail if the track isn't a line
    return;
  }

  var flatCoordinates = trackGeometry.getFlatCoordinates();
  var stride = trackGeometry.getStride();
  var ends = trackGeometry instanceof MultiLineString ? trackGeometry.getEnds() : undefined;
  var geomLayout = trackGeometry.getLayout();
  if (!flatCoordinates || (geomLayout !== GeometryLayout.XYM && geomLayout !== GeometryLayout.XYZM)) {
    // something is wrong with this line - abort!!
    return;
  }

  var startIndex = getTimeIndex(flatCoordinates, startTime, stride);
  var endIndex = getTimeIndex(flatCoordinates, endTime, stride);
  updateCurrentLine(track, startTime, startIndex, endTime, endIndex, flatCoordinates, stride, ends);

  var distance = updateDistance(track);
  var duration = updateDuration(track);
  updateAverageSpeed(track, distance, duration);
  track.changed();
};

/**
 * Update track metadata from original features.
 * @param {!Feature} track The track.
 * @param {!Array<number>} coordinates The flat coordinate array.
 * @param {number} stride The coordinate array stride.
 *
 * @suppress {accessControls} For direct access to track metadata.
 */
export const updateMetadata = function(track, coordinates, stride) {
  var metadataMap = track.get(TrackField.METADATA_MAP);
  if (metadataMap) {
    // use metadata for the last sort value (end of the track)
    var valueIndex = coordinates.length - 1;
    var metadata = metadataMap[coordinates[valueIndex]];
    if (!metadata && valueIndex > stride) {
      // last value may have been interpolated, so try the one before it
      metadata = metadataMap[coordinates[valueIndex - stride]];
    }

    if (metadata) {
      for (var key in metadata) {
        track.values_[key] = metadata[key];
      }
    }
  }
};

/**
 * Get the closest index in the timestamp array for a time value.
 *
 * @param {!Array<number>} coordinates The timestamp array
 * @param {number} value The time value to find
 * @param {number} stride The coordinate array stride.
 * @return {number}
 */
export const getTimeIndex = function(coordinates, value, stride) {
  // find the closest timestamp to the current timeline position
  var index = osArray.binaryStrideSearch(coordinates, value, stride, stride - 1);
  if (index < 0) {
    // if current isn't in the array, goog.array.binarySearch will return (-(insertion point) - 1)
    index = -index - 1;
  }

  return index;
};

/**
 * Get the position of a track at a given time. If the time falls between known points on the track, the position will
 * be linearly interpolated between the known points.
 *
 * @param {!Feature} track The track.
 * @param {number} timestamp The timestamp.
 * @param {number} index The index of the most recent known coordinate.
 * @param {!Array<number>} coordinates The flat track coordinate array.
 * @param {number} stride The stride of the coordinate array.
 * @return {ol.Coordinate|undefined}
 */
export const getTrackPositionAt = function(track, timestamp, index, coordinates, stride) {
  var position;

  if (index === 0) {
    // current is before the track starts - show the first position
    position = coordinates.slice(0, stride);
  } else if (index === coordinates.length) {
    // current is after the track ends - show the last position
    position = coordinates.slice(coordinates.length - stride);
  } else {
    // interpolate the current position based on the timestamp/coordinate on either side of the timestamp
    var prevTime = coordinates[index - 1];
    var nextTime = coordinates[index + stride - 1];
    var scale = (timestamp - prevTime) / (nextTime - prevTime);

    // get the start index of each coordinate to avoid slicing the array (and resulting GC)
    var prevIndex = index - stride;
    var nextIndex = index;
    if (getInterpolateMarker(track)) {
      position = [
        math.lerp(coordinates[prevIndex], coordinates[nextIndex], scale),
        math.lerp(coordinates[prevIndex + 1], coordinates[nextIndex + 1], scale)
      ];
    } else {
      position = [
        coordinates[prevIndex],
        coordinates[prevIndex + 1]
      ];
    }

    // interpolate altitude if present
    if (stride === 4) {
      if (getInterpolateMarker(track)) {
        position.push(math.lerp(coordinates[prevIndex + 2], coordinates[nextIndex + 2], scale));
      } else {
        position.push(coordinates[prevIndex + 2]);
      }
    }

    position.push(timestamp);
  }

  return position;
};

/**
 * Update the track's line geometry to display its position up to the provided timestamp.
 *
 * @param {!Feature} track The track.
 * @param {number} startTime The start timestamp.
 * @param {number} startIndex The start index of the starting coordinate.
 * @param {number} endTime The end timestamp.
 * @param {number} endIndex The index of the most recent known coordinate.
 * @param {!Array<number>} coordinates The flat track coordinate array.
 * @param {number} stride The stride of the coordinate array.
 * @param {Array<number>=} opt_ends The end indicies of each line in a multi-line. Undefined if not a multi-line.
 *
 * @suppress {accessControls} To allow direct access to line string coordinates.
 */
export const updateCurrentLine = function(track, startTime, startIndex, endTime, endIndex, coordinates, stride,
    opt_ends) {
  var currentLine = /** @type {TrackLike|undefined} */ (track.get(TrackField.CURRENT_LINE));
  var layout = stride === 4 ? GeometryLayout.XYZM : GeometryLayout.XYM;
  if (!currentLine) {
    // create the line geometry if it doesn't exist yet. must use an empty coordinate array instead of null, or the
    // layout will be set to XY
    currentLine = opt_ends ? new MultiLineString([], layout) : new LineString([], layout);
    track.set(TrackField.CURRENT_LINE, currentLine);
  }

  // test if the current line appears to have the correct coordinates already. if so, do not modify it.
  var flatCoordinates = currentLine.flatCoordinates;
  if (flatCoordinates.length === endIndex - startIndex &&
      (!flatCoordinates.length || (flatCoordinates[0] === coordinates[startIndex] &&
          flatCoordinates[flatCoordinates.length - stride] === coordinates[endIndex - stride]))) {
    // show the marker on the last point if it's after the timeline range start
    var show = !!flatCoordinates.length &&
        flatCoordinates[flatCoordinates.length - 1] >= TimelineController.getInstance().getCurrentRange().start;
    setShowMarker(track, show, true);
    return;
  }

  // slice the original array to get the current line coordinates
  flatCoordinates = coordinates.slice(startIndex, endIndex);

  // if ends have been provided, we're working with a MultiLineString and they will need to be recomputed for the
  // partial line
  var currentEnds;
  var startIndexIsEnd = false;
  var endIndexIsEnd = false;
  if (opt_ends) {
    currentEnds = [];

    for (var i = 0; i < opt_ends.length; i++) {
      var end = opt_ends[i];

      // track if the current segment starts or ends on a multi-line end
      startIndexIsEnd = startIndexIsEnd || end === startIndex;
      endIndexIsEnd = endIndexIsEnd || end === endIndex;

      // if the end is between the current indices
      if (end > startIndex && end <= endIndex) {
        // add it, offset by the start index
        currentEnds.push(end - startIndex);
      }
    }
  }

  // interpolate the current position if we haven't exhausted the available coordinates and the last known position
  // isn't at one of the ends. if the current position is an end, the current time is between tracks in a multi track.
  if (flatCoordinates.length < coordinates.length &&
      (!currentEnds || !currentEnds.length || currentEnds[currentEnds.length - 1] !== flatCoordinates.length)) {
    // interpolate the start position if the current line starts past the first index and is not on a multi-line end
    //
    // if the line starts at a multi-line end, the start time is between tracks in a multi track.
    //
    if (startIndex > 0 && !startIndexIsEnd) {
      var interpolatedStart = getTrackPositionAt(track, startTime, startIndex, coordinates, stride);
      if (interpolatedStart && interpolatedStart.length === stride) {
        var i = interpolatedStart.length;
        while (i--) {
          flatCoordinates.unshift(interpolatedStart[i]);
        }

        // offset ends by the extra coordinate length
        if (currentEnds) {
          for (i = 0; i < currentEnds.length; i++) {
            currentEnds[i] += stride;
          }
        }
      }
    }

    //
    // interpolate the end position if we haven't exhausted the available coordinates and the last known position
    // isn't at one of the ends.
    //
    // if the line ends at a multi-line end, the end time is between tracks in a multi track.
    //
    if (endIndex < coordinates.length && !endIndexIsEnd) {
      var end = getTrackPositionAt(track, endTime, endIndex, coordinates, stride);
      if (end && end.length === stride) {
        for (var i = 0; i < end.length; i++) {
          flatCoordinates.push(end[i]);
        }
      }

      // end the current line segment at the interpolated position
      if (currentEnds) {
        currentEnds.push(flatCoordinates.length);
      }
    }

    if (endIndex == 0 || startIndex === coordinates.length) {
      setShowMarker(track, false);
    } else {
      setShowMarker(track, true);
    }
  }

  // update the current line geometry
  if (currentLine instanceof LineString) {
    currentLine.setFlatCoordinates(layout, flatCoordinates);
  } else if (currentEnds) {
    currentLine.setFlatCoordinates(layout, flatCoordinates, currentEnds);
  }

  // update the current position marker
  updateCurrentPosition(track);
};

/**
 * Update the z-index for a list of tracks. Ensures the current position icon for all tracks will be displayed on top
 * of the line string for every other track passed to the function.
 *
 * @param {!Array<!Feature>} tracks The track features.
 */
export const updateTrackZIndex = function(tracks) {
  // save the top z-index so current position icons can be displayed above tracks
  var topTrackZIndex = tracks.length + 1;
  for (var i = 0; i < tracks.length; i++) {
    var track = tracks[i];
    var trackStyles = /** @type {!Array<!Object<string, *>>} */ (track.get(StyleType.FEATURE));
    if (!Array.isArray(trackStyles)) {
      trackStyles = [trackStyles];
    }

    for (var j = 0; j < trackStyles.length; j++) {
      var style = trackStyles[j];
      style['zIndex'] = tracks.length - i;

      // display current position icon above track lines
      if (style['geometry'] == TrackField.CURRENT_POSITION) {
        style['zIndex'] += topTrackZIndex;
      }
    }

    // update styles on the track and
    osStyle.setFeatureStyle(track);
    track.changed();
  }
};

/**
 * Bucket features by a field.
 * @param {string} field The field.
 * @param {Feature} feature The feature.
 * @return {?} The field value.
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
export const bucketByField = function(field, feature) {
  if (feature) {
    // if the feature does not have a value for the field, add it to the ignore bucket so it can be included in the
    // result. this avoids dropping features that aren't added to a track.
    return feature.values_[field] != null ? feature.values_[field] : osObject.IGNORE_VAL;
  }

  // no feature, don't add to a bucket
  return undefined;
};

/**
 * Split features into tracks.
 * @param {SplitOptions} options The options.
 * @return {!Array<!Feature>} The resulting tracks. Also contains any features not used to create tracks.
 */
export const splitIntoTracks = function(options) {
  var features = options.features;
  var result = options.result || [];
  var bucketFn = options.bucketFn || (options.field ? bucketByField.bind(undefined, options.field) : null);
  var getTrackFn = options.getTrackFn || fn.noop;

  if (features && bucketFn) {
    var buckets = googArray.bucket(features, bucketFn);

    for (var id in buckets) {
      var bucketFeatures = buckets[id];
      if (id === osObject.IGNORE_VAL) {
        // features did not have a value for the provided field, so return them to the result array
        for (var i = 0; i < bucketFeatures.length; i++) {
          result.push(bucketFeatures[i]);
        }
      } else {
        var trackId = id + '-track';
        var track = getTrackFn(trackId);
        if (track) {
          addToTrack({
            features: bucketFeatures,
            track: track,
            includeMetadata: true
          });
        } else {
          track = createTrack({
            id: trackId,
            name: id,
            features: bucketFeatures,
            includeMetadata: true,
            label: null,
            useLayerStyle: true
          });

          if (track) {
            result.push(track);
          }
        }
      }
    }
  }

  return result;
};

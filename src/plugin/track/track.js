goog.module('plugin.track');
goog.module.declareLegacyNamespace();

const googArray = goog.require('goog.array');
const log = goog.require('goog.log');
const array = goog.require('os.array');
const CommandProcessor = goog.require('os.command.CommandProcessor');
const osFeature = goog.require('os.feature');
const geo = goog.require('os.geo');
const PlacesManager = goog.require('plugin.places.PlacesManager');

const AlertManager = goog.require('os.alert.AlertManager');
const AlertEventSeverity = goog.require('os.alert.AlertEventSeverity');
const interpolate = goog.require('os.interpolate');
const osTrack = goog.require('os.track');
const kml = goog.require('plugin.file.kml');
const KMLNodeAdd = goog.require('plugin.file.kml.cmd.KMLNodeAdd');

const OlFeature = goog.requireType('ol.Feature');
const OlGeometry = goog.requireType('ol.geom.Geometry');

/**
 * Base logger for the track plugin.
 * @type {log.Logger}
 */
const LOGGER_ = log.getLogger('plugin.track');

/**
 * Identifier for track plugin components.
 * @type {string}
 */
const ID = 'track';

/**
 * Settings key to enable/disable the "Predicted" Tracks feature
 * @type {string}
 */
const PREDICT = 'plugin.track.predict';

/**
 * The FontAwesome track icon.
 * @type {string}
 *
 * @deprecated Please use `osTrack.ICON` instead.
 */
const ICON = osTrack.ICON;

/**
 * Feature metadata fields used by tracks
 * @enum {string}
 *
 * @deprecated Please use `osTrack.TrackField` instead.
 */
const TrackField = osTrack.TrackField;

/**
 * Test if a feature is a track.
 *
 * @param {OlFeature} feature The feature.
 * @return {boolean} If the feature is a track.
 *
 * @deprecated Please use `osTrack.isTrackFeature` instead.
 */
const isTrackFeature = osTrack.isTrackFeature;

/**
 * Gets a field value from a feature.
 *
 * @param {string} field
 * @param {OlFeature} feature
 * @return {*} The value
 *
 * @deprecated Please use `osTrack.getFeatureValue` instead.
 */
const getFeatureValue = osTrack.getFeatureValue;

/**
 * Get the start time for a feature.
 *
 * @param {OlFeature} feature
 * @return {number|undefined} The value
 *
 * @deprecated Please use `osTrack.getStartTime` instead.
 */
const getStartTime = osTrack.getStartTime;

/**
 * Sort track coordinates by their sort field.
 *
 * @param {!ol.Coordinate} a The first coordinate to be compared.
 * @param {!ol.Coordinate} b The second coordinate to be compared.
 * @return {number} The sort value.
 *
 * @deprecated Please use `osTrack.sortCoordinatesByValue` instead.
 */
const sortCoordinatesByValue = osTrack.sortCoordinatesByValue;

/**
 * Get a list of coordinates to include in a track from a set of features. The features must have a common field with
 * values that can be naturally sorted. Any features lacking a point geometry or a value in the sort field will be
 * ignored. If sorted by `os.data.RecordField.TIME`, the track may be animated over time.
 *
 * @param {!Array<!OlFeature>} features The features.
 * @param {string} sortField The track sort field.
 * @return {!Array<!ol.Coordinate>|undefined} The coordinates, or undefined if no coordinates were found.
 *
 * @deprecated Please use `osTrack.getTrackCoordinates` instead.
 */
const getTrackCoordinates = osTrack.getTrackCoordinates;

/**
 * Creates a track from the provided options.
 *
 * @param {!osTrack.CreateOptions} options The track creation options.
 * @return {osTrack.TrackFeatureLike|undefined} The track feature.
 *
 * @deprecated Please use `os.track.createTrack` instead.
 */
const createTrack = osTrack.createTrack;

/**
 * Adds coordinates or features to an existing track.
 * @param {!osTrack.AddOptions} options The options.
 * @return {!Array<!(ol.Coordinate|OlFeature)>} The added coordinates or features, depending on the options.
 *
 * @deprecated Please use `os.track.addToTrack` instead.
 */
const addToTrack = osTrack.addToTrack;

/**
 * Clamp track points within the provided sort range.
 *
 * @param {!OlFeature} track The track.
 * @param {string|number} start The start value.
 * @param {string|number} end The end value.
 *
 * @deprecated Please use `osTrack.clamp` instead.
 */
const clamp = osTrack.clamp;

/**
 * Dispose of the current position/line geometries and remove them from the feature.
 *
 * @param {!OlFeature} track The track
 *
 * @deprecated Please use `osTrack.disposeAnimationGeometries` instead.
 */
const disposeAnimationGeometries = osTrack.disposeAnimationGeometries;

/**
 * Shows or hides the track line
 *
 * @param {!OlFeature} track The track
 * @param {boolean} show
 * @param {boolean=} opt_update
 *
 * @deprecated Please use `osTrack.setShowLine` instead.
 */
const setShowLine = osTrack.setShowLine;

/**
 * Shows or hides the track line
 *
 * @param {!OlFeature} track The track
 * @return {boolean}
 *
 * @deprecated Please use `osTrack.getShowLine` instead.
 */
const getShowLine = osTrack.getShowLine;

/**
 * Shows or hides the track marker
 *
 * @param {!OlFeature} track The track
 * @param {boolean} show
 * @param {boolean=} opt_update
 *
 * @deprecated Please use `osTrack.setShowMarker` instead.
 */
const setShowMarker = osTrack.setShowMarker;

/**
 * Turn interpolation of track marker on or off
 *
 * @param {!OlFeature} track The track
 * @param {boolean} doInterpolation
 *
 * @deprecated Please use `osTrack.setInterpolateMarker` instead.
 */
const setInterpolateMarker = osTrack.setInterpolateMarker;

/**
 * Get if interpolation of track marker is on or off
 *
 * @param {!OlFeature} track The track
 * @return {boolean}
 *
 * @deprecated Please use `osTrack.getInterpolateMarker` instead.
 */
const getInterpolateMarker = osTrack.getInterpolateMarker;

/**
 * Update the geometry for a track.
 *
 * @param {!OlFeature} track The track
 * @param {!OlGeometry} geometry The track geometry.
 *
 * @deprecated Please use `osTrack.setGeometry` instead.
 */
const setGeometry = osTrack.setGeometry;

/**
 * Update the current position displayed on a track.
 *
 * @param {!OlFeature} track The track
 *
 * @deprecated Please use `osTrack.updateCurrentPosition` instead.
 */
const updateCurrentPosition = osTrack.updateCurrentPosition;

/**
 * Update the distance column(s) on a track.
 *
 * @param {!OlFeature} track The track to update.
 * @param {boolean=} opt_updateTotal If the total distance should be updated.
 * @return {number} applied distance
 *
 * @deprecated Please use `osTrack.updateDistance` instead.
 */
const updateDistance = osTrack.updateDistance;

/**
 * Update the duration column on a track.
 *
 * @param {!OlFeature} track The track to update
 * @return {number} the elapsed duration
 *
 * @deprecated Please use `osTrack.updateDuration` instead.
 */
const updateDuration = osTrack.updateDuration;

/**
 * Update the average speed on a track
 *
 * @param {!OlFeature} track The track to update
 * @param {number} distance
 * @param {number} duration
 *
 * @deprecated Please use `osTrack.updateAverageSpeed` instead.
 */
const updateAverageSpeed = osTrack.updateAverageSpeed;

/**
 * Update the time range on a track.
 *
 * @param {!OlFeature} track The track to update
 *
 * @deprecated Please use `osTrack.updateTime` instead.
 */
const updateTime = osTrack.updateTime;

/**
 * Get the distance for a line geometry.
 *
 * @param {OlGeometry|undefined} geometry The geometry.
 * @return {number} The distance.
 *
 * @deprecated Please use `osTrack.getGeometryDistance` instead.
 */
const getGeometryDistance = osTrack.getGeometryDistance;

/**
 * Get the distance (in meters) covered by a set of coordinates.
 *
 * @param {Array<ol.Coordinate>} coords The line coordinates
 * @return {number} The distance in meters
 *
 * @deprecated Please use `osTrack.getLineDistance` instead.
 */
const getLineDistance = osTrack.getLineDistance;

/**
 * Get the distance (in meters) covered by a set of coordinates for a multi-line.
 *
 * @param {Array<Array<ol.Coordinate>>} coords The multi-line coordinates
 * @return {number} The distance in meters
 *
 * @deprecated Please use `osTrack.getMultiLineDistance` instead.
 */
const getMultiLineDistance = osTrack.getMultiLineDistance;

/**
 * Get the time for a line geometry.
 *
 * @param {OlGeometry|undefined} geometry The geometry.
 * @return {number} The time
 *
 * @deprecated Please use `osTrack.getGeometryTime` instead.
 */
const getGeometryTime = osTrack.getGeometryTime;

/**
 * Get the time (in seconds) covered by a set of coordinates.
 *
 * @param {Array<ol.Coordinate>} coords The line coordinates
 * @return {number} The time
 *
 * @deprecated Please use `osTrack.getLineTime` instead.
 */
const getLineTime = osTrack.getLineTime;

/**
 * Get the time (in meters) covered by a set of coordinates for a multi-line.
 *
 * @param {Array<Array<ol.Coordinate>>} coords The multi-line coordinates
 * @return {number} The time
 *
 * @deprecated Please use `osTrack.getMultiLineTime` instead.
 */
const getMultiLineTime = osTrack.getMultiLineTime;

/**
 * Test a feature to check if it has a value in the sort field.
 *
 * @param {!OlFeature} feature The feature
 * @param {string=} opt_sortField The sort field
 * @return {!goog.Promise}
 *
 * @deprecated Please use `osTrack.getSortField` instead.
 */
const getSortField = osTrack.getSortField;

/**
 * Prompt the user to choose a track title.
 *
 * @param {string=} opt_default The default value
 * @return {!goog.Promise}
 *
 * @deprecated Please use `osTrack.promptForTitle` instead.
 */
const promptForTitle = osTrack.promptForTitle;

/**
 * Prompt the user to choose a track.
 *
 * @param {Array<os.data.ColumnDefinition>} columns The columns
 * @param {string} prompt The dialog prompt
 * @return {!goog.Promise}
 *
 * @deprecated Please use `osTrack.promptForField` instead.
 */
const promptForField = osTrack.promptForField;

/**
 * Switch the track to its animating state.
 *
 * @param {!OlFeature} track The track feature.
 *
 * @deprecated Please use `osTrack.initDynamic` instead.
 */
const initDynamic = osTrack.initDynamic;

/**
 * Switch the track to its non-animating state.
 *
 * @param {!OlFeature} track The track feature.
 * @param {boolean=} opt_disposing If the feature is being disposed.
 *
 * @deprecated Please use `osTrack.disposeDynamic` instead.
 */
const disposeDynamic = osTrack.disposeDynamic;

/**
 * Update a track feature to represent the track at a provided timestamp.
 *
 * @param {!OlFeature} track The track.
 * @param {number} startTime The start timestamp.
 * @param {number} endTime The end timestamp.
 *
 * @deprecated Please use `osTrack.updateDynamic` instead.
 */
const updateDynamic = osTrack.updateDynamic;

/**
 * Get the closest index in the timestamp array for a time value.
 *
 * @param {!Array<number>} coordinates The timestamp array
 * @param {number} value The time value to find
 * @param {number} stride The coordinate array stride.
 * @return {number}
 *
 * @deprecated Please use `osTrack.getTimeIndex` instead.
 */
const getTimeIndex = osTrack.getTimeIndex;

/**
 * Get the position of a track at a given time. If the time falls between known points on the track, the position will
 * be linearly interpolated between the known points.
 *
 * @param {!OlFeature} track The track.
 * @param {number} timestamp The timestamp.
 * @param {number} index The index of the most recent known coordinate.
 * @param {!Array<number>} coordinates The flat track coordinate array.
 * @param {number} stride The stride of the coordinate array.
 * @return {ol.Coordinate|undefined}
 *
 * @deprecated Please use `osTrack.getTrackPositionAt` instead.
 */
const getTrackPositionAt = osTrack.getTrackPositionAt;

/**
 * Update the track's line geometry to display its position up to the provided timestamp.
 *
 * @param {!OlFeature} track The track.
 * @param {number} startTime The start timestamp.
 * @param {number} startIndex The start index of the starting coordinate.
 * @param {number} endTime The end timestamp.
 * @param {number} endIndex The index of the most recent known coordinate.
 * @param {!Array<number>} coordinates The flat track coordinate array.
 * @param {number} stride The stride of the coordinate array.
 * @param {Array<number>=} opt_ends The end indicies of each line in a multi-line. Undefined if not a multi-line.
 *
 * @deprecated Please use `osTrack.updateCurrentLine` instead.
 */
const updateCurrentLine = osTrack.updateCurrentLine;

/**
 * Update the z-index for a list of tracks. Ensures the current position icon for all tracks will be displayed on top
 * of the line string for every other track passed to the function.
 *
 * @param {!Array<!OlFeature>} tracks The track features.
 *
 * @deprecated Please use `osTrack.updateTrackZIndex` instead.
 */
const updateTrackZIndex = osTrack.updateTrackZIndex;

/**
 * Creates a track and adds it to the Saved Places layer.
 *
 * @param {!osTrack.CreateOptions} options The options object for the track.
 * @return {osTrack.TrackFeatureLike|undefined} The track feature.
 */
let createAndAdd_ = function(options) {
  var track = osTrack.createTrack(options);

  if (!track) {
    var msg = 'Track creation failed. There were no valid features/coordinates to create a track.';
    AlertManager.getInstance().sendAlert(msg, AlertEventSeverity.WARNING);
    return;
  }

  var trackNode = kml.ui.updatePlacemark({
    'feature': track
  });

  var rootNode = PlacesManager.getInstance().getPlacesRoot();
  if (rootNode) {
    var cmd = new KMLNodeAdd(trackNode, rootNode);
    cmd.title = 'Create Track';
    CommandProcessor.getInstance().addCommand(cmd);

    updateTrackSource(track);

    return track;
  } else {
    log.error(LOGGER_, 'Unable to create track: track layer missing');
  }

  return;
};

/**
 * Creates a track and adds it to the Saved Places layer.
 *
 * @param {!osTrack.CreateOptions} options The options object for the track.
 * @return {osTrack.TrackFeatureLike|undefined} The track feature.
 */
const createAndAdd = function(options) {
  return createAndAdd_(options);
};

/**
 * Replace default createAndAdd implementation
 *
 * @param {!function(!osTrack.CreateOptions):(osTrack.TrackFeatureLike|undefined)} f The new implementation
 */
const setCreateAndAdd = function(f) {
  createAndAdd_ = f;
};

/**
 * Adds a set of features to a track.
 *
 * @param {!OlFeature} track The track
 * @param {!Array<!OlFeature>} features The features to add to the track
 * @return {!Array<!OlFeature>} return the non-duplicate features
 *
 * @suppress {accessControls}
 *
 * @deprecated Please use `osTrack.addToTrack` instead.
 */
const addFeaturesToTrack = function(track, features) {
  var addedFeatures = /** @type {!Array<!OlFeature>} */ ([]);
  var sortField = /** @type {string|undefined} */ (track.get(osTrack.TrackField.SORT_FIELD));
  if (!sortField) {
    log.error(LOGGER_, 'Unable to add features to track: track is missing sorting data.');
    return addedFeatures;
  }

  var coordinates = osTrack.getTrackCoordinates(features, sortField);
  var skipped = features.length - coordinates.length;

  if (coordinates.length) {
    // add point(s) to the original geometry, in case the track was interpolated
    var geometry = /** @type {!osTrack.TrackLike} */ (track.get(interpolate.ORIGINAL_GEOM_FIELD) ||
        track.getGeometry());

    // merge the split line so features can be added in the correct location
    geometry.toLonLat();
    geometry = geo.mergeLineGeometry(geometry);
    geometry.osTransform();

    var flatCoordinates = geometry.flatCoordinates;
    var stride = geometry.stride;

    for (var i = 0; i < coordinates.length; i++) {
      var coordinate = coordinates[i];

      // figure out where the value fits in the array. if the value value already exists, just skip the feature to
      // avoid duplicate values.
      var value = /** @type {number|undefined} */ (coordinate[coordinate.length - 1]);
      var insertIndex = array.binaryStrideSearch(flatCoordinates, value, stride, stride - 1);
      if (insertIndex < 0) {
        // insert coordinates in the corresponding location
        googArray.insertArrayAt(flatCoordinates, coordinate, ~insertIndex);
        addedFeatures.push(features[i]); // coordinates should be at the same index as the features
      } else {
        skipped++;
      }
    }
  }

  // update the geometry on the track if features were added
  if (skipped < features.length) {
    osTrack.setGeometry(track, /** @type {!osTrack.TrackLike} */ (geometry));
  }

  if (skipped) {
    log.info(LOGGER_, 'Skipped ' + skipped + ' features due to missing/duplicate sort value.');
  }

  return addedFeatures;
};

/**
 * Update the track source
 * @param {osTrack.TrackFeatureLike|undefined} track
 */
const updateTrackSource = function(track) {
  if (track) {
    var source = osFeature.getSource(track);
    if (source) {
      // Add track-specific columns to the source for display in feature UI's.
      source.addColumn(osTrack.TrackField.ELAPSED_AVERAGE_SPEED);
      source.addColumn(osTrack.TrackField.ELAPSED_DISTANCE);
      source.addColumn(osTrack.TrackField.ELAPSED_DURATION);
      source.addColumn(osTrack.TrackField.TOTAL_DISTANCE);
      source.addColumn(osTrack.TrackField.TOTAL_DURATION);

      // Add metadata fields captured from the original data to the source, for display in feature UI's.
      // This assumes all added features have the same fields to avoid unnecessary iteration over the entire map.
      var metadataMap = track.get(osTrack.TrackField.METADATA_MAP);
      if (metadataMap) {
        for (var key in metadataMap) {
          var first = metadataMap[key];
          for (var field in first) {
            source.addColumn(field);
          }

          break;
        }
      }
    }
  }
};

exports = {
  ID,
  ICON,
  PREDICT,
  TrackField,
  isTrackFeature,
  getFeatureValue,
  getStartTime,
  sortCoordinatesByValue,
  getTrackCoordinates,
  createTrack,
  addToTrack,
  clamp,
  disposeAnimationGeometries,
  setShowLine,
  getShowLine,
  setShowMarker,
  setInterpolateMarker,
  getInterpolateMarker,
  setGeometry,
  updateCurrentPosition,
  updateDistance,
  updateDuration,
  updateAverageSpeed,
  updateTime,
  getGeometryDistance,
  getLineDistance,
  getMultiLineDistance,
  getGeometryTime,
  getLineTime,
  getMultiLineTime,
  getSortField,
  promptForTitle,
  promptForField,
  initDynamic,
  disposeDynamic,
  updateDynamic,
  getTimeIndex,
  getTrackPositionAt,
  updateCurrentLine,
  updateTrackZIndex,
  createAndAdd,
  setCreateAndAdd,
  addFeaturesToTrack,
  updateTrackSource
};

goog.provide('plugin.track');

goog.require('os.alert.AlertEventSeverity');
goog.require('os.interpolate');
goog.require('os.style');
goog.require('os.track');
goog.require('plugin.file.kml');
goog.require('plugin.file.kml.cmd.KMLNodeAdd');


/**
 * Base logger for the track plugin.
 * @type {goog.log.Logger}
 * @private
 * @const
 */
plugin.track.LOGGER_ = goog.log.getLogger('plugin.track');


/**
 * Identifier for track plugin components.
 * @type {string}
 * @const
 */
plugin.track.ID = 'track';


/**
 * The FontAwesome track icon.
 * @type {string}
 * @const
 *
 * @deprecated Please use `os.track.ICON` instead.
 */
plugin.track.ICON = os.track.ICON;


/**
 * Feature metadata fields used by tracks
 * @enum {string}
 *
 * @deprecated Please use `os.track.TrackField` instead.
 */
plugin.track.TrackField = os.track.TrackField;


/**
 * Test if a feature is a track.
 *
 * @param {ol.Feature} feature The feature.
 * @return {boolean} If the feature is a track.
 *
 * @deprecated Please use `os.track.isTrackFeature` instead.
 */
plugin.track.isTrackFeature = os.track.isTrackFeature;


/**
 * Gets a field value from a feature.
 *
 * @param {string} field
 * @param {ol.Feature} feature
 * @return {*} The value
 *
 * @deprecated Please use `os.track.getFeatureValue` instead.
 */
plugin.track.getFeatureValue = os.track.getFeatureValue;


/**
 * Get the start time for a feature.
 *
 * @param {ol.Feature} feature
 * @return {number|undefined} The value
 *
 * @deprecated Please use `os.track.getStartTime` instead.
 */
plugin.track.getStartTime = os.track.getStartTime;


/**
 * Sort track coordinates by their sort field.
 *
 * @param {!ol.Coordinate} a The first coordinate to be compared.
 * @param {!ol.Coordinate} b The second coordinate to be compared.
 * @return {number} The sort value.
 *
 * @deprecated Please use `os.track.sortCoordinatesByValue` instead.
 */
plugin.track.sortCoordinatesByValue = os.track.sortCoordinatesByValue;


/**
 * Get a list of coordinates to include in a track from a set of features. The features must have a common field with
 * values that can be naturally sorted. Any features lacking a point geometry or a value in the sort field will be
 * ignored. If sorted by `os.data.RecordField.TIME`, the track may be animated over time.
 *
 * @param {!Array<!ol.Feature>} features The features.
 * @param {string} sortField The track sort field.
 * @return {!Array<!ol.Coordinate>|undefined} The coordinates, or undefined if no coordinates were found.
 *
 * @deprecated Please use `os.track.getTrackCoordinates` instead.
 */
plugin.track.getTrackCoordinates = os.track.getTrackCoordinates;


/**
 * Creates a track from the provided options.
 *
 * @param {!os.track.CreateOptions} options The track creation options.
 * @return {os.track.TrackFeatureLike|undefined} The track feature.
 *
 * @deprecated Please use `os.track.createTrack` instead.
 */
plugin.track.createTrack = os.track.createTrack;


/**
 * Adds coordinates or features to an existing track.
 * @param {!os.track.AddOptions} options The options.
 * @return {!Array<!(ol.Coordinate|ol.Feature)>} The added coordinates or features, depending on the options.
 *
 * @deprecated Please use `os.track.addToTrack` instead.
 */
plugin.track.addToTrack = os.track.addToTrack;


/**
 * Clamp track points within the provided sort range.
 *
 * @param {!ol.Feature} track The track.
 * @param {string|number} start The start value.
 * @param {string|number} end The end value.
 *
 * @deprecated Please use `os.track.clamp` instead.
 */
plugin.track.clamp = os.track.clamp;


/**
 * Dispose of the current position/line geometries and remove them from the feature.
 *
 * @param {!ol.Feature} track The track
 *
 * @deprecated Please use `os.track.disposeAnimationGeometries` instead.
 */
plugin.track.disposeAnimationGeometries = os.track.disposeAnimationGeometries;


/**
 * Shows or hides the track line
 *
 * @param {!ol.Feature} track The track
 * @param {boolean} show
 * @param {boolean=} opt_update
 *
 * @deprecated Please use `os.track.setShowLine` instead.
 */
plugin.track.setShowLine = os.track.setShowLine;


/**
 * Shows or hides the track line
 *
 * @param {!ol.Feature} track The track
 * @return {boolean}
 *
 * @deprecated Please use `os.track.getShowLine` instead.
 */
plugin.track.getShowLine = os.track.getShowLine;


/**
 * Shows or hides the track marker
 *
 * @param {!ol.Feature} track The track
 * @param {boolean} show
 * @param {boolean=} opt_update
 *
 * @deprecated Please use `os.track.setShowMarker` instead.
 */
plugin.track.setShowMarker = os.track.setShowMarker;


/**
 * Turn interpolation of track marker on or off
 *
 * @param {!ol.Feature} track The track
 * @param {boolean} doInterpolation
 *
 * @deprecated Please use `os.track.setInterpolateMarker` instead.
 */
plugin.track.setInterpolateMarker = os.track.setInterpolateMarker;


/**
 * Get if interpolation of track marker is on or off
 *
 * @param {!ol.Feature} track The track
 * @return {boolean}
 *
 * @deprecated Please use `os.track.getInterpolateMarker` instead.
 */
plugin.track.getInterpolateMarker = os.track.getInterpolateMarker;


/**
 * Update the geometry for a track.
 *
 * @param {!ol.Feature} track The track
 * @param {!ol.geom.Geometry} geometry The track geometry.
 *
 * @deprecated Please use `os.track.setGeometry` instead.
 */
plugin.track.setGeometry = os.track.setGeometry;


/**
 * Update the current position displayed on a track.
 *
 * @param {!ol.Feature} track The track
 *
 * @deprecated Please use `os.track.updateCurrentPosition` instead.
 */
plugin.track.updateCurrentPosition = os.track.updateCurrentPosition;


/**
 * Update the distance column(s) on a track.
 *
 * @param {!ol.Feature} track The track to update.
 * @param {boolean=} opt_updateTotal If the total distance should be updated.
 * @return {number} applied distance
 *
 * @deprecated Please use `os.track.updateDistance` instead.
 */
plugin.track.updateDistance = os.track.updateDistance;


/**
 * Update the duration column on a track.
 *
 * @param {!ol.Feature} track The track to update
 * @return {number} the elapsed duration
 *
 * @deprecated Please use `os.track.updateDuration` instead.
 */
plugin.track.updateDuration = os.track.updateDuration;


/**
 * Update the average speed on a track
 *
 * @param {!ol.Feature} track The track to update
 * @param {number} distance
 * @param {number} duration
 *
 * @deprecated Please use `os.track.updateAverageSpeed` instead.
 */
plugin.track.updateAverageSpeed = os.track.updateAverageSpeed;


/**
 * Update the time range on a track.
 *
 * @param {!ol.Feature} track The track to update
 *
 * @deprecated Please use `os.track.updateTime` instead.
 */
plugin.track.updateTime = os.track.updateTime;


/**
 * Get the distance for a line geometry.
 *
 * @param {ol.geom.Geometry|undefined} geometry The geometry.
 * @return {number} The distance.
 *
 * @deprecated Please use `os.track.getGeometryDistance` instead.
 */
plugin.track.getGeometryDistance = os.track.getGeometryDistance;


/**
 * Get the distance (in meters) covered by a set of coordinates.
 *
 * @param {Array<ol.Coordinate>} coords The line coordinates
 * @return {number} The distance in meters
 *
 * @deprecated Please use `os.track.getLineDistance` instead.
 */
plugin.track.getLineDistance = os.track.getLineDistance;


/**
 * Get the distance (in meters) covered by a set of coordinates for a multi-line.
 *
 * @param {Array<Array<ol.Coordinate>>} coords The multi-line coordinates
 * @return {number} The distance in meters
 *
 * @deprecated Please use `os.track.getMultiLineDistance` instead.
 */
plugin.track.getMultiLineDistance = os.track.getMultiLineDistance;


/**
 * Get the time for a line geometry.
 *
 * @param {ol.geom.Geometry|undefined} geometry The geometry.
 * @return {number} The time
 *
 * @deprecated Please use `os.track.getGeometryTime` instead.
 */
plugin.track.getGeometryTime = os.track.getGeometryTime;


/**
 * Get the time (in seconds) covered by a set of coordinates.
 *
 * @param {Array<ol.Coordinate>} coords The line coordinates
 * @return {number} The time
 *
 * @deprecated Please use `os.track.getLineTime` instead.
 */
plugin.track.getLineTime = os.track.getLineTime;


/**
 * Get the time (in meters) covered by a set of coordinates for a multi-line.
 *
 * @param {Array<Array<ol.Coordinate>>} coords The multi-line coordinates
 * @return {number} The time
 *
 * @deprecated Please use `os.track.getMultiLineTime` instead.
 */
plugin.track.getMultiLineTime = os.track.getMultiLineTime;


/**
 * Test a feature to check if it has a value in the sort field.
 *
 * @param {!ol.Feature} feature The feature
 * @param {string=} opt_sortField The sort field
 * @return {!goog.Promise}
 *
 * @deprecated Please use `os.track.getSortField` instead.
 */
plugin.track.getSortField = os.track.getSortField;


/**
 * Prompt the user to choose a track title.
 *
 * @param {string=} opt_default The default value
 * @return {!goog.Promise}
 *
 * @deprecated Please use `os.track.promptForTitle` instead.
 */
plugin.track.promptForTitle = os.track.promptForTitle;


/**
 * Prompt the user to choose a track.
 *
 * @param {Array<os.data.ColumnDefinition>} columns The columns
 * @param {string} prompt The dialog prompt
 * @return {!goog.Promise}
 *
 * @deprecated Please use `os.track.promptForField` instead.
 */
plugin.track.promptForField = os.track.promptForField;


/**
 * Switch the track to its animating state.
 *
 * @param {!ol.Feature} track The track feature.
 *
 * @deprecated Please use `os.track.initDynamic` instead.
 */
plugin.track.initDynamic = os.track.initDynamic;


/**
 * Switch the track to its non-animating state.
 *
 * @param {!ol.Feature} track The track feature.
 * @param {boolean=} opt_disposing If the feature is being disposed.
 *
 * @deprecated Please use `os.track.disposeDynamic` instead.
 */
plugin.track.disposeDynamic = os.track.disposeDynamic;


/**
 * Update a track feature to represent the track at a provided timestamp.
 *
 * @param {!ol.Feature} track The track.
 * @param {number} startTime The start timestamp.
 * @param {number} endTime The end timestamp.
 *
 * @deprecated Please use `os.track.updateDynamic` instead.
 */
plugin.track.updateDynamic = os.track.updateDynamic;


/**
 * Get the closest index in the timestamp array for a time value.
 *
 * @param {!Array<number>} coordinates The timestamp array
 * @param {number} value The time value to find
 * @param {number} stride The coordinate array stride.
 * @return {number}
 *
 * @deprecated Please use `os.track.getTimeIndex` instead.
 */
plugin.track.getTimeIndex = os.track.getTimeIndex;


/**
 * Get the position of a track at a given time. If the time falls between known points on the track, the position will
 * be linearly interpolated between the known points.
 *
 * @param {!ol.Feature} track The track.
 * @param {number} timestamp The timestamp.
 * @param {number} index The index of the most recent known coordinate.
 * @param {!Array<number>} coordinates The flat track coordinate array.
 * @param {number} stride The stride of the coordinate array.
 * @return {ol.Coordinate|undefined}
 *
 * @deprecated Please use `os.track.getTrackPositionAt` instead.
 */
plugin.track.getTrackPositionAt = os.track.getTrackPositionAt;


/**
 * Update the track's line geometry to display its position up to the provided timestamp.
 *
 * @param {!ol.Feature} track The track.
 * @param {number} startTime The start timestamp.
 * @param {number} startIndex The start index of the starting coordinate.
 * @param {number} endTime The end timestamp.
 * @param {number} endIndex The index of the most recent known coordinate.
 * @param {!Array<number>} coordinates The flat track coordinate array.
 * @param {number} stride The stride of the coordinate array.
 * @param {Array<number>=} opt_ends The end indicies of each line in a multi-line. Undefined if not a multi-line.
 *
 * @deprecated Please use `os.track.updateCurrentLine` instead.
 */
plugin.track.updateCurrentLine = os.track.updateCurrentLine;


/**
 * Update the z-index for a list of tracks. Ensures the current position icon for all tracks will be displayed on top
 * of the line string for every other track passed to the function.
 *
 * @param {!Array<!ol.Feature>} tracks The track features.
 *
 * @deprecated Please use `os.track.updateTrackZIndex` instead.
 */
plugin.track.updateTrackZIndex = os.track.updateTrackZIndex;


/**
 * Creates a track and adds it to the Saved Places layer.
 *
 * @param {!os.track.CreateOptions} options The options object for the track.
 * @return {os.track.TrackFeatureLike|undefined} The track feature.
 */
plugin.track.createAndAdd = function(options) {
  var track = os.track.createTrack(options);

  if (!track) {
    var msg = 'Track creation failed. There were no valid features/coordinates to create a track.';
    os.alertManager.sendAlert(msg, os.alert.AlertEventSeverity.WARNING);
    return;
  }

  var trackNode = plugin.file.kml.ui.updatePlacemark({
    'feature': track
  });

  var rootNode = plugin.places.PlacesManager.getInstance().getPlacesRoot();
  if (rootNode) {
    var cmd = new plugin.file.kml.cmd.KMLNodeAdd(trackNode, rootNode);
    cmd.title = 'Create Track';
    os.command.CommandProcessor.getInstance().addCommand(cmd);

    return track;
  } else {
    goog.log.error(plugin.track.LOGGER_, 'Unable to create track: track layer missing');
  }

  return;
};


/**
 * Adds a set of features to a track.
 *
 * @param {!ol.Feature} track The track
 * @param {!Array<!ol.Feature>} features The features to add to the track
 * @return {!Array<!ol.Feature>} return the non-duplicate features
 *
 * @suppress {accessControls}
 *
 * @deprecated Please use `os.track.addToTrack` instead.
 */
plugin.track.addFeaturesToTrack = function(track, features) {
  var addedFeatures = /** @type {!Array<!ol.Feature>} */ ([]);
  var sortField = /** @type {string|undefined} */ (track.get(os.track.TrackField.SORT_FIELD));
  if (!sortField) {
    goog.log.error(plugin.track.LOGGER_, 'Unable to add features to track: track is missing sorting data.');
    return addedFeatures;
  }

  var coordinates = os.track.getTrackCoordinates(features, sortField);
  var skipped = features.length - coordinates.length;

  if (coordinates.length) {
    // add point(s) to the original geometry, in case the track was interpolated
    var geometry = /** @type {!os.track.TrackLike} */ (track.get(os.interpolate.ORIGINAL_GEOM_FIELD) ||
        track.getGeometry());

    // merge the split line so features can be added in the correct location
    geometry.toLonLat();
    geometry = os.geo.mergeLineGeometry(geometry);
    geometry.osTransform();

    var flatCoordinates = geometry.flatCoordinates;
    var stride = geometry.stride;

    for (var i = 0; i < coordinates.length; i++) {
      var coordinate = coordinates[i];

      // figure out where the value fits in the array. if the value value already exists, just skip the feature to
      // avoid duplicate values.
      var value = /** @type {number|undefined} */ (coordinate[coordinate.length - 1]);
      var insertIndex = os.array.binaryStrideSearch(flatCoordinates, value, stride, stride - 1);
      if (insertIndex < 0) {
        // insert coordinates in the corresponding location
        goog.array.insertArrayAt(flatCoordinates, coordinate, ~insertIndex);
        addedFeatures.push(features[i]); // coordinates should be at the same index as the features
      } else {
        skipped++;
      }
    }
  }

  // update the geometry on the track if features were added
  if (skipped < features.length) {
    os.track.setGeometry(track, /** @type {!os.track.TrackLike} */ (geometry));
  }

  if (skipped) {
    goog.log.info(plugin.track.LOGGER_, 'Skipped ' + skipped + ' features due to missing/duplicate sort value.');
  }

  return addedFeatures;
};

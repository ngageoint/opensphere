goog.provide('os.track');

goog.require('goog.Promise');
goog.require('ol.Feature');
goog.require('ol.geom.LineString');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.Point');
goog.require('os.Fields');
goog.require('os.alert.AlertEventSeverity');
goog.require('os.config');
goog.require('os.data.RecordField');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.feature');
goog.require('os.feature.DynamicFeature');
goog.require('os.feature.DynamicPropertyChange');
goog.require('os.geom.GeometryField');
goog.require('os.interpolate');
goog.require('os.object');
goog.require('os.ogc.filter.OGCFilterOverride');
goog.require('os.style');
goog.require('os.time.TimeRange');
goog.require('os.ui.file.kml');
goog.require('os.ui.window');
goog.require('os.ui.window.confirmColumnDirective');
goog.require('os.ui.window.confirmDirective');
goog.require('os.ui.window.confirmTextDirective');


/**
 * Logger.
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.track.LOGGER_ = goog.log.getLogger('os.track');


/**
 * Identifier for track components.
 * @type {string}
 * @const
 */
os.track.ID = 'track';


/**
 * The FontAwesome track icon.
 * @type {string}
 * @const
 */
os.track.ICON = 'fa-share-alt';


/**
 * Text to display when elapsed distance/duration is zero.
 * @type {number}
 */
os.track.ELAPSED_ZERO = 0;


/**
 * Text to display when total distance/duration is zero.
 * @type {string}
 */
os.track.TOTAL_ZERO = 'Unknown';


/**
 * A type representing a track geometry. Tracks will use a `ol.geom.MultiLineString` if they cross the date line (to
 * render correctly in Openlayers), or if they represent a multi-track.
 * @typedef {ol.geom.LineString|ol.geom.MultiLineString}
 */
os.track.TrackLike;


/**
 * A type representing a track feature. Tracks will use `os.feature.DynamicFeature` if they have a time component and
 * can be animated, `ol.Feature` otherwise.
 * @typedef {os.feature.DynamicFeature|ol.Feature}
 */
os.track.TrackFeatureLike;


/**
 * @typedef {{
 *   coordinates: (Array<!ol.Coordinate>|undefined),
 *   features: (Array<!ol.Feature>|undefined),
 *   track: !ol.Feature,
 *   includeMetadata: (boolean|undefined)
 * }}
 */
os.track.AddOptions;


/**
 * @typedef {{
 *   coordinates: (Array<!ol.Coordinate>|undefined),
 *   features: (Array<!ol.Feature>|undefined),
 *   geometry: (os.track.TrackLike|undefined),
 *   id: (string|undefined),
 *   color: (string|undefined),
 *   name: (string|undefined),
 *   sortField: (string|undefined),
 *   label: (string|null|undefined),
 *   includeMetadata: (boolean|undefined),
 *   useLayerStyle: (boolean|undefined)
 * }}
 */
os.track.CreateOptions;


/**
 * @typedef {{
 *   features: Array<ol.Feature>,
 *   field: string,
 *   getTrackFn: ((function((string|number)):ol.Feature)|undefined),
 *   result: (Array<ol.Feature>|undefined)
 * }}
 */
os.track.SplitOptions;



/**
 * Feature metadata fields used by tracks
 * @enum {string}
 */
os.track.TrackField = {
  ELAPSED_AVERAGE_SPEED: 'ELAPSED_AVERAGE_SPEED',
  ELAPSED_DISTANCE: 'ELAPSED_DISTANCE',
  ELAPSED_DURATION: 'ELAPSED_DURATION',
  TOTAL_DISTANCE: 'TOTAL_DISTANCE',
  TOTAL_DURATION: 'TOTAL_DURATION',
  CURRENT_POSITION: '_currentPosition',
  CURRENT_LINE: '_currentLine',
  QUERY_OPTIONS: '_trackQueryOptions',
  ORIG_SOURCE_ID: '_trackOrigSourceId',
  SORT_FIELD: '_sortField',
  INTERPOLATE_MARKER: '_interpolateMarker',
  METADATA_MAP: '_trackMetadataMap'
};


/**
 * Style config for the track.
 * @type {!Object<string, *>}
 * @const
 */
os.track.TRACK_CONFIG = {
  'stroke': {
    'width': os.style.DEFAULT_STROKE_WIDTH
  },
  'zIndex': 0
};


/**
 * Style config for the track current position marker.
 * @type {!Object<string, *>}
 * @const
 */
os.track.CURRENT_CONFIG = {
  'geometry': os.track.TrackField.CURRENT_POSITION,
  'image': {
    'type': 'icon',
    'scale': 1,
    'src': os.ui.file.kml.DEFAULT_ICON_PATH
  }
};


/**
 * Style used for hiding geometries such as the line and marker
 */
os.track.HIDE_GEOMETRY = '__hidden__';


/**
 * Test if a feature is a track.
 *
 * @param {ol.Feature} feature The feature.
 * @return {boolean} If the feature is a track.
 */
os.track.isTrackFeature = function(feature) {
  return !!feature && feature.get(os.data.RecordField.FEATURE_TYPE) === os.track.ID;
};


/**
 * Gets a field value from a feature.
 *
 * @param {string} field
 * @param {ol.Feature} feature
 * @return {*} The value
 */
os.track.getFeatureValue = function(field, feature) {
  return feature ? feature.get(field) : undefined;
};


/**
 * Get the start time for a feature.
 *
 * @param {ol.Feature} feature
 * @return {number|undefined} The value
 */
os.track.getStartTime = function(feature) {
  var time = feature ? /** @type {os.time.ITime|undefined} */ (feature.get(os.data.RecordField.TIME)) : undefined;
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
os.track.sortCoordinatesByValue = function(a, b) {
  var aValue = a[a.length - 1];
  var bValue = b[b.length - 1];
  return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
};


/**
 * Get a list of coordinates to include in a track from a set of features. The features must have a common field with
 * values that can be naturally sorted. Any features lacking a point geometry or a value in the sort field will be
 * ignored. If sorted by `os.data.RecordField.TIME`, the track may be animated over time.
 *
 * @param {!Array<!ol.Feature>} features The features.
 * @param {string} sortField The track sort field.
 * @param {Object=} opt_metadataMap Optional map to store feature metadata by sort key.
 * @return {!Array<!ol.Coordinate>|undefined} The coordinates, or undefined if no coordinates were found.
 */
os.track.getTrackCoordinates = function(features, sortField, opt_metadataMap) {
  var getValueFn = sortField == os.data.RecordField.TIME ? os.track.getStartTime :
    os.track.getFeatureValue.bind(null, sortField);

  var coordinates = features.map(function(feature) {
    var pointCoord;
    var value = /** @type {number|undefined} */ (getValueFn(feature));
    if (value == null) {
      // ignore the feature if it doesn't have a sort value
      return undefined;
    }

    var geometry = feature.getGeometry();
    if (geometry instanceof ol.geom.Point) {
      pointCoord = geometry.getFirstCoordinate();
    } else if (geometry instanceof ol.geom.GeometryCollection) {
      var geometries = geometry.getGeometriesArray();
      for (var i = 0; i < geometries.length; i++) {
        var next = geometries[i];
        if (next instanceof ol.geom.Point) {
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
    } else if (geometry instanceof ol.geom.MultiPoint) {
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

        var props = feature.getProperties();
        for (var key in props) {
          if (!os.feature.isInternalField(key)) {
            opt_metadataMap[value][key] = props[key];
          }
        }
      }
    }

    return pointCoord;
  }).filter(os.fn.filterFalsey);

  // sort the resulting coordinates by the sort value
  coordinates.sort(os.track.sortCoordinatesByValue);

  return coordinates;
};


/**
 * Creates a track from the provided options.
 *
 * @param {!os.track.CreateOptions} options The track creation options.
 * @return {os.track.TrackFeatureLike|undefined} The track feature.
 */
os.track.createTrack = function(options) {
  var sortField = options.sortField || os.data.RecordField.TIME;
  var trackColor = options.color;
  var coordinates = options.coordinates;
  var features = options.features;
  var geometry = options.geometry;
  var metadataMap = options.features && options.includeMetadata ? {} : undefined;

  if (!geometry) {
    if (coordinates) {
      coordinates.sort(os.track.sortCoordinatesByValue);
    } else if (features && features.length) {
      coordinates = os.track.getTrackCoordinates(features, sortField, metadataMap);

      // if the color wasn't provided via options, determine the color from the features/source
      if (!trackColor && features.length) {
        trackColor = /** @type {string|undefined} */ (features[0].get(os.data.RecordField.COLOR));

        if (!trackColor) {
          var source = os.feature.getSource(features[0]);
          if (source) {
            trackColor = source ? source.getColor() : undefined;
          }
        }
      }
    }

    if (coordinates && coordinates.length) {
      geometry = new ol.geom.LineString(coordinates, ol.geom.GeometryLayout.XYZM);
    }
  }

  if (!geometry) {
    return undefined;
  }

  if (geometry instanceof ol.geom.LineString) {
    geometry.toLonLat();
    geometry = os.geo.splitOnDateLine(geometry);
    geometry.osTransform();
  }

  // prevent any further normalization of the geometry
  geometry.set(os.geom.GeometryField.NORMALIZED, true);
  geometry.set(os.interpolate.METHOD_FIELD, os.interpolate.Method.NONE);

  // create the track feature
  var track;
  if (sortField === os.data.RecordField.TIME) {
    track = new os.feature.DynamicFeature(geometry,
        os.track.initDynamic,
        os.track.disposeDynamic,
        os.track.updateDynamic);
  } else {
    track = new ol.Feature(geometry);
  }

  var trackId = options.id || (os.track.ID + '-' + goog.string.getRandomString());
  track.setId(trackId);
  track.set(os.Fields.ID, trackId);
  track.set(os.data.RecordField.FEATURE_TYPE, os.track.ID);

  if (metadataMap) {
    track.set(os.track.TrackField.METADATA_MAP, metadataMap);
  }

  // add a geometry to display the current track position
  os.track.updateCurrentPosition(track);

  // set the track name, defaulting to the id if one isn't provided
  track.set(os.Fields.LOWERCASE_NAME, options.name || trackId);

  // save the field used to sort coordinates in the track
  track.set(os.track.TrackField.SORT_FIELD, sortField);

  var distance = os.track.updateDistance(track, true);
  var duration = os.track.updateDuration(track);
  os.track.updateAverageSpeed(track, distance, duration);
  os.track.updateTime(track);

  // set the style config for the track
  var trackStyle = /** @type {!Object<string, *>} */ (os.object.unsafeClone(os.track.TRACK_CONFIG));
  var currentStyle = /** @type {!Object<string, *>} */ (os.object.unsafeClone(os.track.CURRENT_CONFIG));
  if (options.useLayerStyle) {
    delete trackStyle['stroke'];
    delete currentStyle['image'];
  } else {
    trackColor = trackColor || os.style.DEFAULT_LAYER_COLOR;
    os.style.setConfigColor(trackStyle, trackColor, [os.style.StyleField.STROKE]);
    os.style.setConfigColor(currentStyle, trackColor, [os.style.StyleField.IMAGE]);
  }
  track.set(os.style.StyleType.FEATURE, [trackStyle, currentStyle]);

  if (options.label !== null) {
    // configure default label for the track
    os.feature.showLabel(track);
    var labelStyle = {
      'column': options.label || os.Fields.LOWERCASE_NAME,
      'showColumn': false
    };
    currentStyle[os.style.StyleField.LABELS] = [labelStyle];
  }

  // display the current position as an icon
  track.set(os.style.StyleField.SHAPE, os.style.ShapeType.ICON);

  // update styles on the track
  os.style.setFeatureStyle(track);

  return track;
};


/**
 * Adds coordinates or features to an existing track.
 * @param {!os.track.AddOptions} options The options.
 * @return {!Array<!(ol.Coordinate|ol.Feature)>} The added coordinates or features, depending on the options.
 * @suppress {accessControls} To allow direct access to line coordinates.
 */
os.track.addToTrack = function(options) {
  var added = [];
  var metadataMap = options.features && options.includeMetadata ? {} : undefined;

  var track = options.track;
  if (!track) {
    goog.log.error(os.track.LOGGER_, 'Unable to add to track: track not provided.');
    return added;
  }

  var sortField = /** @type {string|undefined} */ (track.get(os.track.TrackField.SORT_FIELD));
  if (!sortField) {
    goog.log.error(os.track.LOGGER_, 'Unable to add coordinates to track: track is missing sorting data.');
    return added;
  }

  var features = options.features;
  var coordinates = options.coordinates;
  if (!coordinates && !features) {
    goog.log.error(os.track.LOGGER_, 'Unable to add to track: coordinates/features not provided.');
    return added;
  }

  if (!coordinates && features) {
    coordinates = os.track.getTrackCoordinates(features, sortField, metadataMap);

    var skippedFeatures = features.length - coordinates.length;
    if (skippedFeatures) {
      goog.log.info(os.track.LOGGER_, 'Skipped ' + skippedFeatures + ' features due to unknown coordinate.');
    }
  } else if (coordinates) {
    coordinates.sort(os.track.sortCoordinatesByValue);
  }

  var skippedCoords = 0;
  if (coordinates.length) {
    // add point(s) to the original geometry, in case the track was interpolated
    var geometry = /** @type {!os.track.TrackLike} */ (track.get(os.interpolate.ORIGINAL_GEOM_FIELD) ||
        track.getGeometry());

    // merge the split line so coordinates can be added in the correct location
    geometry.toLonLat();
    geometry = os.geo.mergeLineGeometry(geometry);
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
      var insertIndex = os.array.binaryStrideSearch(flatCoordinates, value, stride, stride - 1);
      if (insertIndex < 0) {
        // insert coordinates in the corresponding location
        goog.array.insertArrayAt(flatCoordinates, coordinate, ~insertIndex);
        added.push(features ? features[i] : coordinate);
      } else {
        skippedCoords++;
      }
    }
  }

  // update the geometry on the track if coordinates were added
  if (skippedCoords < coordinates.length) {
    os.track.setGeometry(track, /** @type {!os.track.TrackLike} */ (geometry));

    if (metadataMap) {
      var existing = /** @type {Object|undefined} */ (track.get(os.track.TrackField.METADATA_MAP));
      if (!existing) {
        existing = {};
        track.set(os.track.TrackField.METADATA_MAP, existing);
      }
      ol.obj.assign(existing, metadataMap);
    }
  }

  if (skippedCoords) {
    goog.log.info(os.track.LOGGER_, 'Skipped ' + skippedCoords +
        ' coordinates due to missing/duplicate sort value.');
  }

  return added;
};


/**
 * Clamp track points within the provided sort range.
 *
 * @param {!ol.Feature} track The track.
 * @param {string|number} start The start value.
 * @param {string|number} end The end value.
 *
 * @suppress {accessControls} To allow direct access to line coordinates.
 */
os.track.clamp = function(track, start, end) {
  // add point(s) to the original geometry, in case the track was interpolated
  var geometry = /** @type {!(os.track.TrackLike)} */ (track.get(os.interpolate.ORIGINAL_GEOM_FIELD) ||
      track.getGeometry());

  // merge the split line so features can be added in the correct location
  geometry.toLonLat();
  geometry = os.geo.mergeLineGeometry(geometry);
  geometry.osTransform();

  var flatCoordinates = geometry.flatCoordinates;
  var stride = geometry.stride;

  var startIndex = os.array.binaryStrideSearch(flatCoordinates, start, stride, stride - 1);
  var endIndex = os.array.binaryStrideSearch(flatCoordinates, end, stride, stride - 1);

  if (startIndex < 0) {
    startIndex = ~startIndex;
  }

  if (endIndex < 0) {
    endIndex = ~endIndex;
  } else {
    endIndex += stride;
  }

  var prevLength = flatCoordinates.length;
  if (startIndex < endIndex) {
    flatCoordinates.length = endIndex;
    flatCoordinates.splice(0, startIndex);
  } else {
    flatCoordinates.length = 0;
  }

  // update the geometry on the track
  if (flatCoordinates.length !== prevLength) {
    os.track.setGeometry(track, geometry);
  }
};


/**
 * Dispose of the current position/line geometries and remove them from the feature.
 *
 * @param {!ol.Feature} track The track
 */
os.track.disposeAnimationGeometries = function(track) {
  var currentPosition = track.get(os.track.TrackField.CURRENT_POSITION);
  track.set(os.track.TrackField.CURRENT_POSITION, undefined);
  goog.dispose(currentPosition);

  var currentLine = track.get(os.track.TrackField.CURRENT_LINE);
  if (os.track.getShowLine(track)) {
    track.set(os.track.TrackField.CURRENT_LINE, undefined);
  }
  goog.dispose(currentLine);
};


/**
 * Shows or hides the track line
 *
 * @param {!ol.Feature} track The track
 * @param {boolean} show
 * @param {boolean=} opt_update
 */
os.track.setShowLine = function(track, show, opt_update) {
  var trackStyles = /** @type {Array<Object<string, *>>} */ (track.get(os.style.StyleType.FEATURE));
  if (trackStyles.length > 1) {
    var lineConfig = trackStyles[0];
    var dynamic = track instanceof os.feature.DynamicFeature && track.isDynamicEnabled;
    lineConfig['geometry'] = show ? (dynamic ? os.track.TrackField.CURRENT_LINE : undefined) :
      os.track.HIDE_GEOMETRY;

    // set the style config for the track
    os.style.setFeatureStyle(track);
    track.changed();
  }
};


/**
 * Shows or hides the track line
 *
 * @param {!ol.Feature} track The track
 * @return {boolean}
 */
os.track.getShowLine = function(track) {
  var trackStyles = /** @type {Array<Object<string, *>>} */ (track.get(os.style.StyleType.FEATURE));
  return trackStyles.length > 0 && trackStyles[0]['geometry'] != os.track.HIDE_GEOMETRY;
};


/**
 * Shows or hides the track marker
 *
 * @param {!ol.Feature} track The track
 * @param {boolean} show
 * @param {boolean=} opt_update
 */
os.track.setShowMarker = function(track, show, opt_update) {
  var trackStyles = /** @type {Array<Object<string, *>>} */ (track.get(os.style.StyleType.FEATURE));
  if (trackStyles.length > 1) { // recreate marker style
    var currentGeometry = show ? os.track.TrackField.CURRENT_POSITION : os.track.HIDE_GEOMETRY;
    var currentConfig = trackStyles[1];
    currentConfig['geometry'] = currentGeometry;
    track.set(os.style.StyleField.LABEL_GEOMETRY, currentGeometry);

    // set the style config for the track
    if (opt_update) {
      os.style.setFeatureStyle(track);
      track.changed();
    }
  }
};


/**
 * Turn interpolation of track marker on or off
 *
 * @param {!ol.Feature} track The track
 * @param {boolean} doInterpolation
 */
os.track.setInterpolateMarker = function(track, doInterpolation) {
  track.set(os.track.TrackField.INTERPOLATE_MARKER, doInterpolation);
  var range = os.time.TimelineController.getInstance().getCurrentRange();
  os.track.updateDynamic(track, range.start, range.end);
};


/**
 * Get if interpolation of track marker is on or off
 *
 * @param {!ol.Feature} track The track
 * @return {boolean}
 */
os.track.getInterpolateMarker = function(track) {
  return track.get(os.track.TrackField.INTERPOLATE_MARKER) !== false;
};


/**
 * Update the geometry for a track.
 *
 * @param {!ol.Feature} track The track
 * @param {!ol.geom.Geometry} geometry The track geometry.
 */
os.track.setGeometry = function(track, geometry) {
  // split across the date line again
  geometry.toLonLat();
  geometry = os.geo.splitOnDateLine(geometry);
  geometry.osTransform();

  // prevent further normalization of the geometry
  geometry.set(os.geom.GeometryField.NORMALIZED, true);

  // recreate animation geometries
  os.track.disposeAnimationGeometries(track);

  // update the original geometry and interpolate the track again
  track.set(os.interpolate.ORIGINAL_GEOM_FIELD, geometry);
  os.interpolate.interpolateFeature(track);

  // update metadata fields on the track
  var distance = os.track.updateDistance(track, true);
  var duration = os.track.updateDuration(track);
  os.track.updateAverageSpeed(track, distance, duration);
  os.track.updateTime(track);
  os.track.updateCurrentPosition(track);

  // mark the line as dirty so the WebGL feature converter recreates it
  geometry.set(os.geom.GeometryField.DIRTY, true);

  // notify listeners that the track geometry has changed
  track.dispatchEvent(new os.events.PropertyChangeEvent(os.feature.DynamicPropertyChange.GEOMETRY));
};


/**
 * Update the current position displayed on a track.
 *
 * @param {!ol.Feature} track The track
 *
 * @suppress {accessControls} To allow direct access to line coordinates.
 */
os.track.updateCurrentPosition = function(track) {
  var geometry = track.get(os.track.TrackField.CURRENT_LINE) || track.getGeometry();
  if (geometry) {
    var flatCoordinates = geometry.flatCoordinates;
    var stride = geometry.stride;
    var newPosition = flatCoordinates.slice(flatCoordinates.length - stride);

    // update the current position to the last coordinate in the track
    var currentPosition = /** @type {ol.geom.Point|undefined} */ (track.get(os.track.TrackField.CURRENT_POSITION));
    if (!currentPosition) {
      // doesn't exist, so create a new one and set it as the label geometry
      currentPosition = new ol.geom.Point(newPosition);
      track.set(os.track.TrackField.CURRENT_POSITION, currentPosition);
      track.set(os.style.StyleField.LABEL_GEOMETRY, os.track.TrackField.CURRENT_POSITION);
    } else {
      // update the existing position
      currentPosition.setFlatCoordinates(geometry.getLayout(), newPosition);
    }

    // update coordinate fields to display in the list/feature info
    os.feature.populateCoordFields(track, true, currentPosition);

    // update the extra metadata for the current position
    os.track.updateMetadata(track, flatCoordinates, stride);

    // update the style in case coordinate fields are used as labels
    os.style.setFeatureStyle(track);
  }
};


/**
 * Update the distance column(s) on a track.
 *
 * @param {!ol.Feature} track The track to update.
 * @param {boolean=} opt_updateTotal If the total distance should be updated.
 * @return {number} applied distance
 */
os.track.updateDistance = function(track, opt_updateTotal) {
  var um = os.unit.UnitManager.getInstance();
  var distance = 0;
  if (opt_updateTotal) {
    // set the human-readable total distance on the track
    var geometry = track.getGeometry();
    var dist = os.track.getGeometryDistance(geometry);
    if (dist > 0) {
      distance = Math.round(dist * 100) / 100;
      track.set(os.track.TrackField.TOTAL_DISTANCE,
          um.formatToBestFit('distance', distance, 'm', um.getBaseSystem(), 3));
    } else {
      track.set(os.track.TrackField.TOTAL_DISTANCE, os.track.ELAPSED_ZERO);
    }
  }

  var current = /** @type {ol.geom.Geometry|undefined} */ (track.get(os.track.TrackField.CURRENT_LINE));
  if (current) {
    // set the human-readable elapsed distance on the track
    var dist = os.track.getGeometryDistance(current);
    if (dist > 0) {
      distance = Math.round(dist * 100) / 100;
      track.set(os.track.TrackField.ELAPSED_DISTANCE,
          um.formatToBestFit('distance', distance, 'm', um.getBaseSystem(), 3));
    } else {
      track.set(os.track.TrackField.ELAPSED_DISTANCE, os.track.ELAPSED_ZERO);
    }
  } else {
    // set to the total distance
    var geometry = track.getGeometry();
    var dist = os.track.getGeometryDistance(geometry);
    if (dist > 0) {
      distance = Math.round(dist * 100) / 100;
    }
    track.set(os.track.TrackField.ELAPSED_DISTANCE, track.get(os.track.TrackField.TOTAL_DISTANCE));
  }
  return distance;
};


/**
 * Update the duration column on a track.
 *
 * @param {!ol.Feature} track The track to update
 * @return {number} the elapsed duration
 */
os.track.updateDuration = function(track) {
  var trackGeometry = /** @type {ol.geom.LineString} */ (track.getGeometry());
  var sortField = track.get(os.track.TrackField.SORT_FIELD);
  var duration = 0;
  if (trackGeometry && sortField == os.data.RecordField.TIME) {
    var coordinates = trackGeometry.getFlatCoordinates();
    var stride = trackGeometry.getStride();
    var startTime = coordinates[stride - 1];
    var endTime = coordinates[coordinates.length - 1];

    // set the human-readable duration on the track
    var totalDuration = endTime - startTime;
    track.set(os.track.TrackField.TOTAL_DURATION,
        totalDuration > 0 ? moment.duration(totalDuration).humanize() : os.track.TOTAL_ZERO);

    var current = /** @type {ol.geom.Geometry|undefined} */ (track.get(os.track.TrackField.CURRENT_LINE));
    if (current) {
      // partial track is being displayed, so compute the elapsed duration
      var currentRange = os.track.getGeometryTime(current);
      duration = Math.min(totalDuration, currentRange);
      track.set(os.track.TrackField.ELAPSED_DURATION,
          duration > 0 ? moment.duration(duration).humanize() : os.track.ELAPSED_ZERO);
    } else {
      // full track is being displayed, so use the total duration
      duration = totalDuration;
      track.set(os.track.TrackField.ELAPSED_DURATION, track.get(os.track.TrackField.TOTAL_DURATION));
    }
  } else {
    // the track does not have time values - can't resolve duration
    track.set(os.track.TrackField.ELAPSED_DURATION, os.track.TOTAL_ZERO);
    track.set(os.track.TrackField.TOTAL_DURATION, os.track.TOTAL_ZERO);
  }
  return duration;
};


/**
 * Update the average speed on a track
 *
 * @param {!ol.Feature} track The track to update
 * @param {number} distance
 * @param {number} duration
 */
os.track.updateAverageSpeed = function(track, distance, duration) {
  var distanceString = os.track.ELAPSED_ZERO;
  if (distance > 0) {
    var dist = distance / (duration / 3600);
    distanceString = dist.toFixed(3) + ' km/h';
  }
  track.set(os.track.TrackField.ELAPSED_AVERAGE_SPEED, distanceString);
};


/**
 * Update the time range on a track.
 *
 * @param {!ol.Feature} track The track to update
 */
os.track.updateTime = function(track) {
  var sortField = track.get(os.track.TrackField.SORT_FIELD);
  if (sortField == os.data.RecordField.TIME) {
    var oldTime = /** @type {os.time.ITime|undefined} */ (track.get(os.data.RecordField.TIME));
    var trackTime;

    var trackGeometry = /** @type {ol.geom.LineString} */ (track.getGeometry());
    if (trackGeometry) {
      var coordinates = trackGeometry.getFlatCoordinates();
      var stride = trackGeometry.getStride();
      var startTime = coordinates[stride - 1];
      var endTime = coordinates[coordinates.length - 1];
      trackTime = new os.time.TimeRange(startTime, endTime);
    }

    track.set(os.data.RecordField.TIME, trackTime);

    // update the source time model if:
    //  - times are not directly equal (both undefined) AND
    //  - either time is undefined, or the time range changed
    if (oldTime != trackTime && (!trackTime || !oldTime || !trackTime.equals(oldTime))) {
      var source = os.feature.getSource(track);
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
os.track.getGeometryDistance = function(geometry) {
  var distance = 0;

  if (geometry instanceof ol.geom.LineString) {
    geometry.toLonLat();
    distance = os.track.getLineDistance(geometry.getCoordinates());
    geometry.osTransform();
  } else if (geometry instanceof ol.geom.MultiLineString) {
    geometry.toLonLat();
    distance = os.track.getMultiLineDistance(geometry.getCoordinates());
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
os.track.getLineDistance = function(coords) {
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
os.track.getMultiLineDistance = function(coords) {
  var distance = 0;
  if (coords) {
    coords.forEach(function(c) {
      distance += os.track.getLineDistance(c);
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
os.track.getGeometryTime = function(geometry) {
  var time = 0;

  if (geometry instanceof ol.geom.LineString) {
    time = os.track.getLineTime(geometry.getCoordinates());
  } else if (geometry instanceof ol.geom.MultiLineString) {
    time = os.track.getMultiLineTime(geometry.getCoordinates());
  }

  return time;
};


/**
 * Get the time (in seconds) covered by a set of coordinates.
 *
 * @param {Array<ol.Coordinate>} coords The line coordinates
 * @return {number} The time
 */
os.track.getLineTime = function(coords) {
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
os.track.getMultiLineTime = function(coords) {
  var time = 0;
  if (coords) {
    coords.forEach(function(c) {
      time += os.track.getLineTime(c);
    });
  }

  return time;
};


/**
 * Test a feature to check if it has a value in the sort field.
 *
 * @param {!ol.Feature} feature The feature
 * @param {string=} opt_sortField The sort field
 * @return {!goog.Promise}
 */
os.track.getSortField = function(feature, opt_sortField) {
  return new goog.Promise(function(resolve, reject) {
    var sortField = opt_sortField || os.data.RecordField.TIME;
    var getValueFn = sortField == os.data.RecordField.TIME ? os.track.getStartTime :
      os.track.getFeatureValue.bind(null, sortField);

    var value = getValueFn(feature);
    if (value == null || value == '') {
      var source = os.feature.getSource(feature);
      if (source) {
        var columns = source.getColumns();
        columns.sort(os.ui.slick.column.sortByField.bind(null, 'name'));

        var prompt;
        if (sortField == os.data.RecordField.TIME) {
          prompt = 'Track features do not have a time component. Please choose a column that can be used to sort ' +
              'points in the track.';
        } else {
          prompt = 'Features do not have a value defined for the sort field "' + sortField + '". ' +
              'Please choose a new column to sort points in the track:';
        }

        os.track.promptForField(columns, prompt).then(function(newColumn) {
          os.track.getSortField(feature, newColumn['field']).then(function(sortField) {
            resolve(sortField);
          }, function(err) {
            reject(os.events.EventType.CANCEL);
          });
        }, function() {
          reject(os.events.EventType.CANCEL);
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
 * @return {!goog.Promise}
 */
os.track.promptForTitle = function(opt_default) {
  return new goog.Promise(function(resolve, reject) {
    os.ui.window.launchConfirmText(/** @type {!osx.window.ConfirmTextOptions} */ ({
      confirm: resolve,
      cancel: reject,
      defaultValue: opt_default,
      select: true,
      prompt: 'Please provide a name for the track:',
      windowOptions: /** @type {!osx.window.WindowOptions} */ ({
        label: 'Track Name',
        icon: 'fa ' + os.track.ICON,
        modal: true
      })
    }));
  });
};


/**
 * Prompt the user to choose a track.
 *
 * @param {Array<os.data.ColumnDefinition>} columns The columns
 * @param {string} prompt The dialog prompt
 * @return {!goog.Promise}
 */
os.track.promptForField = function(columns, prompt) {
  return new goog.Promise(function(resolve, reject) {
    os.ui.window.launchConfirmColumn(/** @type {!osx.window.ConfirmColumnOptions} */ ({
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
 * @param {!ol.Feature} track The track feature.
 */
os.track.initDynamic = function(track) {
  // switch the displayed track geometry to show the "current" line
  var trackStyles = /** @type {Array<Object<string, *>>} */ (track.get(os.style.StyleType.FEATURE));
  var trackStyle = trackStyles ? trackStyles[0] : null;
  if (trackStyle) {
    if (os.track.getShowLine(track)) {
      trackStyle['geometry'] = os.track.TrackField.CURRENT_LINE;
    }

    os.ui.FeatureEditCtrl.restoreFeatureLabels(track);
    os.style.setFeatureStyle(track);
  }
};


/**
 * Switch the track to its non-animating state.
 *
 * @param {!ol.Feature} track The track feature.
 * @param {boolean=} opt_disposing If the feature is being disposed.
 */
os.track.disposeDynamic = function(track, opt_disposing) {
  // dispose of the current track geometry and remove it from the feature
  os.track.disposeAnimationGeometries(track);

  if (!opt_disposing) {
    // switch the style back to rendering the original track
    var trackStyles = /** @type {Array<Object<string, *>>} */ (track.get(os.style.StyleType.FEATURE));
    var trackStyle = trackStyles ? trackStyles[0] : null;
    if (trackStyle) {
      os.track.setShowMarker(track, true);
      if (os.track.getShowLine(track)) {
        delete trackStyle['geometry'];
      }
      os.style.setFeatureStyle(track);
    }

    // reset coordinate fields and update time/distance to the full track
    var distance = os.track.updateDistance(track);
    var duration = os.track.updateDuration(track);
    os.track.updateAverageSpeed(track, distance, duration);
    os.track.updateCurrentPosition(track);
  }
};


/**
 * Update a track feature to represent the track at a provided timestamp.
 *
 * @param {!ol.Feature} track The track.
 * @param {number} startTime The start timestamp.
 * @param {number} endTime The end timestamp.
 */
os.track.updateDynamic = function(track, startTime, endTime) {
  var sortField = track.get(os.track.TrackField.SORT_FIELD);
  if (sortField !== os.data.RecordField.TIME) {
    // isn't sorted by time - can't create a current track
    return;
  }

  var trackGeometry = track.getGeometry();
  if (!(trackGeometry instanceof ol.geom.LineString || trackGeometry instanceof ol.geom.MultiLineString)) {
    // shouldn't happen, but this will fail if the track isn't a line
    return;
  }

  var flatCoordinates = trackGeometry.getFlatCoordinates();
  var stride = trackGeometry.getStride();
  var ends = trackGeometry instanceof ol.geom.MultiLineString ? trackGeometry.getEnds() : undefined;
  var geomLayout = trackGeometry.getLayout();
  if (!flatCoordinates || (geomLayout !== ol.geom.GeometryLayout.XYM && geomLayout !== ol.geom.GeometryLayout.XYZM)) {
    // something is wrong with this line - abort!!
    return;
  }

  var startIndex = os.track.getTimeIndex(flatCoordinates, startTime, stride);
  var endIndex = os.track.getTimeIndex(flatCoordinates, endTime, stride);
  os.track.updateCurrentLine(track, startTime, startIndex, endTime, endIndex, flatCoordinates, stride, ends);

  var distance = os.track.updateDistance(track);
  var duration = os.track.updateDuration(track);
  os.track.updateAverageSpeed(track, distance, duration);
  track.changed();
};


/**
 * Update track metadata from original features.
 * @param {!ol.Feature} track The track.
 * @param {!Array<number>} coordinates The flat coordinate array.
 * @param {number} stride The coordinate array stride.
 *
 * @suppress {accessControls} For direct access to track metadata.
 */
os.track.updateMetadata = function(track, coordinates, stride) {
  var metadataMap = track.get(os.track.TrackField.METADATA_MAP);
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
os.track.getTimeIndex = function(coordinates, value, stride) {
  // find the closest timestamp to the current timeline position
  var index = os.array.binaryStrideSearch(coordinates, value, stride, stride - 1);
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
 * @param {!ol.Feature} track The track.
 * @param {number} timestamp The timestamp.
 * @param {number} index The index of the most recent known coordinate.
 * @param {!Array<number>} coordinates The flat track coordinate array.
 * @param {number} stride The stride of the coordinate array.
 * @return {ol.Coordinate|undefined}
 */
os.track.getTrackPositionAt = function(track, timestamp, index, coordinates, stride) {
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
    if (os.track.getInterpolateMarker(track)) {
      position = [
        goog.math.lerp(coordinates[prevIndex], coordinates[nextIndex], scale),
        goog.math.lerp(coordinates[prevIndex + 1], coordinates[nextIndex + 1], scale)
      ];
    } else {
      position = [
        coordinates[prevIndex],
        coordinates[prevIndex + 1]
      ];
    }

    // interpolate altitude if present
    if (stride === 4) {
      if (os.track.getInterpolateMarker(track)) {
        position.push(goog.math.lerp(coordinates[prevIndex + 2], coordinates[nextIndex + 2], scale));
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
 * @param {!ol.Feature} track The track.
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
os.track.updateCurrentLine = function(track, startTime, startIndex, endTime, endIndex, coordinates, stride,
    opt_ends) {
  var currentLine = /** @type {os.track.TrackLike|undefined} */ (track.get(os.track.TrackField.CURRENT_LINE));
  var layout = stride === 4 ? ol.geom.GeometryLayout.XYZM : ol.geom.GeometryLayout.XYM;
  if (!currentLine) {
    // create the line geometry if it doesn't exist yet. must use an empty coordinate array instead of null, or the
    // layout will be set to XY
    currentLine = opt_ends ? new ol.geom.MultiLineString([], layout) : new ol.geom.LineString([], layout);
    track.set(os.track.TrackField.CURRENT_LINE, currentLine);
  }

  // test if the current line appears to have the correct coordinates already. if so, do not modify it.
  var flatCoordinates = currentLine.flatCoordinates;
  if (flatCoordinates.length === endIndex - startIndex &&
      (!flatCoordinates.length || (flatCoordinates[0] === coordinates[startIndex] &&
          flatCoordinates[flatCoordinates.length - stride] === coordinates[endIndex - stride]))) {
    // show the marker on the last point if it's after the timeline range start
    var show = !!flatCoordinates.length &&
        flatCoordinates[flatCoordinates.length - 1] >= os.time.TimelineController.getInstance().getCurrentRange().start;
    os.track.setShowMarker(track, show, true);
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
      var interpolatedStart = os.track.getTrackPositionAt(track, startTime, startIndex, coordinates, stride);
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
      var end = os.track.getTrackPositionAt(track, endTime, endIndex, coordinates, stride);
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
      os.track.setShowMarker(track, false);
    } else {
      os.track.setShowMarker(track, true);
    }
  }

  // mark the line as dirty so the WebGL feature converter recreates it
  currentLine.set(os.geom.GeometryField.DIRTY, true);

  // update the current line geometry
  if (currentLine instanceof ol.geom.LineString) {
    currentLine.setFlatCoordinates(layout, flatCoordinates);
  } else if (currentEnds) {
    currentLine.setFlatCoordinates(layout, flatCoordinates, currentEnds);
  }

  // update the current position marker
  os.track.updateCurrentPosition(track);
};


/**
 * Update the z-index for a list of tracks. Ensures the current position icon for all tracks will be displayed on top
 * of the line string for every other track passed to the function.
 *
 * @param {!Array<!ol.Feature>} tracks The track features.
 */
os.track.updateTrackZIndex = function(tracks) {
  // save the top z-index so current position icons can be displayed above tracks
  var topTrackZIndex = tracks.length + 1;
  for (var i = 0; i < tracks.length; i++) {
    var track = tracks[i];
    var trackStyles = /** @type {!Array<!Object<string, *>>} */ (track.get(os.style.StyleType.FEATURE));
    if (!goog.isArray(trackStyles)) {
      trackStyles = [trackStyles];
    }

    for (var j = 0; j < trackStyles.length; j++) {
      var style = trackStyles[j];
      style['zIndex'] = tracks.length - i;

      // display current position icon above track lines
      if (style['geometry'] == os.track.TrackField.CURRENT_POSITION) {
        style['zIndex'] += topTrackZIndex;
      }
    }

    // update styles on the track and
    os.style.setFeatureStyle(track);
    track.changed();
  }
};


/**
 * Split features into tracks.
 * @param {os.track.SplitOptions} options The options.
 * @return {!Array<!ol.Feature>} The resulting tracks. Also contains any features not used to create tracks.
 *
 * @suppress {accessControls}
 */
os.track.splitIntoTracks = function(options) {
  var features = options.features;
  var field = options.field;
  var result = options.result || [];
  var getTrackFn = options.getTrackFn || goog.nullFunction;

  if (features && field) {
    var buckets = goog.array.bucket(features, function(feature) {
      // if the feature does not have a value for the field, add it to the ignore bucket so it can be included in the
      // result. this avoids dropping features that aren't added to a track.
      return feature ? (feature.values_[field] != null ? feature.values_[field] : os.object.IGNORE_VAL) : undefined;
    });

    for (var id in buckets) {
      var bucketFeatures = buckets[id];
      if (id === os.object.IGNORE_VAL) {
        // features did not have a value for the provided field, so return them to the result array
        for (var i = 0; i < bucketFeatures.length; i++) {
          result.push(bucketFeatures[i]);
        }
      } else {
        var trackId = id + '-track';
        var track = getTrackFn(trackId);
        if (track) {
          os.track.addToTrack({
            features: bucketFeatures,
            track: track,
            includeMetadata: true
          });
        } else {
          track = os.track.createTrack({
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

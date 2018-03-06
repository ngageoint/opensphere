goog.provide('plugin.track');

goog.require('goog.Promise');
goog.require('ol.Feature');
goog.require('ol.geom.LineString');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.Point');
goog.require('os.alert.AlertEventSeverity');
goog.require('os.config');
goog.require('os.data.RecordField');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.feature');
goog.require('os.feature.DynamicFeature');
goog.require('os.feature.DynamicPropertyChange');
goog.require('os.interpolate');
goog.require('os.ogc.filter.OGCFilterOverride');
goog.require('os.olcs');
goog.require('os.style');
goog.require('os.time.TimeRange');
goog.require('os.ui.file.kml');
goog.require('os.ui.window');
goog.require('os.ui.window.confirmColumnDirective');
goog.require('os.ui.window.confirmDirective');
goog.require('os.ui.window.confirmTextDirective');
goog.require('plugin.file.kml');
goog.require('plugin.file.kml.KMLField');
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
 */
plugin.track.ICON = 'fa-share-alt';


/**
 * Title for the track layer.
 * @type {string}
 * @const
 */
plugin.track.LAYER_TITLE = 'Tracks';


/**
 * Context menu submenu for grouped actions.
 * @type {string}
 * @const
 */
plugin.track.MENU_GROUP = 'Tracks';


/**
 * Text to display when elapsed distance/duration is zero.
 * @type {string}
 */
plugin.track.ELAPSED_ZERO = 'Not Started';


/**
 * Text to display when total distance/duration is zero.
 * @type {string}
 */
plugin.track.TOTAL_ZERO = 'Unknown';


/**
 * A type representing a track geometry. Tracks will use a `ol.geom.MultiLineString` if they cross the date line (to
 * render correctly in Openlayers), or if they represent a multi-track.
 * @typedef {ol.geom.LineString|ol.geom.MultiLineString}
 */
plugin.track.TrackLike;


/**
 * @typedef {{
 *   entry: !os.filter.FilterEntry,
 *   mappings: !Array<!Object>,
 *   startColumn: string,
 *   endColumn: string,
 *   uri: string
 * }}
 */
plugin.track.QueryOptions;


/**
 * @typedef {{
 *   features: (Array<!ol.Feature>|undefined),
 *   geometry: (plugin.track.TrackLike|undefined),
 *   id: (string|undefined),
 *   color: (string|undefined),
 *   name: (string|undefined),
 *   sortField: (string|undefined),
 *   label: (string|undefined)
 * }}
 */
plugin.track.CreateOptions;



/**
 * Feature metadata fields used by tracks
 * @enum {string}
 */
plugin.track.TrackField = {
  ELAPSED_DISTANCE: 'ELAPSED_DISTANCE',
  TOTAL_DISTANCE: 'TOTAL_DISTANCE',
  ELAPSED_DURATION: 'ELAPSED_DURATION',
  TOTAL_DURATION: 'TOTAL_DURATION',
  CURRENT_POSITION: '_currentPosition',
  CURRENT_LINE: '_currentLine',
  QUERY_OPTIONS: '_trackQueryOptions',
  ORIG_SOURCE_ID: '_trackOrigSourceId',
  SORT_FIELD: '_sortField'
};


/**
 * Fields that should be displayed on the source.
 *
 * @type {!Array<string>}
 * @const
 */
plugin.track.SOURCE_FIELDS = [
  plugin.file.kml.KMLField.NAME,
  plugin.file.kml.KMLField.DESCRIPTION,
  plugin.track.TrackField.ELAPSED_DISTANCE,
  plugin.track.TrackField.TOTAL_DISTANCE,
  plugin.track.TrackField.ELAPSED_DURATION,
  plugin.track.TrackField.TOTAL_DURATION,
  os.Fields.LAT,
  os.Fields.LON,
  os.Fields.LAT_DMS,
  os.Fields.LON_DMS,
  os.Fields.MGRS,
  os.Fields.ALT
];


/**
 * Default options for the track layer.
 * @return {!Object<string,*>}
 */
plugin.track.getDefaultLayerOptions = function() {
  return {
    'animate': true,
    'color': os.style.DEFAULT_LAYER_COLOR,
    'collapsed': false,
    'columns': plugin.track.SOURCE_FIELDS,
    'editable': true,
    'explicitType': '',
    'id': plugin.track.ID,
    'layerType': os.layer.LayerType.FEATURES,
    'loadOnce': true,
    'provider': os.config.getAppName() || null,
    'showLabels': false,
    'showRoot': false,
    'size': os.style.DEFAULT_FEATURE_SIZE,
    'title': plugin.track.LAYER_TITLE,
    'type': plugin.track.ID
  };
};


/**
 * Style config for the track.
 * @type {!Object<string, *>}
 * @const
 */
plugin.track.TRACK_CONFIG = {
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
plugin.track.CURRENT_CONFIG = {
  'geometry': plugin.track.TrackField.CURRENT_POSITION,
  'image': {
    'type': 'icon',
    'scale': 1,
    'src': os.ui.file.kml.DEFAULT_ICON.href
  }
};


/**
 * Metric keys for the track plugin.
 * @enum {string}
 */
plugin.track.Metrics = {
  CREATE_LAYER: 'track.create-layer',
  ADD_TO_LAYER: 'track.addTo-layer',
  FOLLOW_TRACK: 'track.followTrack',
  UNFOLLOW_TRACK: 'track.unfollowTrack'
};


/**
 * Test if a feature is a track.
 * @param {ol.Feature} feature The feature.
 * @return {boolean} If the feature is a track.
 */
plugin.track.isTrackFeature = function(feature) {
  if (feature) {
    return feature.get(os.data.RecordField.SOURCE_ID) === plugin.track.ID;
  }

  return false;
};


/**
 * Get the track layer, creating it if one doesn't exist.
 * @param {boolean=} opt_create If the track layer should be created if it doesn't exist
 * @return {plugin.file.kml.KMLLayer}
 */
plugin.track.getTrackLayer = function(opt_create) {
  var osMap = os.MapContainer.getInstance();
  var layer = /** @type {plugin.file.kml.KMLLayer} */ (osMap.getLayer(plugin.track.ID));
  if (!layer && opt_create) {
    var options = plugin.track.getDefaultLayerOptions();
    layer = /** @type {plugin.file.kml.KMLLayer} */ (os.layer.createFromOptions(options));

    if (layer) {
      osMap.addLayer(layer);
    }
  }

  return layer;
};


/**
 * Get the root track node.
 * @param {boolean=} opt_create If the track layer/node should be created if it doesn't exist
 * @return {plugin.file.kml.ui.KMLNode}
 */
plugin.track.getTrackNode = function(opt_create) {
  var layer = plugin.track.getTrackLayer(opt_create);
  if (layer) {
    var source = /** @type {plugin.file.kml.KMLSource} */ (layer.getSource());
    if (source) {
      return source.getRootNode();
    }
  }

  return null;
};


/**
 * Gets a field value from a feature.
 * @param {string} field
 * @param {ol.Feature} feature
 * @return {*} The value
 */
plugin.track.getFeatureValue = function(field, feature) {
  return feature ? feature.get(field) : undefined;
};


/**
 * Get the start time for a feature.
 * @param {ol.Feature} feature
 * @return {number|undefined} The value
 */
plugin.track.getStartTime = function(feature) {
  var time = /** @type {os.time.ITime|undefined} */ (feature.get(os.data.RecordField.TIME));
  if (time) {
    return time.getStart();
  }

  return undefined;
};


/**
 * Get a track feature by id.
 * @param {string} id The track id.
 * @return {ol.Feature} The track, or null if not found.
 */
plugin.track.getTrackById = function(id) {
  var layer = plugin.track.getTrackLayer();
  if (layer) {
    var source = layer.getSource();
    if (source) {
      return source.getFeatureById(id);
    }
  }

  return null;
};


/**
 * Remove a track feature by id.
 * @param {string} id The track id.
 * @return {ol.Feature} The track, or null if not found.
 */
plugin.track.removeTrackById = function(id) {
  var layer = plugin.track.getTrackLayer();
  if (layer) {
    var source = layer.getSource();
    if (source) {
      var track = source.getFeatureById(id);
      if (track) {
        source.removeFeature(track);
      }
    }
  }

  return null;
};


/**
 * Create a track geometry (`ol.geom.LineString` with an XYZM coordinate layout) from a set of features. The features
 * must have a common field with values that can be naturally sorted. Any features lacking a point geometry or a value
 * in the sort field will be ignored. If sorted by `os.data.RecordField.TIME`, the track may be animated over time.
 * @param {!Array<!ol.Feature>} features The features.
 * @param {string} sortField The track sort field.
 * @return {ol.geom.LineString|undefined} The track, or undefined if no coordinates were found.
 */
plugin.track.createTrackGeometry = function(features, sortField) {
  var sortFn = sortField == os.data.RecordField.TIME ? os.feature.sortByTime :
      os.feature.sortByField.bind(null, sortField);
  var getValueFn = sortField == os.data.RecordField.TIME ? plugin.track.getStartTime :
      plugin.track.getFeatureValue.bind(null, sortField);

  // sort the features before assembling the track
  features.sort(sortFn);

  var coords = features.map(function(feature) {
    var geom = feature.getGeometry();
    var value = /** @type {number|undefined} */ (getValueFn(feature));
    if (geom instanceof ol.geom.Point && value != null) {
      var pointCoord = geom.getFirstCoordinate();
      if (pointCoord.length < 3) {
        // add altitude for consistency across all track geometries
        pointCoord.push(0);
      }

      // add the sort value
      pointCoord.push(value);
      return pointCoord;
    }

    return undefined;
  }).filter(os.fn.filterFalsey);

  // create the line geometry
  return coords.length ? new ol.geom.LineString(coords, ol.geom.GeometryLayout.XYZM) : undefined;
};


/**
 * Creates a track from the provided options.
 * @param {!plugin.track.CreateOptions} options The track creation options.
 * @return {os.feature.DynamicFeature|ol.Feature|undefined} The track feature.
 */
plugin.track.createTrack = function(options) {
  var sortField = options.sortField || os.data.RecordField.TIME;
  var featureColor;
  var sourceColor;

  var geometry = options.geometry;
  if (!geometry && options.features && options.features.length) {
    geometry = plugin.track.createTrackGeometry(options.features, sortField);
    featureColor = /** @type {string|undefined} */ (options.features[0].get(os.data.RecordField.COLOR));

    var source = os.feature.getSource(options.features[0]);
    if (source) {
      sourceColor = source ? source.getColor() : undefined;
    }
  }

  if (!geometry) {
    return undefined;
  }

  if (geometry instanceof ol.geom.LineString) {
    geometry.toLonLat();
    geometry = os.geo.splitOnDateLine(geometry);
    geometry.osTransform();

    // tracks must be a ol.geom.MultiLineString. if it isn't one now, it doesn't cross the date line and was not split.
    // if (geometry instanceof ol.geom.LineString) {
    //   geometry = new ol.geom.MultiLineString([geometry.getCoordinates()], ol.geom.GeometryLayout.XYZM);
    // }
  }

  // prevent any further normalization of the geometry
  geometry.set(os.geom.GeometryField.NORMALIZED, true);

  // create the track feature
  var track;
  if (sortField === os.data.RecordField.TIME) {
    track = new os.feature.DynamicFeature(geometry,
        plugin.track.initDynamic,
        plugin.track.disposeDynamic,
        plugin.track.updateDynamic);
  } else {
    track = new ol.Feature(geometry);
  }

  var trackId = options.id || (plugin.track.ID + '-' + goog.string.getRandomString());
  track.setId(trackId);
  track.set(os.Fields.ID, trackId);

  // add a geometry to display the current track position
  plugin.track.updateCurrentPosition(track);

  // set the track name, defaulting to the id if one isn't provided
  track.set(plugin.file.kml.KMLField.NAME, options.name || trackId);

  // keep a copy of the features used to assemble the track
  track.set(plugin.track.TrackField.SORT_FIELD, sortField);

  plugin.track.updateDistance(track, true);
  plugin.track.updateDuration(track);
  plugin.track.updateTime(track);

  // create the track and current position styles. color is the first defined value in:
  //  - color override parameter
  //  - feature color
  //  - source color
  //  - default feature color
  //
  var trackStyle = /** @type {!Object<string, *>} */ (os.object.unsafeClone(plugin.track.TRACK_CONFIG));
  var currentStyle = /** @type {!Object<string, *>} */ (os.object.unsafeClone(plugin.track.CURRENT_CONFIG));
  var trackColor = options.color || featureColor || sourceColor || os.style.DEFAULT_LAYER_COLOR;
  if (trackColor) {
    os.style.setConfigColor(trackStyle, trackColor, [os.style.StyleField.STROKE]);
    os.style.setConfigColor(currentStyle, trackColor, [os.style.StyleField.IMAGE]);
  }

  // set the style config for the track
  track.set(os.style.StyleType.FEATURE, [trackStyle, currentStyle]);

  // configure default label for the track
  os.feature.showLabel(track);
  var labelStyle = {
    'column': options.label || plugin.file.kml.KMLField.NAME,
    'showColumn': false
  };
  currentStyle[os.style.StyleField.LABELS] = [labelStyle];

  // display the current position as an icon
  track.set(os.style.StyleField.SHAPE, os.style.ShapeType.ICON);

  // update styles on the track
  os.style.setFeatureStyle(track);

  return track;
};


/**
 * Adds a set of features to a track.
 * @param {!ol.Feature} track The track
 * @param {!Array<!ol.Feature>} features The features to add to the track
 *
 * @suppress {accessControls} To allow direct access to line coordinates.
 */
plugin.track.addFeaturesToTrack = function(track, features) {
  var sortField = /** @type {string|undefined} */ (track.get(plugin.track.TrackField.SORT_FIELD));
  if (!sortField) {
    goog.log.error(plugin.track.LOGGER_, 'Unable to add features to track: track is missing sorting data.');
    return;
  }

  // sort the features before assembling the track
  var sortFn = sortField == os.data.RecordField.TIME ? os.feature.sortByTime :
      os.feature.sortByField.bind(null, sortField);
  features.sort(sortFn);

  var getValueFn = sortField == os.data.RecordField.TIME ? plugin.track.getStartTime :
      plugin.track.getFeatureValue.bind(null, sortField);

  // add point(s) to the original geometry, in case the track was interpolated
  var geometry = /** @type {!plugin.track.TrackLike} */ (track.get(os.interpolate.ORIGINAL_GEOM_FIELD) ||
      track.getGeometry());

  // merge the split line so features can be added in the correct location
  geometry.toLonLat();
  geometry = os.geo.mergeLineGeometry(geometry);
  geometry.osTransform();

  var flatCoordinates = geometry.flatCoordinates;
  var stride = geometry.stride;
  var layout = geometry.layout;
  var skipped = 0;

  for (var i = 0; i < features.length; i++) {
    var feature = features[i];
    var geom = feature.getGeometry();
    if (geom instanceof ol.geom.Point) {
      var pointCoordinates = geom.getCoordinates();
      if (!pointCoordinates || pointCoordinates.length < 2) {
        // missing coordinates, so skip this one
        skipped++;
        continue;
      }

      // if the point doesn't have altitude and the line does, add 0 altitude
      if (layout === ol.geom.GeometryLayout.XYZM && pointCoordinates.length === 2) {
        pointCoordinates.push(0);
      }

      // only add the feature if it has a value for the sort field
      var value = /** @type {number|undefined} */ (getValueFn(feature));
      if (value) {
        pointCoordinates.push(value);

        // figure out where the value fits in the array. if the value value already exists, just skip the feature to
        // avoid duplicate values.
        var insertIndex = os.array.binaryStrideSearch(flatCoordinates, value, stride, stride - 1);
        if (insertIndex < 0) {
          // insert coordinates in the corresponding location
          goog.array.insertArrayAt(flatCoordinates, pointCoordinates, ~insertIndex);
        } else {
          skipped++;
        }
      }
    }
  }

  // update the geometry on the track if features were added
  if (skipped < features.length) {
    plugin.track.setGeometry(track, geometry);
  }

  if (skipped) {
    goog.log.info(plugin.track.LOGGER_, 'Skipped ' + skipped + ' features due to missing/duplicate sort value.');
  }
};


/**
 * Clamp track points within the provided sort range.
 * @param {!ol.Feature} track The track.
 * @param {string|number} start The start value.
 * @param {string|number} end The end value.
 *
 * @suppress {accessControls} To allow direct access to line coordinates.
 */
plugin.track.clamp = function(track, start, end) {
  // add point(s) to the original geometry, in case the track was interpolated
  var geometry = /** @type {!(plugin.track.TrackLike)} */ (track.get(os.interpolate.ORIGINAL_GEOM_FIELD) ||
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
    plugin.track.setGeometry(track, geometry);
  }
};


/**
 * Dispose of the current position/line geometries and remove them from the feature.
 * @param {!ol.Feature} track The track
 */
plugin.track.disposeAnimationGeometries = function(track) {
  var currentPosition = track.get(plugin.track.TrackField.CURRENT_POSITION);
  track.set(plugin.track.TrackField.CURRENT_POSITION, undefined);
  goog.dispose(currentPosition);

  var currentLine = track.get(plugin.track.TrackField.CURRENT_LINE);
  track.set(plugin.track.TrackField.CURRENT_LINE, undefined);
  goog.dispose(currentLine);
};


/**
 * Update the geometry for a track.
 * @param {!ol.Feature} track The track
 * @param {!ol.geom.Geometry} geometry The track geometry.
 */
plugin.track.setGeometry = function(track, geometry) {
  // split across the date line again
  geometry.toLonLat();
  geometry = os.geo.splitOnDateLine(geometry);
  geometry.osTransform();

  // tracks must be a ol.geom.MultiLineString
  // if (geometry instanceof ol.geom.LineString) {
  //   geometry = new ol.geom.MultiLineString([geometry.getCoordinates()], geometry.getLayout());
  // }

  // prevent further normalization of the geometry
  geometry.set(os.geom.GeometryField.NORMALIZED, true);

  // recreate animation geometries
  plugin.track.disposeAnimationGeometries(track);

  // update the original geometry and interpolate the track again
  track.set(os.interpolate.ORIGINAL_GEOM_FIELD, geometry);
  os.interpolate.interpolateFeature(track);

  // update metadata fields on the track
  plugin.track.updateDistance(track, true);
  plugin.track.updateDuration(track);
  plugin.track.updateTime(track);
  plugin.track.updateCurrentPosition(track);

  // mark the line as dirty so the Cesium feature converter recreates it
  geometry.set(os.olcs.DIRTY_BIT, true);

  // notify listeners that the track geometry has changed
  track.dispatchEvent(new os.events.PropertyChangeEvent(os.feature.DynamicPropertyChange.GEOMETRY));
};


/**
 * Creates a track and adds it to the tracks layer.
 * @param {!plugin.track.CreateOptions} options The options object for the track.
 */
plugin.track.createAndAdd = function(options) {
  var track = plugin.track.createTrack(options);

  if (!track) {
    var msg = 'Track creation failed. There were no valid features to create a track from.';
    os.alertManager.sendAlert(msg, os.alert.AlertEventSeverity.WARNING);
    return;
  }

  var trackNode = plugin.file.kml.ui.updatePlacemark({
    'feature': track
  });

  var rootNode = plugin.track.getTrackNode(true);
  if (rootNode) {
    var cmd = new plugin.file.kml.cmd.KMLNodeAdd(trackNode, rootNode);
    cmd.title = 'Create track from ' + options.features.length + ' features';
    os.command.CommandProcessor.getInstance().addCommand(cmd);
  } else {
    goog.log.error(plugin.track.LOGGER_, 'Unable to create track: track layer missing');
  }
};


/**
 * Update the current position displayed on a track.
 * @param {!ol.Feature} track The track
 *
 * @suppress {accessControls} To allow direct access to line coordinates.
 */
plugin.track.updateCurrentPosition = function(track) {
  var geometry = track.get(plugin.track.TrackField.CURRENT_LINE) || track.getGeometry();
  if (geometry) {
    var flatCoordinates = geometry.flatCoordinates;
    var stride = geometry.stride;
    var newPosition = flatCoordinates.slice(flatCoordinates.length - stride);

    // update the current position to the last coordinate in the track
    var currentPosition = /** @type {ol.geom.Point|undefined} */ (track.get(plugin.track.TrackField.CURRENT_POSITION));
    if (!currentPosition) {
      // doesn't exist, so create a new one and set it as the label geometry
      currentPosition = new ol.geom.Point(newPosition);
      track.set(plugin.track.TrackField.CURRENT_POSITION, currentPosition);
      track.set(os.style.StyleField.LABEL_GEOMETRY, plugin.track.TrackField.CURRENT_POSITION);
    } else {
      // update the existing position
      currentPosition.setFlatCoordinates(geometry.getLayout(), newPosition);
    }

    // update coordinate fields to display in the list/feature info
    os.feature.populateCoordFields(track, true, currentPosition);

    // update the style in case coordinate fields are used as labels
    os.style.setFeatureStyle(track);
  }
};


/**
 * Update the distance column(s) on a track.
 * @param {!ol.Feature} track The track to update.
 * @param {boolean=} opt_updateTotal If the total distance should be updated.
 */
plugin.track.updateDistance = function(track, opt_updateTotal) {
  var um = os.unit.UnitManager.getInstance();

  if (opt_updateTotal) {
    // set the human-readable total distance on the track
    var geometry = track.getGeometry();
    var distance = plugin.track.getGeometryDistance(geometry);
    if (distance > 0) {
      distance = Math.round(distance * 100) / 100;
      track.set(plugin.track.TrackField.TOTAL_DISTANCE,
          um.formatToBestFit('distance', distance, 'm', um.getBaseSystem(), 3));
    } else {
      track.set(plugin.track.TrackField.TOTAL_DISTANCE, plugin.track.TOTAL_ZERO);
    }
  }

  var current = /** @type {ol.geom.Geometry|undefined} */ (track.get(plugin.track.TrackField.CURRENT_LINE));
  if (current) {
    // set the human-readable elapsed distance on the track
    var distance = plugin.track.getGeometryDistance(current);
    if (distance > 0) {
      distance = Math.round(distance * 100) / 100;
      track.set(plugin.track.TrackField.ELAPSED_DISTANCE,
          um.formatToBestFit('distance', distance, 'm', um.getBaseSystem(), 3));
    } else {
      track.set(plugin.track.TrackField.ELAPSED_DISTANCE, plugin.track.ELAPSED_ZERO);
    }
  } else {
    // set to the total distance
    track.set(plugin.track.TrackField.ELAPSED_DISTANCE, track.get(plugin.track.TrackField.TOTAL_DISTANCE));
  }
};


/**
 * Update the duration column on a track.
 * @param {!ol.Feature} track The track to update
 */
plugin.track.updateDuration = function(track) {
  var trackGeometry = /** @type {ol.geom.LineString} */ (track.getGeometry());
  var sortField = track.get(plugin.track.TrackField.SORT_FIELD);
  if (trackGeometry && sortField == os.data.RecordField.TIME) {
    var coordinates = trackGeometry.getFlatCoordinates();
    var stride = trackGeometry.getStride();
    var startTime = coordinates[stride - 1];
    var endTime = coordinates[coordinates.length - 1];

    // set the human-readable duration on the track
    var totalDuration = endTime - startTime;
    track.set(plugin.track.TrackField.TOTAL_DURATION,
        totalDuration > 0 ? moment.duration(totalDuration).humanize() : plugin.track.TOTAL_ZERO);

    if (track.get(plugin.track.TrackField.CURRENT_LINE) != null) {
      // partial track is being displayed, so compute the elapsed duration
      var elapsedTime = Math.min(endTime, os.time.TimelineController.getInstance().getCurrent()) - startTime;
      track.set(plugin.track.TrackField.ELAPSED_DURATION,
          elapsedTime > 0 ? moment.duration(elapsedTime).humanize() : plugin.track.ELAPSED_ZERO);
    } else {
      // full track is being displayed, so use the total duration
      track.set(plugin.track.TrackField.ELAPSED_DURATION, track.get(plugin.track.TrackField.TOTAL_DURATION));
    }
  } else {
    // the track does not have time values - can't resolve duration
    track.set(plugin.track.TrackField.ELAPSED_DURATION, plugin.track.TOTAL_ZERO);
    track.set(plugin.track.TrackField.TOTAL_DURATION, plugin.track.TOTAL_ZERO);
  }
};


/**
 * Update the time range on a track.
 * @param {!ol.Feature} track The track to update
 */
plugin.track.updateTime = function(track) {
  var sortField = track.get(plugin.track.TrackField.SORT_FIELD);
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
 * @param {ol.geom.Geometry|undefined} geometry The geometry.
 * @return {number} The distance.
 */
plugin.track.getGeometryDistance = function(geometry) {
  var distance = 0;

  if (geometry instanceof ol.geom.LineString) {
    geometry.toLonLat();
    distance = plugin.track.getLineDistance(geometry.getCoordinates());
    geometry.osTransform();
  } else if (geometry instanceof ol.geom.MultiLineString) {
    geometry.toLonLat();
    distance = plugin.track.getMultiLineDistance(geometry.getCoordinates());
    geometry.osTransform();
  }

  return distance;
};


/**
 * Get the distance (in meters) covered by a set of coordinates.
 * @param {Array<ol.Coordinate>} coords The line coordinates
 * @return {number} The distance in meters
 */
plugin.track.getLineDistance = function(coords) {
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
 * @param {Array<Array<ol.Coordinate>>} coords The multi-line coordinates
 * @return {number} The distance in meters
 */
plugin.track.getMultiLineDistance = function(coords) {
  var distance = 0;
  if (coords) {
    coords.forEach(function(c) {
      distance += plugin.track.getLineDistance(c);
    });
  }

  return distance;
};


/**
 * Test a feature to check if it has a value in the sort field.
 * @param {!ol.Feature} feature The feature
 * @param {string=} opt_sortField The sort field
 * @return {!goog.Promise}
 */
plugin.track.getSortField = function(feature, opt_sortField) {
  return new goog.Promise(function(resolve, reject) {
    var sortField = opt_sortField || os.data.RecordField.TIME;
    var getValueFn = sortField == os.data.RecordField.TIME ? plugin.track.getStartTime :
        plugin.track.getFeatureValue.bind(null, sortField);

    var value = getValueFn(feature);
    if (value == null || value == '') {
      var source = os.feature.getSource(feature);
      if (source) {
        var columns = source.getColumns().slice();
        columns.sort(os.ui.slick.column.sortByField.bind(null, 'name'));

        var prompt;
        if (sortField == os.data.RecordField.TIME) {
          prompt = 'Track features do not have a time component. Please choose a column that can be used to sort ' +
              'points in the track.';
        } else {
          prompt = 'Features do not have a value defined for the sort field "' + sortField + '". ' +
              'Please choose a new column to sort points in the track:';
        }

        plugin.track.promptForField(columns, prompt).then(function(newColumn) {
          plugin.track.getSortField(feature, newColumn['field']).then(function(sortField) {
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
 * @param {string=} opt_default The default value
 * @return {!goog.Promise}
 */
plugin.track.promptForTitle = function(opt_default) {
  return new goog.Promise(function(resolve, reject) {
    os.ui.window.launchConfirmText(/** @type {!osx.window.ConfirmTextOptions} */ ({
      confirm: resolve,
      cancel: reject,
      defaultValue: opt_default,
      select: true,
      prompt: 'Please provide a name for the track:',
      windowOptions: /** @type {!osx.window.WindowOptions} */ ({
        label: 'Track Name',
        icon: 'fa ' + plugin.track.ICON,
        modal: true
      })
    }));
  });
};


/**
 * Prompt the user to choose a track.
 * @param {Array<os.data.ColumnDefinition>} columns The columns
 * @param {string} prompt The dialog prompt
 * @return {!goog.Promise}
 */
plugin.track.promptForField = function(columns, prompt) {
  return new goog.Promise(function(resolve, reject) {
    os.ui.window.launchConfirmColumn(/** @type {!osx.window.ConfirmColumnOptions} */ ({
      confirm: resolve,
      cancel: reject,
      columns: columns,
      prompt: prompt,
      windowOptions: /** @type {!osx.window.WindowOptions} */ ({
        label: 'Choose Track Sort Column',
        width: 400,
        icon: 'fa fa-warning orange-icon',
        modal: true
      })
    }));
  });
};


/**
 * Switch the track to its animating state.
 * @param {!ol.Feature} track The track feature.
 */
plugin.track.initDynamic = function(track) {
  // switch the displayed track geometry to show the "current" line
  var trackStyles = /** @type {Array<Object<string, *>>} */ (track.get(os.style.StyleType.FEATURE));
  var trackStyle = trackStyles ? trackStyles[0] : null;
  if (trackStyle) {
    trackStyle['geometry'] = plugin.track.TrackField.CURRENT_LINE;

    os.ui.FeatureEditCtrl.restoreFeatureLabels(track);
    os.style.setFeatureStyle(track);
  }
};


/**
 * Switch the track to its non-animating state.
 * @param {!ol.Feature} track The track feature.
 * @param {boolean=} opt_disposing If the feature is being disposed.
 */
plugin.track.disposeDynamic = function(track, opt_disposing) {
  // dispose of the current track geometry and remove it from the feature
  plugin.track.disposeAnimationGeometries(track);

  if (!opt_disposing) {
    // switch the style back to rendering the original track
    var trackStyles = /** @type {Array<Object<string, *>>} */ (track.get(os.style.StyleType.FEATURE));
    var trackStyle = trackStyles ? trackStyles[0] : null;
    if (trackStyle) {
      delete trackStyle['geometry'];
      os.style.setFeatureStyle(track);
    }

    // reset coordinate fields and update time/distance to the full track
    plugin.track.updateDistance(track);
    plugin.track.updateDuration(track);
    plugin.track.updateCurrentPosition(track);
  }
};


/**
 * Update a track feature to represent the track at a provided timestamp.
 * @param {!ol.Feature} track The track.
 * @param {number} timestamp The timestamp.
 */
plugin.track.updateDynamic = function(track, timestamp) {
  var sortField = track.get(plugin.track.TrackField.SORT_FIELD);
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

  var timeIndex = plugin.track.getTimeIndex(flatCoordinates, timestamp, stride);
  plugin.track.updateCurrentLine(track, timestamp, timeIndex, flatCoordinates, stride, ends);

  plugin.track.updateDistance(track);
  plugin.track.updateDuration(track);
  track.changed();
};


/**
 * Get the closest index in the timestamp array for a time value.
 * @param {!Array<number>} coordinates The timestamp array
 * @param {number} value The time value to find
 * @param {number} stride The coordinate array stride.
 * @return {number}
 */
plugin.track.getTimeIndex = function(coordinates, value, stride) {
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
 * @param {!ol.Feature} track The track.
 * @param {number} timestamp The timestamp.
 * @param {number} index The index of the most recent known coordinate.
 * @param {!Array<number>} coordinates The flat track coordinate array.
 * @param {number} stride The stride of the coordinate array.
 * @return {ol.Coordinate|undefined}
 */
plugin.track.getTrackPositionAt = function(track, timestamp, index, coordinates, stride) {
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
    position = [
      goog.math.lerp(coordinates[prevIndex], coordinates[nextIndex], scale),
      goog.math.lerp(coordinates[prevIndex + 1], coordinates[nextIndex + 1], scale)
    ];

    // interpolate altitude if present
    if (stride === 4) {
      position.push(goog.math.lerp(coordinates[prevIndex + 2], coordinates[nextIndex + 2], scale));
    }

    position.push(timestamp);
  }

  return position;
};


/**
 * Update the track's line geometry to display its position up to the provided timestamp.
 * @param {!ol.Feature} track The track.
 * @param {number} timestamp The timestamp.
 * @param {number} index The index of the most recent known coordinate.
 * @param {!Array<number>} coordinates The flat track coordinate array.
 * @param {number} stride The stride of the coordinate array.
 * @param {Array<number>=} opt_ends The end indicies of each line in a multi-line. Undefined if not a multi-line.
 *
 * @suppress {accessControls} To allow direct access to line string coordinates.
 */
plugin.track.updateCurrentLine = function(track, timestamp, index, coordinates, stride, opt_ends) {
  var currentLine = /** @type {plugin.track.TrackLike|undefined} */ (track.get(plugin.track.TrackField.CURRENT_LINE));
  var layout = stride === 4 ? ol.geom.GeometryLayout.XYZM : ol.geom.GeometryLayout.XYM;
  if (!currentLine) {
    // create the line geometry if it doesn't exist yet. must use an empty coordinate array instead of null, or the
    // layout will be set to XY
    currentLine = opt_ends ? new ol.geom.MultiLineString([], layout) : new ol.geom.LineString([], layout);
    track.set(plugin.track.TrackField.CURRENT_LINE, currentLine);
  }

  var flatCoordinates = currentLine.flatCoordinates;
  if (flatCoordinates.length === index &&
      flatCoordinates[flatCoordinates.length - stride] === coordinates[coordinates.length - stride]) {
    // target is the last coordinate and it's already equal, so the line doesn't need to be modified
    return;
  }

  // strip the last coordinate, because it's probably the "most recent" and not part of the original track
  if (flatCoordinates.length > stride) {
    flatCoordinates.length = flatCoordinates.length - stride;
  }

  if (flatCoordinates.length >= index) {
    // the current line is longer than the expected line, so remove extra coordinates
    flatCoordinates.length = index;
  } else if (index > 0) {
    // the expected line is longer, so push missing coordinates to the array. the array is modified in place to avoid
    // having to set the coordinates on the line string.
    for (var i = flatCoordinates.length; i < index; i++) {
      flatCoordinates.push(coordinates[i]);
    }
  }

  // add ends indices that are in the current line
  var currentEnds = opt_ends ? opt_ends.filter(function(end) {
    return end <= flatCoordinates.length;
  }) : undefined;

  // interpolate the current position if we haven't exhausted the available coordinates and the last known position
  // isn't at one of the ends. if the current position is an end, the current time is between tracks in a multi track.
  if (flatCoordinates.length < coordinates.length &&
      (!currentEnds || !currentEnds.length || currentEnds[currentEnds.length - 1] !== flatCoordinates.length)) {
    var position = plugin.track.getTrackPositionAt(track, timestamp, index, coordinates, stride);
    if (position) {
      for (var i = 0; i < position.length; i++) {
        flatCoordinates.push(position[i]);
      }
    }

    // end the current line segment at the interpolated position
    if (currentEnds) {
      currentEnds.push(flatCoordinates.length);
    }
  }

  // update the current position marker
  plugin.track.updateCurrentPosition(track);

  // mark the line as dirty so the Cesium feature converter recreates it
  currentLine.set(os.olcs.DIRTY_BIT, true);

  // update the current line geometry
  if (currentLine instanceof ol.geom.LineString) {
    currentLine.setFlatCoordinates(layout, flatCoordinates);
  } else if (currentEnds) {
    currentLine.setFlatCoordinates(layout, flatCoordinates, currentEnds);
  }
};


/**
 * Update the z-index for a list of tracks. Ensures the current position icon for all tracks will be displayed on top
 * of the line string for every other track passed to the function.
 * @param {!Array<!ol.Feature>} tracks The track features.
 */
plugin.track.updateTrackZIndex = function(tracks) {
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
      if (style['geometry'] == plugin.track.TrackField.CURRENT_POSITION) {
        style['zIndex'] += topTrackZIndex;
      }
    }

    // update styles on the track and
    os.style.setFeatureStyle(track);
    track.changed();
  }
};

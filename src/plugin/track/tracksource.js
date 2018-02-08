goog.provide('plugin.track.TrackSource');

goog.require('goog.async.Delay');
goog.require('ol.Feature');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.Point');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.geom.GeometryField');
goog.require('os.olcs');
goog.require('plugin.file.kml.KMLSource');
goog.require('plugin.file.kml.ui.KMLNode');
goog.require('plugin.track');



/**
 * @param {olx.source.VectorOptions=} opt_options OpenLayers vector source options.
 * @extends {plugin.file.kml.KMLSource}
 * @constructor
 */
plugin.track.TrackSource = function(opt_options) {
  plugin.track.TrackSource.base(this, 'constructor', opt_options);

  // don't allow refreshing the track layer - it won't do anything useful
  this.refreshEnabled = false;

  // create the root node to store tracks
  var rootNode = new plugin.file.kml.ui.KMLNode();
  rootNode.setLabel(plugin.track.LAYER_TITLE);
  rootNode.setSource(this);
  this.setRootNode(rootNode);

  /**
   * Listen keys for tracks.
   * @type {!Object<string, ol.EventsKey|undefined>}
   * @private
   */
  this.trackListeners_ = {};

  /**
   * The highest z-index for a track.
   * @type {number}
   */
  this.topTrackZIndex = 0;

  /**
   * Delay to update the animation overlay after tracks are created.
   * @type {goog.async.Delay}
   * @private
   */
  this.updateDelay_ = new goog.async.Delay(this.updateAnimationOverlay, 250, this);
};
goog.inherits(plugin.track.TrackSource, plugin.file.kml.KMLSource);


/**
 * Suffix for the current position feature.
 * @type {string}
 * @const
 */
plugin.track.TrackSource.CURRENT_ID_SUFFIX = '-current';


/**
 * @inheritDoc
 */
plugin.track.TrackSource.prototype.disposeInternal = function() {
  plugin.track.TrackSource.base(this, 'disposeInternal');

  goog.dispose(this.updateDelay_);
  this.updateDelay_ = null;
};


/**
 * @inheritDoc
 */
plugin.track.TrackSource.prototype.getFilteredFeatures = function(opt_allTime) {
  // the most recent track position is always displayed, so force all time for track layers
  return plugin.track.TrackSource.base(this, 'getFilteredFeatures', true);
};


/**
 * @inheritDoc
 */
plugin.track.TrackSource.prototype.processImmediate = function(feature) {
  plugin.track.TrackSource.base(this, 'processImmediate', feature);

  // update the track so it will display correctly with the timeline open
  if (this.animationOverlay) {
    var sortField = feature.get(plugin.track.TrackField.SORT_FIELD);
    if (sortField == os.data.RecordField.TIME) {
      this.enableTrackAnimationState(feature);
    }
  }
};


/**
 * @inheritDoc
 */
plugin.track.TrackSource.prototype.processDeferred = function(features) {
  plugin.track.TrackSource.base(this, 'processDeferred', features);
  this.updateTrackZIndex();
};


/**
 * @inheritDoc
 */
plugin.track.TrackSource.prototype.unprocessImmediate = function(feature) {
  plugin.track.TrackSource.base(this, 'unprocessImmediate', feature);
  plugin.track.disposeAnimationGeometries(feature);
};


/**
 * @inheritDoc
 */
plugin.track.TrackSource.prototype.updateVisibilityFromNodes = function() {
  plugin.track.TrackSource.base(this, 'updateVisibilityFromNodes');
  this.updateTrackZIndex();
};


/**
 * Updates the z-index of all tracks in the layer.
 * @protected
 */
plugin.track.TrackSource.prototype.updateTrackZIndex = function() {
  var tracks = this.rootNode.getFeatures(false);

  // save the top z-index so current position icons can be displayed above tracks
  this.topTrackZIndex = tracks.length + 1;

  for (var i = 0; i < tracks.length; i++) {
    var track = tracks[i];
    var trackStyles = /** @type {!Array<!Object<string, *>>} */ (track.get(os.style.StyleType.FEATURE));
    if (!goog.isArray(trackStyles)) {
      trackStyles = [trackStyles];
    }

    for (var j = 0; j < trackStyles.length; j++) {
      var style = trackStyles[j];
      style['zIndex'] = tracks.length - i;

      // display current position above tracks
      if (style['geometry'] == plugin.track.TrackField.CURRENT_POSITION) {
        style['zIndex'] += this.topTrackZIndex;
      }
    }

    // update styles on the track and
    os.style.setFeatureStyle(track);
    track.changed();
  }
};


/**
 * Update the animation state for a track.
 * @param {!ol.Feature} track The track feature
 * @protected
 */
plugin.track.TrackSource.prototype.enableTrackAnimationState = function(track) {
  var trackStyles = /** @type {Array<Object<string, *>>} */ (track.get(os.style.StyleType.FEATURE));
  var trackStyle = trackStyles ? trackStyles[0] : null;
  if (trackStyle) {
    // switch the displayed track geometry to show the "current" line
    trackStyle['geometry'] = plugin.track.TrackField.CURRENT_LINE;

    os.ui.FeatureEditCtrl.restoreFeatureLabels(track);
    os.style.setFeatureStyle(track);
  }

  // update the overlay when the original geometry changes
  var trackGeometry = track.getGeometry();
  if (trackGeometry) {
    var trackId = String(track.getId());

    var listenKey = this.trackListeners_[trackId];
    if (listenKey) {
      ol.events.unlistenByKey(listenKey);
      this.trackListeners_[trackId] = undefined;
    }

    // if the original geometry changes, recreate the displayed line
    this.trackListeners_[trackId] = ol.events.listen(track, plugin.track.EventType.TRACK_GEOMETRY, function(event) {
      plugin.track.disposeAnimationGeometries(track);
      this.updateAnimationOverlay();
    }, this);
  }
};


/**
 * Update the animation state for a track.
 * @param {!ol.Feature} track The track feature
 * @protected
 */
plugin.track.TrackSource.prototype.disableTrackAnimationState = function(track) {
  // stop listening for geometry changes
  var trackId = String(track.getId());
  var listenKey = this.trackListeners_[trackId];
  if (listenKey) {
    ol.events.unlistenByKey(listenKey);
    this.trackListeners_[trackId] = undefined;
  }

  // dispose of the current track geometry and remove it from the feature
  plugin.track.disposeAnimationGeometries(track);

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
};


/**
 * @inheritDoc
 */
plugin.track.TrackSource.prototype.createAnimationOverlay = function() {
  plugin.track.TrackSource.base(this, 'createAnimationOverlay');

  // add a style to each track to mark its current position
  if (this.animationOverlay && this.rootNode) {
    var tracks = this.rootNode.getFeatures(true);
    for (var i = 0; i < tracks.length; i++) {
      var track = tracks[i];

      // an animation overlay is only created if the track is sorted by time
      var sortField = track.get(plugin.track.TrackField.SORT_FIELD);
      if (sortField == os.data.RecordField.TIME) {
        this.enableTrackAnimationState(track);
      }
    }
  }
};


/**
 * @inheritDoc
 */
plugin.track.TrackSource.prototype.disposeAnimationOverlay = function() {
  if (this.animationOverlay && this.rootNode) {
    var tracks = this.rootNode.getFeatures(true);
    for (var i = 0; i < tracks.length; i++) {
      var track = tracks[i];

      // an animation overlay is only created if the track is sorted by time
      var sortField = track.get(plugin.track.TrackField.SORT_FIELD);
      if (sortField == os.data.RecordField.TIME) {
        this.disableTrackAnimationState(tracks[i]);
      }
    }

    this.dispatchEvent(new os.events.PropertyChangeEvent(os.source.PropertyChange.DATA));
  }

  // make sure all geometry listeners have been removed
  for (var key in this.trackListeners_) {
    var listenKey = this.trackListeners_[key];
    if (listenKey) {
      ol.events.unlistenByKey(listenKey);
    }
  }

  this.trackListeners_ = {};

  plugin.track.TrackSource.base(this, 'disposeAnimationOverlay');
};


/**
 * @inheritDoc
 * @suppress {accessControls} To allow direct access to line string coordinates.
 */
plugin.track.TrackSource.prototype.updateAnimationOverlay = function() {
  if (this.animationOverlay) {
    var displayedFeatures = undefined;

    if (this.rootNode) {
      var visibleTracks = this.rootNode.getFeatures(false);
      if (visibleTracks && visibleTracks.length > 0) {
        displayedFeatures = visibleTracks;

        for (var i = 0; i < visibleTracks.length; i++) {
          var track = visibleTracks[i];
          var id = track.getId();

          if (id == null || !this.getFeatureById(id)) {
            // track isn't currently in the source
            continue;
          }

          var sortField = track.get(plugin.track.TrackField.SORT_FIELD);
          if (sortField !== os.data.RecordField.TIME) {
            // isn't sorted by time - can't create a current track
            continue;
          }

          var trackGeometry = track.getGeometry();
          if (!(trackGeometry instanceof ol.geom.MultiLineString)) {
            // shouldn't happen, but this will fail if the track isn't a multi-line
            continue;
          }

          var flatCoordinates = trackGeometry.getFlatCoordinates();
          var stride = trackGeometry.getStride();
          var ends = trackGeometry.getEnds();
          var geomLayout = trackGeometry.getLayout();
          if (!flatCoordinates || !ends ||
              (geomLayout !== ol.geom.GeometryLayout.XYM && geomLayout !== ol.geom.GeometryLayout.XYZM)) {
            // something is wrong with this line - abort!!
            continue;
          }

          var currentIndex = this.getTimeIndex(flatCoordinates, this.tlc.getCurrent(), stride);
          this.updateCurrentLine(track, currentIndex, flatCoordinates, stride, ends);

          plugin.track.updateDistance(track);
          plugin.track.updateDuration(track);
          track.changed();
        }

        // this will update the source grid
        this.dispatchEvent(new os.events.PropertyChangeEvent(os.source.PropertyChange.DATA));
      }
    }

    // tell the cesium synchronizer which features changed visibility to render them in 3D mode
    if (this.cesiumEnabled) {
      this.dispatchAnimationFrame(undefined, this.animationOverlay.getFeatures());
      this.dispatchAnimationFrame(this.animationOverlay.getFeatures(), displayedFeatures);
    }

    // set the animation overlay features so they're rendered in 2D mode
    this.animationOverlay.setFeatures(displayedFeatures);
  }
};


/**
 * Get the closest index in the timestamp array for a time value.
 * @param {!Array<number>} coordinates The timestamp array
 * @param {number} value The time value to find
 * @param {number} stride The coordinate array stride.
 * @return {number}
 * @protected
 */
plugin.track.TrackSource.prototype.getTimeIndex = function(coordinates, value, stride) {
  // find the closest timestamp to the current timeline position
  var index = os.array.binaryStrideSearch(coordinates, value, stride, stride - 1);
  if (index < 0) {
    // if current isn't in the array, goog.array.binarySearch will return (-(insertion point) - 1)
    index = -index - 1;
  }

  return index;
};


/**
 * Get the expected position of a track using the current time of the timeline controller.
 * @param {!ol.Feature} track The track.
 * @param {number} index The index of the most recent known coordinate.
 * @param {!Array<number>} coordinates The flat track coordinate array.
 * @param {number} stride The stride of the coordinate array.
 * @return {ol.Coordinate|undefined}
 * @protected
 */
plugin.track.TrackSource.prototype.getCurrentPosition = function(track, index, coordinates, stride) {
  var current = this.tlc.getCurrent();
  var currentPosition;

  if (index === 0) {
    // current is before the track starts - show the first position
    currentPosition = coordinates.slice(0, stride);
  } else if (index === coordinates.length) {
    // current is after the track ends - show the last position
    currentPosition = coordinates.slice(coordinates.length - stride);
  } else {
    // interpolate the current position based on the timestamp/coordinate on either side of the current time
    var prevTime = coordinates[index - 1];
    var nextTime = coordinates[index + stride - 1];
    var scale = (current - prevTime) / (nextTime - prevTime);

    // get the start index of each coordinate to avoid slicing the array (and resulting GC)
    var prevIndex = index - stride;
    var nextIndex = index;
    currentPosition = [
      goog.math.lerp(coordinates[prevIndex], coordinates[nextIndex], scale),
      goog.math.lerp(coordinates[prevIndex + 1], coordinates[nextIndex + 1], scale)
    ];

    // interpolate altitude if present
    if (stride === 4) {
      currentPosition.push(goog.math.lerp(coordinates[prevIndex + 2], coordinates[nextIndex + 2], scale));
    }

    currentPosition.push(current);
  }

  return currentPosition;
};


/**
 * Update the displayed line using the current time index.
 * @param {!ol.Feature} track The track.
 * @param {number} index The index of the most recent known coordinate.
 * @param {!Array<number>} coordinates The flat track coordinate array.
 * @param {number} stride The stride of the coordinate array.
 * @param {!Array<number>} ends The end indicies of each line in the multi-line.
 * @protected
 *
 * @suppress {accessControls} To allow direct access to line string coordinates.
 */
plugin.track.TrackSource.prototype.updateCurrentLine = function(track, index, coordinates, stride, ends) {
  var currentLine = /** @type {ol.geom.LineString|undefined} */ (track.get(plugin.track.TrackField.CURRENT_LINE));
  var layout = stride === 4 ? ol.geom.GeometryLayout.XYZM : ol.geom.GeometryLayout.XYM;
  if (!currentLine) {
    // create the line geometry if it doesn't exist yet. must use an empty coordinate array instead of null, or the
    // layout will be set to XY
    currentLine = new ol.geom.MultiLineString([], layout);
    currentLine.set(os.geom.GeometryField.DYNAMIC, true);

    track.set(plugin.track.TrackField.CURRENT_LINE, currentLine);
    this.updateDelay_.start();
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
  var currentEnds = ends.filter(function(end) {
    return end <= flatCoordinates.length;
  });

  if (flatCoordinates.length < coordinates.length) {
    // not showing the full track, so interpolate the current position
    var currentPosition = this.getCurrentPosition(track, index, coordinates, stride);
    if (currentPosition) {
      for (var i = 0; i < currentPosition.length; i++) {
        flatCoordinates.push(currentPosition[i]);
      }
    }

    // add the end location of the last line segment
    currentEnds.push(flatCoordinates.length);
  }

  // update the current position marker
  plugin.track.updateCurrentPosition(track);

  // mark the line as dirty so the Cesium feature converter recreates it
  currentLine.set(os.olcs.DIRTY_BIT, true);

  // update the line geometry
  currentLine.setFlatCoordinates(layout, flatCoordinates, currentEnds);
};

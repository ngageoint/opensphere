goog.provide('plugin.track.TrackManager');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.async.ConditionalDelay');
goog.require('goog.async.Throttle');
goog.require('goog.events.EventTarget');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('ol.events');
goog.require('ol.extent');
goog.require('os.time.TimeRange');



/**
 * Manager for handling tracks that are being followed during animation.
 * @extends {goog.events.EventTarget}
 * @constructor
 */
plugin.track.TrackManager = function() {
  plugin.track.TrackManager.base(this, 'constructor');

  /**
   * The list tracks currently being followed.
   * @type {!Array<!ol.Feature>}
   * @private
   */
  this.following_ = [];

  /**
   * The list of features that are in the current animation timeframe.
   * @type {!Array<!ol.Feature>}
   * @private
   */
  this.activeTracks_ = [];

  /**
   * The map container instance
   * @type {os.MapContainer|undefined}
   * @private
   */
  this.mc_ = os.MapContainer.getInstance();

  /**
   * The timeline controller instance.
   * @type {os.time.TimelineController|undefined}
   * @private
   */
  this.tlc_ = os.time.TimelineController.getInstance();

  /**
   * Defers attempting to follow a segment if the view is not ready
   * @type {goog.async.ConditionalDelay|undefined}
   * @private
   */
  this.mapReadyDelay_ = new goog.async.ConditionalDelay(this.showActiveTracks_.bind(this));

  /**
   * Throttle for how often we move the camera for tracked segments
   * @type {goog.async.Throttle|undefined}
   * @private
   */
  this.trackThrottle_ = new goog.async.Throttle(this.onTrackThrottle_, 1500, this);
};
goog.inherits(plugin.track.TrackManager, goog.events.EventTarget);
goog.addSingletonGetter(plugin.track.TrackManager);


/**
* Logger
* @type {goog.log.Logger}
* @private
* @const
*/
plugin.track.TrackManager.LOGGER_ = goog.log.getLogger('plugin.track.TrackManager');


/**
 * @inheritDoc
 */
plugin.track.TrackManager.prototype.disposeInternal = function() {
  goog.dispose(this.mapReadyDelay_);
  this.mapReadyDelay_ = undefined;

  goog.dispose(this.trackThrottle_);
  this.trackThrottle_ = undefined;

  this.following_.forEach(function(track) {
    ol.events.unlisten(track, ol.events.EventType.CHANGE, this.onFeatureValueChange_, this);
  }, this);

  this.following_.length = 0;
  this.activeTracks_.length = 0;

  this.mc_ = undefined;
  this.tlc_ = undefined;

  plugin.track.TrackManager.base(this, 'disposeInternal');
};


/**
 * Add the track(s) to the list of followed tracks
 * @param {Array<ol.Feature>} tracks
 */
plugin.track.TrackManager.prototype.followTracks = function(tracks) {
  tracks.forEach(function(track) {
    if (track && !goog.array.contains(this.following_, track)) {
      this.following_.push(track);
      ol.events.listen(track, ol.events.EventType.CHANGE, this.onFeatureValueChange_, this);
    }
  }, this);
};


/**
 * Remove the track(s) from the list of followed tracks
 * @param {Array<ol.Feature>} tracks
 */
plugin.track.TrackManager.prototype.unfollowTracks = function(tracks) {
  tracks.forEach(function(track) {
    if (track) {
      ol.events.unlisten(track, ol.events.EventType.CHANGE, this.onFeatureValueChange_, this);

      goog.array.removeIf(this.following_, function(item) {
        return item === track;
      });

      goog.array.removeIf(this.activeTracks_, function(item) {
        return item === track;
      });

      // also need to remove it from the active tracks
      for (var k = 0; k < this.activeTracks_.length; k++) {
        if (this.activeTracks_[k] == track) {
          goog.array.removeAt(this.activeTracks_, k);
        }
      }
    }
  }, this);
};


/**
 * Return whether a set of tracks is being followed.
 * @param {Array<ol.Feature>} tracks
 * @return {boolean} false if any of the tracks passed in are not followed
 */
plugin.track.TrackManager.prototype.isFollowed = function(tracks) {
  for (var j = 0; j < tracks.length; j++) {
    if (!goog.array.contains(this.following_, tracks[j])) {
      return false;
    }
  }

  return true;
};


/**
 * Called when track/feature change event is received
 * @param {ol.events.Event} event
 * @private
 */
plugin.track.TrackManager.prototype.onFeatureValueChange_ = function(event) {
  this.setActiveTracks_();

  // throttle the updates so that the movement doesn't get behind
  this.trackThrottle_.fire();
};


/**
 * Handle the track throttle event.
 * @private
 */
plugin.track.TrackManager.prototype.onTrackThrottle_ = function() {
  if (this.mapReadyDelay_) {
    this.mapReadyDelay_.start(100, 5000);
  }
};


/**
 * Move the map to show active tracks.
 * @return {boolean} If the operation succeeded, for use with `goog.async.ConditionalDelay`.
 * @private
 */
plugin.track.TrackManager.prototype.showActiveTracks_ = function() {
  try {
    // if the map/view aren't ready, return false so the conditional delay will keep trying
    var view = this.mc_.getMap().getView();
    if (!view || !view.isDef()) {
      return false;
    }

    var resolution = view.getResolution();

    var viewExtent = this.mc_.getViewExtent();
    if (ol.extent.equals(viewExtent, os.map.ZERO_EXTENT)) {
      return false;
    }

    if (this.mc_.getMap().isRendered()) {
      var extent = this.getActiveExtent(this.activeTracks_);

      if (!ol.extent.isEmpty(extent) &&
          !ol.extent.containsExtent(ol.extent.buffer(viewExtent, -2), extent)) {
        goog.asserts.assert(resolution != null, 'resolution should be defined');
        this.mc_.flyToExtent(extent, 5, this.mc_.resolutionToZoom(resolution));
      }
    }
  } catch (e) {
    goog.log.error(plugin.track.TrackManager.LOGGER_, 'Error checking if map was ready:', e);
  }

  return true;
};


/**
 * Sets the list of active tracks to those that fall within the current timeline controller animation range.
 * @private
 */
plugin.track.TrackManager.prototype.setActiveTracks_ = function() {
  // get the current animation range and determine which tracks are "active"
  var range = this.tlc_.getAnimationRange();
  var trackSource = os.osDataManager.getSource('track');

  if (trackSource) {
    // find any tracks that overlap the timerange
    var timeRange = new os.time.TimeRange(range.start, range.end);
    this.activeTracks_ = /** @type {!Array<!ol.Feature>} */ (trackSource.getTimeModel().intersection(
        timeRange, false, false));

    // check which of the active tracks are to be followed
    for (var i = 0; i < this.activeTracks_.length; i++) {
      if (!goog.array.contains(this.following_, this.activeTracks_[i])) {
        goog.array.removeAt(this.activeTracks_, i);
      }
    }
  }
};


/**
 * Generate an extent for all multiple tracks combined.
 * @param {Array<ol.Feature>} tracks
 * @return {ol.Extent}
 */
plugin.track.TrackManager.prototype.getActiveExtent = function(tracks) {
  // generate the appropriate extent for the track(s) that are
  // active so that everything is appropriately shown
  var coordinates = [];
  if (tracks) {
    for (var i = 0; i < tracks.length; i++) {
      var trackPos = tracks[i].get(plugin.track.TrackField.CURRENT_POSITION);
      if (trackPos) {
        coordinates.push(trackPos.getCoordinates());
      }
    }
  }

  return ol.extent.boundingExtent(coordinates);
};

goog.module('plugin.track.TrackManager');
goog.module.declareLegacyNamespace();

const googArray = goog.require('goog.array');
const asserts = goog.require('goog.asserts');
const ConditionalDelay = goog.require('goog.async.ConditionalDelay');
const Throttle = goog.require('goog.async.Throttle');
const EventTarget = goog.require('goog.events.EventTarget');
const log = goog.require('goog.log');
const array = goog.require('ol.array');
const events = goog.require('ol.events');
const olExtent = goog.require('ol.extent');
const TimeRange = goog.require('os.time.TimeRange');
const osTrack = goog.require('os.track');
const Logger = goog.requireType('goog.log.Logger');


/**
 * Manager for handling tracks that are being followed during animation.
 */
class TrackManager extends EventTarget {
  /**
   * Constructor.
   */
  constructor() {
    super();

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
     * @type {ConditionalDelay|undefined}
     * @private
     */
    this.mapReadyDelay_ = new ConditionalDelay(this.showActiveTracks_.bind(this));

    /**
     * Throttle for how often we move the camera for tracked segments
     * @type {Throttle|undefined}
     * @private
     */
    this.trackThrottle_ = new Throttle(this.onTrackThrottle_, 1500, this);
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    goog.dispose(this.mapReadyDelay_);
    this.mapReadyDelay_ = undefined;

    goog.dispose(this.trackThrottle_);
    this.trackThrottle_ = undefined;

    this.following_.forEach(function(track) {
      events.unlisten(track, events.EventType.CHANGE, this.onFeatureValueChange_, this);
    }, this);

    this.following_.length = 0;
    this.activeTracks_.length = 0;

    this.mc_ = undefined;
    this.tlc_ = undefined;

    super.disposeInternal();
  }

  /**
   * Add the track(s) to the list of followed tracks
   *
   * @param {Array<ol.Feature>} tracks
   */
  followTracks(tracks) {
    tracks.forEach(function(track) {
      if (track && !array.includes(this.following_, track)) {
        this.following_.push(track);
        events.listen(track, events.EventType.CHANGE, this.onFeatureValueChange_, this);
      }
    }, this);
  }

  /**
   * Remove the track(s) from the list of followed tracks
   *
   * @param {Array<ol.Feature>} tracks
   */
  unfollowTracks(tracks) {
    tracks.forEach(function(track) {
      if (track) {
        events.unlisten(track, events.EventType.CHANGE, this.onFeatureValueChange_, this);

        googArray.removeIf(this.following_, function(item) {
          return item === track;
        });

        googArray.removeIf(this.activeTracks_, function(item) {
          return item === track;
        });

        // also need to remove it from the active tracks
        for (var k = 0; k < this.activeTracks_.length; k++) {
          if (this.activeTracks_[k] == track) {
            googArray.removeAt(this.activeTracks_, k);
          }
        }
      }
    }, this);
  }

  /**
   * Return whether a set of tracks is being followed.
   *
   * @param {Array<ol.Feature>} tracks
   * @return {boolean} false if any of the tracks passed in are not followed
   */
  isFollowed(tracks) {
    for (var j = 0; j < tracks.length; j++) {
      if (!array.includes(this.following_, tracks[j])) {
        return false;
      }
    }

    return true;
  }

  /**
   * Called when track/feature change event is received
   *
   * @param {events.Event} event
   * @private
   */
  onFeatureValueChange_(event) {
    this.setActiveTracks_();

    // throttle the updates so that the movement doesn't get behind
    this.trackThrottle_.fire();
  }

  /**
   * Handle the track throttle event.
   *
   * @private
   */
  onTrackThrottle_() {
    if (this.mapReadyDelay_) {
      this.mapReadyDelay_.start(100, 5000);
    }
  }

  /**
   * Move the map to show active tracks.
   *
   * @return {boolean} If the operation succeeded, for use with `ConditionalDelay`.
   * @private
   */
  showActiveTracks_() {
    try {
      // if the map/view aren't ready, return false so the conditional delay will keep trying
      var view = this.mc_.getMap().getView();
      if (!view || !view.isDef()) {
        return false;
      }

      var resolution = view.getResolution();

      var viewExtent = this.mc_.getViewExtent();
      if (olExtent.equals(viewExtent, os.map.ZERO_EXTENT)) {
        return false;
      }

      if (this.mc_.getMap().isRendered()) {
        var extent = this.getActiveExtent(this.activeTracks_);

        if (!olExtent.isEmpty(extent) &&
            !olExtent.containsExtent(olExtent.buffer(viewExtent, -2), extent)) {
          asserts.assert(resolution != null, 'resolution should be defined');
          this.mc_.flyToExtent(extent, 5, this.mc_.resolutionToZoom(resolution));
        }
      }
    } catch (e) {
      log.error(TrackManager.LOGGER_, 'Error checking if map was ready:', e);
    }

    return true;
  }

  /**
   * Sets the list of active tracks to those that fall within the current timeline controller animation range.
   *
   * @private
   */
  setActiveTracks_() {
    // get the current animation range and determine which tracks are "active"
    var range = this.tlc_.getAnimationRange();
    var source = plugin.places.PlacesManager.getInstance().getPlacesSource();

    if (source) {
      // find any tracks that overlap the timerange
      var timeRange = new TimeRange(range.start, range.end);
      this.activeTracks_ = /** @type {!Array<!ol.Feature>} */ (source.getTimeModel().intersection(
          timeRange, false, false));

      // check which of the active tracks are to be followed
      for (var i = 0; i < this.activeTracks_.length; i++) {
        if (!array.includes(this.following_, this.activeTracks_[i])) {
          googArray.removeAt(this.activeTracks_, i);
        }
      }
    }
  }

  /**
   * Generate an extent for all multiple tracks combined.
   *
   * @param {Array<ol.Feature>} tracks
   * @return {ol.Extent}
   */
  getActiveExtent(tracks) {
    // generate the appropriate extent for the track(s) that are
    // active so that everything is appropriately shown
    var coordinates = [];
    if (tracks) {
      for (var i = 0; i < tracks.length; i++) {
        var trackPos = tracks[i].get(osTrack.TrackField.CURRENT_POSITION);
        if (trackPos) {
          coordinates.push(trackPos.getCoordinates());
        }
      }
    }

    return olExtent.boundingExtent(coordinates);
  }
}

goog.addSingletonGetter(TrackManager);


/**
 * Logger
 * @type {Logger}
 * @private
 * @const
 */
TrackManager.LOGGER_ = log.getLogger('plugin.track.TrackManager');


exports = TrackManager;

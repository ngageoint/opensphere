goog.declareModuleId('plugin.track.TrackManager');

import './confirmtrack.js';
import {includes} from 'ol/src/array.js';
import {listen, unlistenByKey} from 'ol/src/events.js';
import {equals, isEmpty, containsExtent, buffer, boundingExtent} from 'ol/src/extent.js';
import AlertEventSeverity from '../../os/alert/alerteventseverity.js';
import AlertManager from '../../os/alert/alertmanager.js';
import * as osColor from '../../os/color.js';
import RecordField from '../../os/data/recordfield.js';
import * as osFeature from '../../os/feature/feature.js';
import Fields from '../../os/fields/fields.js';
import OsMeasure from '../../os/interaction/measureinteraction.js';
import * as osInterpolate from '../../os/interpolate.js';
import * as osMap from '../../os/map/map.js';
import MapContainer from '../../os/mapcontainer.js';
import * as osObject from '../../os/object/object.js';
import * as osStyle from '../../os/style/style.js';
import StyleField from '../../os/style/stylefield.js';
import StyleType from '../../os/style/styletype.js';
import TimeInstant from '../../os/time/timeinstant.js';
import TimelineController from '../../os/time/timelinecontroller.js';
import TimeRange from '../../os/time/timerange.js';
import * as osTrack from '../../os/track/track.js';
import TrackField from '../../os/track/trackfield.js';
import * as osWindow from '../../os/ui/window.js';
import PlacesManager from '../places/placesmanager.js';
import * as pluginTrack from './track.js';
import TrackInteraction from './trackinteraction.js';

const googArray = goog.require('goog.array');
const asserts = goog.require('goog.asserts');
const ConditionalDelay = goog.require('goog.async.ConditionalDelay');
const Throttle = goog.require('goog.async.Throttle');
const dispose = goog.require('goog.dispose');
const EventTarget = goog.require('goog.events.EventTarget');
const log = goog.require('goog.log');


/**
 * @type {string}
 * @const
 */
const PREDICTED_TRACK_LABEL = '[Predicted';

/**
 * Manager for handling tracks that are being followed during animation.
 */
export default class TrackManager extends EventTarget {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * The list tracks currently being followed.
     * @type {!Array<!OlFeature>}
     * @private
     */
    this.following_ = [];

    /**
     * The list of features that are in the current animation timeframe.
     * @type {!Array<!OlFeature>}
     * @private
     */
    this.activeTracks_ = [];

    /**
     * The map container instance
     * @type {MapContainer|undefined}
     * @private
     */
    this.mc_ = MapContainer.getInstance();

    /**
     * The timeline controller instance.
     * @type {TimelineController|undefined}
     * @private
     */
    this.tlc_ = TimelineController.getInstance();

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

    /**
     * @type {number}
     * @protected
     */
    this.nextPredictedTrack = 0;

    this.followingListenKeys = [];
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    dispose(this.mapReadyDelay_);
    this.mapReadyDelay_ = undefined;

    dispose(this.trackThrottle_);
    this.trackThrottle_ = undefined;

    this.followingListenKeys.forEach(function(key) {
      unlistenByKey(key);
    }, this);
    this.followingListenKeys = [];

    this.following_.length = 0;
    this.activeTracks_.length = 0;

    this.mc_ = undefined;
    this.tlc_ = undefined;

    super.disposeInternal();
  }

  /**
   * Add the track(s) to the list of followed tracks
   *
   * @param {Array<OlFeature>} tracks
   */
  followTracks(tracks) {
    tracks.forEach(function(track) {
      if (track && !includes(this.following_, track)) {
        this.following_.push(track);
        this.followingListenKeys.push(listen(track, events.EventType.CHANGE, this.onFeatureValueChange_, this));
      }
    }, this);
  }

  /**
   * Remove the track(s) from the list of followed tracks
   *
   * @param {Array<OlFeature>} tracks
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
        for (let k = 0; k < this.activeTracks_.length; k++) {
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
   * @param {Array<OlFeature>} tracks
   * @return {boolean} false if any of the tracks passed in are not followed
   */
  isFollowed(tracks) {
    for (let j = 0; j < tracks.length; j++) {
      if (!includes(this.following_, tracks[j])) {
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
      const view = this.mc_.getMap().getView();
      if (!view || !view.isDef()) {
        return false;
      }

      const resolution = view.getResolution();

      const viewExtent = this.mc_.getViewExtent();
      if (equals(viewExtent, osMap.ZERO_EXTENT)) {
        return false;
      }

      if (this.mc_.getMap().isRendered()) {
        const extent = this.getActiveExtent(this.activeTracks_);

        if (!isEmpty(extent) &&
            !containsExtent(buffer(viewExtent, -2), extent)) {
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
    const range = this.tlc_.getAnimationRange();
    const source = PlacesManager.getInstance().getPlacesSource();

    if (source) {
      // find any tracks that overlap the timerange
      const timeRange = new TimeRange(range.start, range.end);
      this.activeTracks_ = /** @type {!Array<!OlFeature>} */ (source.getTimeModel().intersection(
          timeRange, false, false));

      // check which of the active tracks are to be followed
      for (let i = 0; i < this.activeTracks_.length; i++) {
        if (!includes(this.following_, this.activeTracks_[i])) {
          googArray.removeAt(this.activeTracks_, i);
        }
      }
    }
  }

  /**
   * Generate an extent for all multiple tracks combined.
   *
   * @param {Array<OlFeature>} tracks
   * @return {ol.Extent}
   */
  getActiveExtent(tracks) {
    // generate the appropriate extent for the track(s) that are
    // active so that everything is appropriately shown
    const coordinates = [];
    if (tracks) {
      for (let i = 0; i < tracks.length; i++) {
        const trackPos = tracks[i].get(TrackField.CURRENT_POSITION);
        if (trackPos) {
          coordinates.push(trackPos.getCoordinates());
        }
      }
    }

    return boundingExtent(coordinates);
  }

  /**
   * Prompt the user to choose a track.
   *
   * @return {!Promise}
   */
  promptForTrack() {
    // use a regular promise
    return new Promise(function(resolve, reject) {
      this.launchConfirmTrack(resolve, reject);
    }.bind(this));
  }

  /**
   * Launch a dialog prompting the user to pick a color.
   *
   * @param {function(!OlFeature)} confirm The confirm callback
   * @param {function(*)} cancel The cancel callback
   */
  launchConfirmTrack(confirm, cancel) {
    var scopeOptions = {
      'confirmCallback': confirm,
      'cancelCallback': cancel,
      'yesText': 'OK',
      'yesIcon': 'fa fa-check',
      'yesButtonClass': 'btn-primary',
      'noText': 'Cancel',
      'noIcon': 'fa fa-ban',
      'noButtonClass': 'btn-secondary'
    };

    var windowOptions = {
      'label': 'Choose a Track',
      'icon': 'fa ' + osTrack.ICON,
      'x': 'center',
      'y': 'center',
      'width': 300,
      'min-width': 200,
      'max-width': 1200,
      'height': 'auto',
      'modal': 'true',
      'show-close': 'false'
    };

    var template = '<confirm><confirmtrack></confirmtrack></confirm>';
    osWindow.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
  }

  /**
   * Kick off TrackInteraction. Follow mouse until user clicks or types Esc
   *
   * @param {Array<!OlFeature>} tracks
   * @param {OlMapBrowserEvent} event
   */
  promptForTrackPrediction(tracks, event) {
    const interaction = this.getTrackInteraction_();
    if (interaction) {
      const toggle = !interaction.getActive();
      let config;
      if (toggle) {
        const track = tracks[tracks.length - 1];
        config = /** @type {pluginx.track.TrackOptions} */ ({
          callback: this.interactionCallback_.bind(this, interaction, track),
          track: track
        });
      }
      interaction.trigger(toggle, event, config);
    }
  }

  /**
   * Append new coordinates to the track
   *
   * @param {!TrackInteraction} interaction
   * @param {!OlFeature} track
   * @param {Array<Array<number>>} coords
   * @private
   */
  interactionCallback_(interaction, track, coords) {
    interaction.trigger(false);

    if (track && coords.length > 0) {
      const name = /** @type {string|undefined} */ (track.get(Fields.NAME) || track.get(Fields.NAME.toLowerCase()));
      const isPredictedTrack = /** @type {boolean} */ (name && name.indexOf(PREDICTED_TRACK_LABEL) >= 0);
      const time = this.getTime_(track, coords);

      if (!time) {
        // fail gracefully
        var msg = 'Track creation failed. There were no valid timestamps from which to create a track.';
        AlertManager.getInstance().sendAlert(msg, AlertEventSeverity.WARNING);
      } else {
        // build the coordinates, interpolating as necessary
        const coordinates = this.getCoordinates_(coords, isPredictedTrack);
        if (isPredictedTrack) {
          osTrack.addToTrack(/** @type {AddOptions} */ ({
            track,
            coordinates
          }));
        } else {
          this.addTrack_(interaction, track, coordinates, name);
        }
      }
    }
  }

  /**
   * Fill in the time part of the coordinates
   * @param {!OlFeature} track
   * @param {Array<Array<number>>} coords
   * @return {number|undefined}
   * @private
   */
  getTime_(track, coords) {
    let time;
    if (coords[0].length < 4) {
      // add a 0 altitude if need be
      if (coords[0].length < 3) {
        coords.forEach((coord) => {
          if (coord.length == 2) {
            coord.push(0);
          }
        });
      }

      // get the starting time
      time = track.get(RecordField.TIME);
      if (time) {
        if (time instanceof TimeInstant) {
          time = time.getStart();
        } else if (time instanceof TimeRange) {
          time = time.getEnd();
        } else {
          time = /** @type {number} */ (time);
        }
        coords[0].push(time);
      }
    } else {
      time = coords[0][3];
    }
    return /** @type {number} */ (time);
  }

  /**
   * Fill in the Coordinates
   * @param {Array<Array<number>>} coords
   * @param {boolean} isPredictedTrack
   * @return {Array<ol.Coordinate>}
   * @private
   */
  getCoordinates_(coords, isPredictedTrack) {
    const coordinates = /** @type {Array<ol.Coordinate>} */ ([]);
    let alt = coords[0][2];
    let time = coords[0][3];

    // add the end of the old track as the start of the predicted one
    coordinates.push(coords[0]);

    for (let i = 1; i < coords.length; i++) {
      alt += 0; // TODO fix alt. for now, just repeat the starting altitude
      time += 3600000; // TODO fix time. for now, increment time by one hour

      // take the Lat/Lon from coord, but splice in altitude and time
      const coord = coords[i];
      if (coord) {
        coord.splice(2, 2, alt, time);
        coordinates.push(coord);
      }
    }

    // fill in points so Tracks can draw with Interpolation.Method = NONE
    osInterpolate.interpolateLineWithConfig(
        coordinates,
        /** @type {OsInterpolateConfig} */ ({
          method: OsMeasure.method,
          distance: 100000
        })
    );

    // remove the first coordinate since it's already part of the track we'll extend
    if (isPredictedTrack) {
      coordinates.splice(0, 1);
    }

    return coordinates;
  }

  /**
   * Add a new track with the appropriate "Predicted" name and styles
   * @param {!TrackInteraction} interaction
   * @param {!OlFeature} track
   * @param {Array<ol.Coordinate>} coordinates
   * @param {string=} opt_name
   * @private
   */
  addTrack_(interaction, track, coordinates, opt_name = 'Track') {
    this.nextPredictedTrack++;

    let color = osColor.toRgbArray(osObject.unsafeClone(osFeature.getColor(track)));
    color[3] = .45;
    color = osStyle.toRgbaString(color);

    const newTrack = pluginTrack.createAndAdd(/** @type {CreateOptions} */ ({
      name: [PREDICTED_TRACK_LABEL, ', ', OsMeasure.method, '] ',
        this.nextPredictedTrack, ' | ', opt_name].join(''),
      includeMetadata: true,
      color,
      coordinates: coordinates
    }));

    if (newTrack) {
      const styles = osObject.unsafeClone(newTrack.get(StyleType.FEATURE) || track.get(StyleType.FEATURE));
      let style = styles;
      if (style) {
        if (Array.isArray(style)) {
          style = style[0];
        }
        // edit style stroke
        let stroke = style[StyleField.STROKE];
        if (!stroke) {
          stroke = osObject.unsafeClone(interaction.getStyle().getStroke());
        } else {
          stroke['color'] = color;
          stroke['width'] = 2;
          stroke['lineDash'] = osStyle.LINE_STYLE_OPTIONS[6].pattern;
        }
        style[StyleField.STROKE] = stroke;
        newTrack.set(StyleType.FEATURE, styles);
      }
    }
  }

  /**
   * @return {?TrackInteraction} The measure interaction
   * @private
   */
  getTrackInteraction_() {
    const interactions = this.mc_.getMap().getInteractions().getArray();
    const interaction = interactions.find((i) => {
      return (i instanceof TrackInteraction && i.isType('track')); // TODO constant
    });
    return /** @type {TrackInteraction} */ (interaction);
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

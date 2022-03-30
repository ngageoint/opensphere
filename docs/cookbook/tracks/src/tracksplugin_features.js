goog.declareModuleId('plugin.cookbook_tracks.TracksPlugin');

import Feature from 'ol/src/Feature.js';
import Point from 'ol/src/geom/Point.js';
import {getTransform} from 'ol/src/proj.js';

import EventType from 'opensphere/src/os/config/eventtype.js';
import RecordField from 'opensphere/src/os/data/recordfield.js';
import {PROJECTION} from 'opensphere/src/os/map/map.js';
import AbstractPlugin from 'opensphere/src/os/plugin/abstractplugin.js';
import PluginManager from 'opensphere/src/os/plugin/pluginmanager.js';
import {EPSG4326} from 'opensphere/src/os/proj/proj.js';
import TimeInstant from 'opensphere/src/os/time/timeinstant.js';
import {addToTrack} from 'opensphere/src/os/track/track.js';
import PlacesManager from 'opensphere/src/plugin/places/placesmanager.js';
import {createAndAdd} from 'opensphere/src/plugin/track/track.js';

const {CreateOptions} = goog.requireType('os.track');


let transformToMap;

/**
 * Provides a plugin cookbook example for track creation and update.
 */
export default class TracksPlugin extends AbstractPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.id = ID;
    this.errorMessage = null;

    /**
     * @type {number}
     */
    this.lat = -35.0;

    /**
     * @type {number}
     */
    this.lon = 135.0;

    /**
     * @type {number}
     */
    this.latDelta = 0.1;

    /**
     * @type {number}
     */
    this.lonDelta = 0.1;
  }

  /**
   * @inheritDoc
   */
  init() {
    transformToMap = getTransform(EPSG4326, PROJECTION);
    const placesManager = PlacesManager.getInstance();
    if (placesManager.isLoaded()) {
      this.onPlacesLoaded();
    } else {
      placesManager.listenOnce(EventType.LOADED, this.onPlacesLoaded, false, this);
    }
  }

  /**
   * @private
   */
  onPlacesLoaded() {
    const track = createAndAdd(/** @type {!CreateOptions} */({
      features: this.getFeatures_(),
      name: 'Cookbook track',
      color: '#00ff00'
    }));

    setInterval(() => {
      this.updateTrack(/** @type {!Feature} */ (track));
    }, 2000);
  }

  /**
   * @private
   * @return {!Array<!Feature>} features array for current location
   */
  getFeatures_() {
    const coordinate = transformToMap([this.lon, this.lat]);
    const point = new Point(coordinate);
    const feature = new Feature(point);
    feature.set(RecordField.TIME, new TimeInstant(Date.now()));
    const features = [feature];
    return features;
  }

  /**
   * Update the position and post the new track location.
   * @param {!Feature} track the track to update
   */
  updateTrack(track) {
    this.modifyPosition_();
    addToTrack({
      features: this.getFeatures_(),
      track: track
    });
  }

  /**
   * @private
   */
  modifyPosition_() {
    this.lat += this.latDelta;
    this.lon += this.lonDelta;
    if (this.lat > 50.0) {
      this.latDelta = -0.05;
    }
    if (this.lat < -50.0) {
      this.latDelta = 0.05;
    }
    if (this.lon >= 160.0) {
      this.lonDelta = -0.05;
    }
    if (this.lon < 0.0) {
      this.lonDelta = 0.05;
    }
  }
}

/**
 * @type {string}
 */
const ID = 'cookbook_tracks';

// add the plugin to the application
PluginManager.getInstance().addPlugin(new TracksPlugin());

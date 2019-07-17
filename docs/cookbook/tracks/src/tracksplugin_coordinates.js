goog.provide('plugin.cookbook_tracks.TracksPlugin');

goog.require('ol.Feature');
goog.require('os.plugin.AbstractPlugin');
goog.require('os.plugin.PluginManager');
goog.require('os.time.TimeInstant');
goog.require('plugin.track');

var transformToMap;

/**
 * Provides a plugin cookbook example for track creation and update.
 *
 * @extends {os.plugin.AbstractPlugin}
 * @constructor
 */
plugin.cookbook_tracks.TracksPlugin = function() {
  plugin.cookbook_tracks.TracksPlugin.base(this, 'constructor');
  this.id = plugin.cookbook_tracks.ID;
  this.errorMessage = null;
};
goog.inherits(plugin.cookbook_tracks.TracksPlugin, os.plugin.AbstractPlugin);

plugin.cookbook_tracks.TracksPlugin.prototype.lat = -35.0;
plugin.cookbook_tracks.TracksPlugin.prototype.lon = 135.0;
plugin.cookbook_tracks.TracksPlugin.prototype.latDelta = 0.1;
plugin.cookbook_tracks.TracksPlugin.prototype.lonDelta = 0.1;

/**
 * @type {string}
 * @const
 */
plugin.cookbook_tracks.ID = 'cookbook_tracks';

/**
 * @inheritDoc
 */
plugin.cookbook_tracks.TracksPlugin.prototype.init = function() {
  transformToMap = ol.proj.getTransform(os.proj.EPSG4326, os.map.PROJECTION);
  var placesManager = plugin.places.PlacesManager.getInstance();
  if (placesManager.isLoaded()) {
    this.onPlacesLoaded();
  } else {
    placesManager.listenOnce(os.config.EventType.LOADED, this.onPlacesLoaded, false, this);
  }
};

/**
 * @private
 */
plugin.cookbook_tracks.TracksPlugin.prototype.onPlacesLoaded = function() {
  var track = plugin.track.createAndAdd(/** @type {!plugin.track.CreateOptions} */({
    coordinates: this.getCoordinates_(),
    name: 'Cookbook track',
    color: '#00ff00'
  }));
  var fn = plugin.cookbook_tracks.TracksPlugin.prototype.updateTrack.bind(this);
  setInterval(function() {
    fn(/** @type {!ol.Feature} */(track));
  }, 2000);
};

/**
 * @private
 * @return {!Array<!Array<number>>} coordinates array for current location
 */
plugin.cookbook_tracks.TracksPlugin.prototype.getCoordinates_ = function() {
  var coordinate = transformToMap([this.lon, this.lat]);
  coordinate.push(0);
  coordinate.push(Date.now());
  var coordinates = [coordinate];
  return coordinates;
};

/**
 * Update the position and post the new track location.
 * @param {!ol.Feature} track the track to update
 */
plugin.cookbook_tracks.TracksPlugin.prototype.updateTrack = function(track) {
  this.modifyPosition_();
  plugin.track.addToTrack({
    coordinates: this.getCoordinates_(),
    track: track
  });
};

/**
 * @private
 */
plugin.cookbook_tracks.TracksPlugin.prototype.modifyPosition_ = function() {
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
};

// add the plugin to the application
os.plugin.PluginManager.getInstance().addPlugin(new plugin.cookbook_tracks.TracksPlugin());



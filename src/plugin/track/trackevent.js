goog.provide('plugin.track.Event');
goog.provide('plugin.track.EventType');

goog.require('goog.events.Event');


/**
 * Events for the track plugin.
 * @enum {string}
 */
plugin.track.EventType = {
  CREATE_TRACK: 'track:create',
  ADD_TO: 'track:addTo',
  FOLLOW: 'track:followTrack',
  UNFOLLOW: 'track:unfollowTrack'
};



/**
 * Event for the track plugin.
 * @param {string} type The event type
 *
 * @extends {goog.events.Event}
 * @constructor
 */
plugin.track.Event = function(type) {
  plugin.track.Event.base(this, 'constructor', type);

  /**
   * The existing track feature.
   * @type {ol.Feature|undefined}
   */
  this.track = undefined;

  /**
   * The features used to assemble the track.
   * @type {Array<!ol.Feature>|undefined}
   */
  this.features = undefined;

  /**
   * The histogram bins used to create the track.
   * @type {Array<!os.data.histo.ColorBin>|undefined}
   */
  this.bins = undefined;

  /**
   * The filters used to match track features. Must match up to the bins array.
   * @type {Array<!os.filter.FilterEntry>|undefined}
   */
  this.filters = undefined;

  /**
   * The track title.
   * @type {string|undefined}
   */
  this.title = undefined;

  /**
   * The feature field used to sort positions in the track.
   * @type {string|undefined}
   */
  this.sortField = undefined;

  /**
   * The id of the originating data source.
   * @type {string|undefined}
   */
  this.sourceId = undefined;
};
goog.inherits(plugin.track.Event, goog.events.Event);

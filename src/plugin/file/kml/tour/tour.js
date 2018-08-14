goog.provide('plugin.file.kml.tour.EventType');
goog.provide('plugin.file.kml.tour.Tour');

goog.require('goog.async.nextTick');
goog.require('goog.events.EventTarget');


/**
 * Tour event types.
 * @enum {string}
 */
plugin.file.kml.tour.EventType = {
  PLAYING: 'playing'
};


/**
 * Represents a KML tour, from a `gx:Tour` (KML 2.2) or `Tour` (KML 2.3) element.
 * @param {string=} opt_name The name of the tour.
 * @param {string=} opt_description The tour description.
 * @param {Array<!plugin.file.kml.tour.AbstractTourPrimitive>=} opt_playlist The tour playlist.
 * @extends {goog.events.EventTarget}
 * @constructor
 */
plugin.file.kml.tour.Tour = function(opt_name, opt_description, opt_playlist) {
  plugin.file.kml.tour.Tour.base(this, 'constructor');

  /**
   * The name of the tour.
   * @type {string}
   */
  this['name'] = opt_name || 'Unnamed Tour';

  /**
   * The tour description.
   * @type {string}
   */
  this['description'] = opt_description || '';

  /**
   * If the tour should be repeated when it completes.
   * @type {boolean}
   */
  this['repeat'] = false;

  /**
   * If the tour is currently playing.
   * @type {boolean}
   */
  this['playing'] = false;

  /**
   * The tour playlist.
   * @type {!Array<!plugin.file.kml.tour.AbstractTourPrimitive>}
   * @private
   */
  this.playlist_ = opt_playlist || [];

  /**
   * Index of the next tour primitive to execute.
   * @type {number}
   * @private
   */
  this.playlistIndex_ = 0;

  /**
   * Promise for the currently executing tour primitive.
   * @type {goog.Promise|undefined}
   * @private
   */
  this.currentPromise_ = undefined;
};
goog.inherits(plugin.file.kml.tour.Tour, goog.events.EventTarget);


/**
 * Get the tour playlist.
 * @return {!Array<!plugin.file.kml.tour.AbstractTourPrimitive>}
 */
plugin.file.kml.tour.Tour.prototype.getPlaylist = function() {
  return this.playlist_;
};


/**
 * Set the tour playlist.
 * @param {!Array<!plugin.file.kml.tour.AbstractTourPrimitive>} value The tour playlist.
 */
plugin.file.kml.tour.Tour.prototype.setPlaylist = function(value) {
  this.playlist_ = value;
  this.reset();
};


/**
 * Add a tour primitive to the playlist.
 * @param {!plugin.file.kml.tour.AbstractTourPrimitive} value The tour playlist.
 */
plugin.file.kml.tour.Tour.prototype.addToPlaylist = function(value) {
  this.playlist_.push(value);
  this.reset();
};


/**
 * Set if the tour is playing.
 * @param {boolean} value If the tour is playing.
 */
plugin.file.kml.tour.Tour.prototype.setPlaying = function(value) {
  if (this['playing'] !== value) {
    this['playing'] = value;
    this.dispatchEvent(plugin.file.kml.tour.EventType.PLAYING);
  }
};


/**
 * Play the tour.
 */
plugin.file.kml.tour.Tour.prototype.play = function() {
  if (this['playing']) {
    // if the tour is started while it is playing, reset it to the beginning
    this.reset();

    // wait until the stack clears (so the active promise can be cancelled), then play the tour
    goog.async.nextTick(this.play, this);
  } else {
    this.setPlaying(true);

    // execute any asynchronous tour primitives
    for (var i = 0; i < this.playlistIndex_; i++) {
      var item = this.playlist_[i];
      if (item && item.isAsync) {
        item.execute();
      }
    }

    // execute the next primitive
    this.playNext_();
  }
};


/**
 * Pause the tour.
 */
plugin.file.kml.tour.Tour.prototype.pause = function() {
  this.setPlaying(false);

  if (this.currentPromise_) {
    this.currentPromise_.cancel();
    this.currentPromise_ = undefined;
  }

  this.playlist_.forEach(function(p) {
    p.pause();
  });
};


/**
 * Reset the tour.
 */
plugin.file.kml.tour.Tour.prototype.reset = function() {
  // reset the tour to start from the beginning
  this.playlistIndex_ = 0;
  this.setPlaying(false);

  if (this.currentPromise_) {
    this.currentPromise_.cancel();
    this.currentPromise_ = undefined;
  }

  this.playlist_.forEach(function(p) {
    p.reset();
  });
};


/**
 * Play the next primitive in the tour.
 * @private
 */
plugin.file.kml.tour.Tour.prototype.playNext_ = function() {
  if (this['playing']) {
    var current = this.playlist_[this.playlistIndex_];
    if (current) {
      // execute the next playlist item
      this.currentPromise_ = current.execute().then(this.onExecuteResolved_, this.onExecuteRejected_, this);
    } else {
      // should have been a playlist item, so reset the tour
      this.reset();
    }
  }
};


/**
 * Handle successful resolution of a playlist item.
 */
plugin.file.kml.tour.Tour.prototype.onExecuteResolved_ = function() {
  this.currentPromise_ = undefined;
  this.playlistIndex_++;

  if (this.playlistIndex_ > this.playlist_.length) {
    if (this['repeat']) {
      // start from the beginning if repeat is enabled
      this.playlistIndex_ = 0;
    } else {
      // otherwise reset the tour to the beginning
      this.reset();
    }
  }

  // let the stack clear before running the next item in the tour
  goog.async.nextTick(this.playNext_, this);
};


/**
 * Handle rejection of a playlist item.
 * @param {*} opt_reason The rejection reason.
 */
plugin.file.kml.tour.Tour.prototype.onExecuteRejected_ = function(opt_reason) {
  // if a promise is rejected while playing, reset the tour
  if (this['playing']) {
    this.reset();
  }
};

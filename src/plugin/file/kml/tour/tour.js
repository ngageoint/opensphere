goog.declareModuleId('plugin.file.kml.tour.Tour');

import EventType from './eventtype.js';

const nextTick = goog.require('goog.async.nextTick');
const EventTarget = goog.require('goog.events.EventTarget');


/**
 * Represents a KML tour, from a `gx:Tour` (KML 2.2) or `Tour` (KML 2.3) element.
 * @unrestricted
 */
export default class Tour extends EventTarget {
  /**
   * Constructor.
   * @param {string=} opt_name The name of the tour.
   * @param {string=} opt_description The tour description.
   * @param {Array<!AbstractTourPrimitive>=} opt_playlist The tour playlist.
   */
  constructor(opt_name, opt_description, opt_playlist) {
    super();

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
     * @type {!Array<!AbstractTourPrimitive>}
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
     * @type {Promise|undefined}
     * @private
     */
    this.currentPromise_ = undefined;
  }

  /**
   * Get the tour playlist.
   *
   * @return {!Array<!AbstractTourPrimitive>}
   */
  getPlaylist() {
    return this.playlist_;
  }

  /**
   * Set the tour playlist.
   *
   * @param {!Array<!AbstractTourPrimitive>} value The tour playlist.
   */
  setPlaylist(value) {
    this.playlist_ = value;
    this.reset();
  }

  /**
   * Add a tour primitive to the playlist.
   *
   * @param {!AbstractTourPrimitive} value The tour playlist.
   */
  addToPlaylist(value) {
    this.playlist_.push(value);
    this.reset();
  }

  /**
   * Set if the tour is playing.
   *
   * @param {boolean} value If the tour is playing.
   */
  setPlaying(value) {
    if (this['playing'] !== value) {
      this['playing'] = value;
      this.dispatchEvent(EventType.PLAYING);
    }
  }

  /**
   * Play the tour.
   */
  play() {
    if (this['playing']) {
      // if the tour is started while it is playing, reset it to the beginning
      this.reset();

      // wait until the stack clears (so the active promise can be cancelled), then play the tour
      nextTick(this.play, this);
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
  }

  /**
   * Pause the tour.
   */
  pause() {
    this.setPlaying(false);

    if (this.currentPromise_) {
      this.currentPromise_.cancel();
      this.currentPromise_ = undefined;
    }

    this.playlist_.forEach(function(p) {
      p.pause();
    });
  }

  /**
   * Reset the tour.
   */
  reset() {
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
  }

  /**
   * Play the next primitive in the tour.
   *
   * @private
   */
  playNext_() {
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
  }

  /**
   * Handle successful resolution of a playlist item.
   */
  onExecuteResolved_() {
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
    nextTick(this.playNext_, this);
  }

  /**
   * Handle rejection of a playlist item.
   *
   * @param {*} opt_reason The rejection reason.
   */
  onExecuteRejected_(opt_reason) {
    // if a promise is rejected while playing, reset the tour
    if (this['playing']) {
      this.reset();
    }
  }
}

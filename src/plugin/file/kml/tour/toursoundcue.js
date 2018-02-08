goog.provide('plugin.file.kml.tour.SoundCue');

goog.require('goog.Promise');
goog.require('goog.async.nextTick');
goog.require('plugin.file.kml.tour.AbstractTourPrimitive');


/**
 * Plays an audio file during the tour.
 * @param {string} href The URL to the audio file.
 * @param {number=} opt_delayedStart Delay before playing the file.
 * @extends {plugin.file.kml.tour.AbstractTourPrimitive}
 * @constructor
 */
plugin.file.kml.tour.SoundCue = function(href, opt_delayedStart) {
  plugin.file.kml.tour.SoundCue.base(this, 'constructor');
  this.isAsync = true;

  /**
   * The audio element.
   * @type {HTMLAudioElement|undefined}
   * @private
   */
  this.audio_ = undefined;

  /**
   * URL for the audio file.
   * @type {string}
   * @private
   */
  this.href_ = href;

  /**
   * Delay before playing the audio file.
   * @type {number}
   * @private
   */
  this.delayedStart_ = Math.max(opt_delayedStart || 0, 0);

  /**
   * Remaining duration on the wait.
   * @type {number|undefined}
   * @private
   */
  this.remaining_ = undefined;

  /**
   * The last time the wait was started.
   * @type {number}
   * @private
   */
  this.start_ = 0;

  /**
   * The active timeout id.
   * @type {number|undefined}
   * @private
   */
  this.timeoutId_ = undefined;
};
goog.inherits(plugin.file.kml.tour.SoundCue, plugin.file.kml.tour.AbstractTourPrimitive);


/**
 * @inheritDoc
 */
plugin.file.kml.tour.SoundCue.prototype.execute = function() {
  var interval = this.getInterval();
  if (!this.audio_ && interval > 0) {
    this.timeoutId_ = setTimeout(this.playAudio_.bind(this), interval);
    this.start_ = Date.now();
  } else {
    this.playAudio_();
  }

  return goog.Promise.resolve();
};


/**
 * Play the audio file.
 * @private
 */
plugin.file.kml.tour.SoundCue.prototype.playAudio_ = function() {
  // cancel the timeout if one is pending
  if (this.timeoutId_ !== undefined) {
    clearTimeout(this.timeoutId_);
    this.timeoutId_ = undefined;
  }

  if (!this.audio_) {
    this.audio_ = /** @type {!HTMLAudioElement} */ (document.createElement('audio'));
    this.audio_.src = this.href_;
  }

  this.audio_.play();
};


/**
 * @inheritDoc
 */
plugin.file.kml.tour.SoundCue.prototype.pause = function() {
  if (this.timeoutId_ !== undefined) {
    // cancel the timeout
    clearTimeout(this.timeoutId_);
    this.timeoutId_ = undefined;

    // save how much time is remaining to wait for the next execute call
    var elapsed = Date.now() - this.start_;
    var interval = this.getInterval();
    this.remaining_ = Math.max(interval - elapsed, 0);
  } else if (this.audio_) {
    this.audio_.pause();
  }
};


/**
 * @inheritDoc
 */
plugin.file.kml.tour.SoundCue.prototype.reset = function() {
  this.pause();

  // reset the wait status
  this.remaining_ = undefined;
  this.start_ = 0;

  // drop audio reference
  this.audio_ = undefined;
};


/**
 * Get the remaining time on the wait operation.
 * @return {number} The remaining wait interval, in milliseconds.
 * @protected
 */
plugin.file.kml.tour.SoundCue.prototype.getInterval = function() {
  return this.remaining_ !== undefined ? this.remaining_ : this.delayedStart_;
};

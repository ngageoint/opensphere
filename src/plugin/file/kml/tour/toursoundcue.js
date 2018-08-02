goog.provide('plugin.file.kml.tour.SoundCue');

goog.require('goog.Promise');
goog.require('os.audio.AudioManager');
goog.require('os.audio.AudioSetting');
goog.require('plugin.file.kml.tour.Wait');


/**
 * Plays an audio file during the tour.
 * @param {string} href The URL to the audio file.
 * @param {number=} opt_delayedStart Delay before playing the file.
 * @extends {plugin.file.kml.tour.Wait}
 * @constructor
 */
plugin.file.kml.tour.SoundCue = function(href, opt_delayedStart) {
  plugin.file.kml.tour.SoundCue.base(this, 'constructor', opt_delayedStart || 0);
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
};
goog.inherits(plugin.file.kml.tour.SoundCue, plugin.file.kml.tour.Wait);


/**
 * @inheritDoc
 */
plugin.file.kml.tour.SoundCue.prototype.executeWait = function(opt_resolve, opt_reject) {
  if (this.audio_) {
    // audio was already created, so resume playback
    this.playAudio_();
  } else {
    // audio not created yet, wait for the delayed start
    plugin.file.kml.tour.SoundCue.base(this, 'executeWait', opt_resolve, opt_reject); // .then(goog.nullFunction, goog.nullFunction);
  }
};


/**
 * @inheritDoc
 */
plugin.file.kml.tour.SoundCue.prototype.onWaitComplete = function(opt_resolve, opt_reject) {
  plugin.file.kml.tour.SoundCue.base(this, 'onWaitComplete', opt_resolve, opt_reject);

  // delayed start is complete, start audio playback
  this.playAudio_();
};


/**
 * Play the audio file.
 * @private
 */
plugin.file.kml.tour.SoundCue.prototype.playAudio_ = function() {
  if (!this.audio_) {
    this.audio_ = /** @type {!HTMLAudioElement} */ (document.createElement('audio'));
    this.audio_.src = this.href_;

    // respect the global volume mute setting
    this.updateMute_();
    os.settings.listen(os.audio.AudioSetting.MUTE, this.updateMute_, false, this);
  }

  this.audio_.play();
};


/**
 * Handle changes to the global mute setting.
 * @private
 */
plugin.file.kml.tour.SoundCue.prototype.updateMute_ = function() {
  if (this.audio_) {
    var am = os.audio.AudioManager.getInstance();
    this.audio_.muted = am.getMute();
  }
};


/**
 * @inheritDoc
 */
plugin.file.kml.tour.SoundCue.prototype.pause = function() {
  plugin.file.kml.tour.SoundCue.base(this, 'pause');

  // pause the audio clip, but keep it around in case the tour starts again
  if (this.audio_) {
    this.audio_.pause();
  }
};


/**
 * @inheritDoc
 */
plugin.file.kml.tour.SoundCue.prototype.reset = function() {
  plugin.file.kml.tour.SoundCue.base(this, 'reset');

  // stop playback and drop the audio reference
  if (this.audio_) {
    os.settings.unlisten(os.audio.AudioSetting.MUTE, this.updateMute_, false, this);

    this.audio_.pause();
    this.audio_ = undefined;
  }
};

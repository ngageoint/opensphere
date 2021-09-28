goog.declareModuleId('plugin.file.kml.tour.SoundCue');

import AudioManager from '../../../../os/audio/audiomanager.js';
import AudioSetting from '../../../../os/audio/audiosetting.js';
import Settings from '../../../../os/config/settings.js';
import Wait from './tourwait.js';

/**
 * Plays an audio file during the tour.
 */
export default class SoundCue extends Wait {
  /**
   * Constructor.
   * @param {string} href The URL to the audio file.
   * @param {number=} opt_delayedStart Delay before playing the file.
   */
  constructor(href, opt_delayedStart) {
    super(opt_delayedStart || 0);
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
  }

  /**
   * @inheritDoc
   */
  executeWait(opt_resolve, opt_reject) {
    if (this.audio_) {
      // audio was already created, so resume playback
      this.playAudio_();
    } else {
      // audio not created yet, wait for the delayed start
      super.executeWait(opt_resolve, opt_reject); // .then(os.fn.noop, os.fn.noop);
    }
  }

  /**
   * @inheritDoc
   */
  onWaitComplete(opt_resolve, opt_reject) {
    super.onWaitComplete(opt_resolve, opt_reject);

    // delayed start is complete, start audio playback
    this.playAudio_();
  }

  /**
   * Play the audio file.
   *
   * @private
   */
  playAudio_() {
    if (!this.audio_) {
      this.audio_ = /** @type {!HTMLAudioElement} */ (document.createElement('audio'));
      this.audio_.src = this.href_;

      // respect the global volume mute setting
      this.updateMute_();
      Settings.getInstance().listen(AudioSetting.MUTE, this.updateMute_, false, this);
    }

    this.audio_.play();
  }

  /**
   * Handle changes to the global mute setting.
   *
   * @private
   */
  updateMute_() {
    if (this.audio_) {
      var am = AudioManager.getInstance();
      this.audio_.muted = am.getMute();
    }
  }

  /**
   * @inheritDoc
   */
  pause() {
    super.pause();

    // pause the audio clip, but keep it around in case the tour starts again
    if (this.audio_) {
      this.audio_.pause();
    }
  }

  /**
   * @inheritDoc
   */
  reset() {
    super.reset();

    // stop playback and drop the audio reference
    if (this.audio_) {
      Settings.getInstance().unlisten(AudioSetting.MUTE, this.updateMute_, false, this);

      this.audio_.pause();
      this.audio_ = undefined;
    }
  }
}

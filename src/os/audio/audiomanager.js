goog.provide('os.audio.AudioManager');
goog.provide('os.audio.AudioSetting');

goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('goog.object');
goog.require('os.config.Settings');
goog.require('os.defines');


/**
 * Audio settings keys.
 * @enum {string}
 */
os.audio.AudioSetting = {
  MUTE: 'mute'
};



/**
 * Manages audio sound effects for applications
 * @constructor
 */
os.audio.AudioManager = function() {
  /**
   * Whether or not we are muted
   * @type {boolean}
   * @private
   */
  this.mute_ = /** @type {boolean} */ (os.settings.get(os.audio.AudioSetting.MUTE, false));

  /**
   * Set of sounds
   * @type {Object<string, string>}
   * @private
   */
  this.sounds_ = {'None': null};

  /**
   * Cache of audio objects
   * @type {Object<string, HTMLAudioElement>}
   * @private
   */
  this.cache_ = {};

  /**
   * Last played time
   * @type {Object<string, number>}
   * @private
   */
  this.lastPlayed_ = {};

  /**
   * The default sound played when a sound can not be found
   * @type {?string}
   * @private
   */
  this.default_ = null;

  this.load();
};
goog.addSingletonGetter(os.audio.AudioManager);


/**
 * @type {goog.log.Logger}
 * @const
 * @private
 */
os.audio.AudioManager.LOGGER_ = goog.log.getLogger('os.audio.AudioManager');


/**
 * Gets the mute value
 * @return {boolean} mute
 */
os.audio.AudioManager.prototype.getMute = function() {
  return this.mute_;
};


/**
 * Sets the mute value
 * @param {boolean} mute
 */
os.audio.AudioManager.prototype.setMute = function(mute) {
  this.mute_ = mute;
  os.settings.set(os.audio.AudioSetting.MUTE, this.mute_);
};


/**
 * Gets the sounds list
 * @return {!Array<!string>} The list of sounds that can be played
 */
os.audio.AudioManager.prototype.getSounds = function() {
  return goog.object.getKeys(this.sounds_);
};


/**
 * Loads sounds from settings
 * @protected
 */
os.audio.AudioManager.prototype.load = function() {
  if (window.HTMLAudioElement) {
    var sets = ['sounds', 'userSounds'];

    for (var s = 0, ss = sets.length; s < ss; s++) {
      var set = /** @type {Object} */ (os.settings.get([sets[s]]));

      for (var label in set) {
        var url = /** @type {string} */ (set[label]);

        if (url.indexOf('sounds/') === 0) {
          url = os.ROOT + url;
        }

        if (label.toLowerCase() == 'default') {
          this.default_ = label;
        }

        this.sounds_[label] = url;
      }
    }
  } else {
    goog.log.warning(os.audio.AudioManager.LOGGER_, 'This browser does not support audio');
  }
};


/**
 * Plays a given sound by label
 * @param {string} label The sound to play
 * @param {number=} opt_timeBetweenPlays An optional time which must ellapse between the last play and another
 */
os.audio.AudioManager.prototype.play = function(label, opt_timeBetweenPlays) {
  if (!(label in this.sounds_)) {
    if (this.default_) {
      goog.log.fine(os.audio.AudioManager.LOGGER_,
          'Could not find sound "' + label + '" in sound list, using the default instead.');
      label = this.default_;
    } else {
      goog.log.error(os.audio.AudioManager.LOGGER_,
          'Could not find "' + label + '" in sound list and no default sound was defined.');
      return;
    }
  }

  var url = this.sounds_[label];
  var audio = null;

  if (url) {
    if (url in this.cache_) {
      audio = this.cache_[url];
    } else {
      audio = /** @type {HTMLAudioElement} */ (document.createElement('audio'));
      audio.src = url;
      this.cache_[url] = audio;
    }

    var lastPlayed = this.lastPlayed_[url] || 0;
    var now = goog.now();

    if (!this.mute_ && (!goog.isDef(opt_timeBetweenPlays) || now - lastPlayed > opt_timeBetweenPlays)) {
      goog.log.fine(os.audio.AudioManager.LOGGER_, 'Playing "' + label + '" from ' + url);
      audio.play();
      this.lastPlayed_[url] = now;
    }
  }
};


/**
 * Adds a sound to the audio manager
 * @param {!string} url
 * @param {string=} opt_label
 * @return {!string} The label that was used to add the sound
 */
os.audio.AudioManager.prototype.addSound = function(url, opt_label) {
  if (!opt_label) {
    // If a label wasn't provided, use the file name minus the extension. If we can't find that
    // portion of the file name, then just use the whole URL as the label.
    var x = url.lastIndexOf('.');
    if (x < 0) {
      x = url.length;
    }

    opt_label = url.substring(url.lastIndexOf('/') + 1, x);
  }

  // add to sounds
  this.sounds_[opt_label] = url;

  // remove cache and last played time
  delete this.cache_[url];
  delete this.lastPlayed_[url];

  // add to user sounds
  var userSounds = os.settings.get(['userSounds'], {});
  userSounds[opt_label] = url;
  os.settings.set(['userSounds'], userSounds);

  goog.log.info(os.audio.AudioManager.LOGGER_, 'Added sound "' + opt_label + '" from ' + url);
  return opt_label;
};

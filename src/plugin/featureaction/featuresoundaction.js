goog.provide('plugin.im.action.feature.SoundAction');
goog.require('os.feature');
goog.require('os.im.action.AbstractImportAction');
goog.require('os.implements');
goog.require('os.object');
goog.require('os.xml');

/**
 * Tag names used for XML persistence.
 * @enum {string}
 */
plugin.im.action.feature.SoundActionTagName = {
  SOUND: 'sound',
  DELAY: 'playDelay'
};

/**
 * Import action that sets the sound for a {@link ol.Feature}.
 * @extends {os.im.action.AbstractImportAction<ol.Feature>}
 * @constructor
 */
plugin.im.action.feature.SoundAction = function() {
  plugin.im.action.feature.SoundAction.base(this, 'constructor');

  this.id = plugin.im.action.feature.SoundAction.ID;
  this.label = plugin.im.action.feature.SoundAction.LABEL;
  this.xmlType = plugin.im.action.feature.SoundAction.ID;
  this.configUI = plugin.im.action.feature.SoundAction.CONFIG_UI;

  /**
   * The feature sound config.
   * @type {!Object}
   */
  this.soundConfig = /** @type {!Object} */ (os.object.unsafeClone(
      plugin.im.action.feature.SoundAction.DEFAULT_CONFIG));

  /**
   * User defined time between sound notifications in seconds.
   * @type {number}
   */
  this.delay = this.soundConfig['playDelay'] * 1000;
};
goog.inherits(plugin.im.action.feature.SoundAction,
    os.im.action.AbstractImportAction);

/**
 * Action identifier.
 * @type {string}
 * @const
 */
plugin.im.action.feature.SoundAction.ID = 'featureSoundAction';

/**
 * Property set on features to indicate they're using a feature sound action.
 * @type {string}
 * @const
 */
plugin.im.action.feature.SoundAction.FEATURE_ID = '_featureSoundAction';

/**
 * Action Label.
 * @type {string}
 * @const
 */
plugin.im.action.feature.SoundAction.LABEL = 'Set Sound';

/**
 * Action edit UI.
 * @type {string}
 * @const
 */
plugin.im.action.feature.SoundAction.CONFIG_UI = 'featureactionsoundconfig';

/**
 * The default sound configuration.
 * @type {!Object}
 * @const
 */
plugin.im.action.feature.SoundAction.DEFAULT_CONFIG = {
  'sound': 'Default',
  'playDelay': 30
};

/**
 * @inheritDoc
 */
plugin.im.action.feature.SoundAction.prototype.execute = function() {
  os.audio.AudioManager.getInstance().play(this.soundConfig['sound'], this.delay);
};

/**
 * @inheritDoc
 */
plugin.im.action.feature.SoundAction.prototype.persist = function(opt_to) {
  opt_to = plugin.im.action.feature.SoundAction.base(this, 'persist', opt_to);
  opt_to['soundConfig'] = this.soundConfig;

  return opt_to;
};

/**
 * @inheritDoc
 */
plugin.im.action.feature.SoundAction.prototype.restore = function(config) {
  var soundConfig = /** @type {Object|undefined} */ (config['soundConfig']);
  if (soundConfig) {
    // create a new object in the same window context as this object
    this.soundConfig = {};
    os.object.merge(soundConfig, this.soundConfig);
  }
};

/**
 * @inheritDoc
 */
plugin.im.action.feature.SoundAction.prototype.toXml = function() {
  var element = plugin.im.action.feature.SoundAction.base(this, 'toXml');

  var sound = (this.soundConfig['sound']);
  var delay = (this.soundConfig['playDelay']);
  if (sound != null) {
    os.xml.appendElement(plugin.im.action.feature.SoundActionTagName.SOUND,
        element, String(sound));
  }

  if (delay != null) {
    os.xml.appendElement(plugin.im.action.feature.SoundActionTagName.DELAY,
        element, String(delay));
  }

  return element;
};

/**
 * @inheritDoc
 */
plugin.im.action.feature.SoundAction.prototype.fromXml = function(xml) {
  var soundConfig = /** @type {!Object} */ (os.object.unsafeClone(
      plugin.im.action.feature.SoundAction.DEFAULT_CONFIG));

  if (xml) {
    var sound = os.xml.getChildValue(xml,
        plugin.im.action.feature.SoundActionTagName.SOUND);
    var delay = os.xml.getChildValue(xml,
        plugin.im.action.feature.SoundActionTagName.DELAY);

    soundConfig['sound'] = String(sound);
    soundConfig['playDelay'] = Number(delay);

    this.soundConfig = soundConfig;
  }
};

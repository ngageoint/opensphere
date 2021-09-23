goog.declareModuleId('plugin.im.action.feature.SoundAction');

const AudioManager = goog.require('os.audio.AudioManager');

const AbstractImportAction = goog.require('os.im.action.AbstractImportAction');
const osObject = goog.require('os.object');
const osXml = goog.require('os.xml');
const {directiveTag: configUi, setDefaultConfig} = goog.require('plugin.im.action.feature.ui.SoundConfigUI');


/**
 * Tag names used for XML persistence.
 * @enum {string}
 */
const SoundActionTagName = {
  SOUND: 'sound',
  DELAY: 'playDelay'
};


/**
 * The default sound
 * @type {string}
 */
const DEFAULT_SOUND = 'Default';


/**
 * Import action that sets the sound for a {@link ol.Feature}.
 *
 * @extends {AbstractImportAction<ol.Feature>}
 * @unrestricted
 */
export default class SoundAction extends AbstractImportAction {
  /**
   * Constructor.
   */
  constructor() {
    super();

    this.id = SoundAction.ID;
    this.label = SoundAction.LABEL;
    this.xmlType = SoundAction.ID;
    this.configUI = configUi;

    /**
     * The feature sound config.
     * @type {!Object}
     */
    this.soundConfig = /** @type {!Object} */ (osObject.unsafeClone(SoundAction.DEFAULT_CONFIG));

    this['sounds'] = AudioManager.getInstance().getSounds();

    /**
     * Set the default sound for the sound action.
     */
    var defaultSoundIndex = this['sounds'].indexOf(DEFAULT_SOUND);
    if (defaultSoundIndex > -1) {
      this.soundConfig['sound'] = this['sounds'][defaultSoundIndex];
    } else {
      this.soundConfig['sound'] = this['sounds'][0] || '';
    }
  }

  /**
   * @inheritDoc
   */
  execute() {
    AudioManager.getInstance().play(this.soundConfig['sound'], this.soundConfig['playDelay'] * 1000);
  }

  /**
   * @inheritDoc
   */
  persist(opt_to) {
    opt_to = super.persist(opt_to);
    opt_to['soundConfig'] = this.soundConfig;

    return opt_to;
  }

  /**
   * @inheritDoc
   */
  restore(config) {
    var soundConfig = /** @type {Object|undefined} */ (config['soundConfig']);
    if (soundConfig) {
      // create a new object in the same window context as this object
      this.soundConfig = {};
      osObject.merge(soundConfig, this.soundConfig);
    }
  }

  /**
   * @inheritDoc
   */
  toXml() {
    var element = super.toXml();

    var sound = (this.soundConfig['sound']);
    var delay = (this.soundConfig['playDelay']);
    if (sound != null) {
      osXml.appendElement(SoundActionTagName.SOUND,
          element, String(sound));
    }

    if (delay != null) {
      osXml.appendElement(SoundActionTagName.DELAY,
          element, String(delay));
    }

    return element;
  }

  /**
   * @inheritDoc
   */
  fromXml(xml) {
    var soundConfig = /** @type {!Object} */ (osObject.unsafeClone(
        SoundAction.DEFAULT_CONFIG));

    if (xml) {
      var sound = osXml.getChildValue(xml, SoundActionTagName.SOUND);
      var delay = osXml.getChildValue(xml, SoundActionTagName.DELAY);

      soundConfig['sound'] = String(sound);
      soundConfig['playDelay'] = Number(delay);

      this.soundConfig = soundConfig;
    }
  }

  /**
   * @inheritDoc
   */
  reset() {}
}


/**
 * Action identifier.
 * @type {string}
 * @const
 */
SoundAction.ID = 'featureSoundAction';


/**
 * Property set on features to indicate they're using a feature sound action.
 * @type {string}
 * @const
 */
SoundAction.FEATURE_ID = '_featureSoundAction';


/**
 * Action Label.
 * @type {string}
 * @const
 */
SoundAction.LABEL = 'Set Sound';


/**
 * The default sound configuration.
 * @type {!Object}
 * @const
 */
SoundAction.DEFAULT_CONFIG = {
  'sound': '',
  'playDelay': 30
};
setDefaultConfig(SoundAction.DEFAULT_CONFIG);

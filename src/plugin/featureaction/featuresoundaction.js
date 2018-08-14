goog.provide('plugin.im.action.feature.SoundAction');

goog.require('goog.math');
goog.require('os.color');
goog.require('os.feature');
goog.require('os.im.action.AbstractImportAction');
goog.require('os.implements');
goog.require('os.legend');
goog.require('os.legend.ILegendRenderer');
goog.require('os.object');
goog.require('os.style');
goog.require('os.xml');

/**
 * Tag names used for XML persistence.
 * @enum {string}
 */
plugin.im.action.feature.SoundActionTagName = {
  SOUND: 'sound'
};

/**
 * Import action that sets the sound for a {@link ol.Feature}.
 * @extends {os.im.action.AbstractImportAction<ol.Feature>}
 * @implements {os.legend.ILegendRenderer}
 * @constructor
 */
plugin.im.action.feature.SoundAction = function() {
  plugin.im.action.feature.SoundAction.base(this, 'constructor');

  this.id = plugin.im.action.feature.SoundAction.ID;
  this.label = plugin.im.action.feature.SoundAction.LABEL;
  this.xmlType = plugin.im.action.feature.SoundAction.ID;
  this.configUI = plugin.im.action.feature.SoundAction.CONFIG_UI;


  /**
   * Unique identifier for this action.
   * @type {number}
   * @protected
   */
  this.uid = goog.getUid(this);

  /**
   * The feature sound config.
   * @type {!Object}
   */
  this.soundConfig = /** @type {!Object} */ (os.object.unsafeClone(
      plugin.im.action.feature.SoundAction.DEFAULT_CONFIG));
};
goog.inherits(plugin.im.action.feature.SoundAction,
    os.im.action.AbstractImportAction);

os.implements(plugin.im.action.feature.SoundAction,
    os.legend.ILegendRenderer.ID);

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
  'sound': 'Default'

};

/**
 * @inheritDoc
 */
plugin.im.action.feature.SoundAction.prototype.execute = function(items) {
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    if (item) {
      var featureConfig = /** @type {Array|Object|undefined} */ (item.get(
          os.style.StyleType.FEATURE)) || {};
      if (goog.isArray(featureConfig)) {
        for (var j = 0; j < featureConfig.length; j++) {
          os.style.mergeConfig(this.soundConfig, featureConfig[j]);
        }
      } else {
        os.style.mergeConfig(this.soundConfig, featureConfig);
      }

      item.set(os.style.StyleType.FEATURE, featureConfig, true);
      item.set(plugin.im.action.feature.SoundAction.FEATURE_ID, this.uid, true);

      var configSound = this.soundConfig['sound'];
      if (configSound) {
        item.set('sound', configSound, true);
      }
    }
  }

  os.audio.AudioManager.getInstance().play(this.soundConfig['sound']);

  os.style.setFeaturesStyle(items);

  var layer = os.feature.getLayer(items[0]);

  if (layer) {
    os.style.notifyStyleChange(layer, items);
  }
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
  if (sound != null) {
    os.xml.appendElement(plugin.im.action.feature.SoundActionTagName.SOUND,
        element, String(sound));
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

    soundConfig['sound'] = String(sound);

    this.soundConfig = soundConfig;
  }
};

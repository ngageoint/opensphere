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
  CENTER_SHAPE: 'centerShape',
  COLOR: 'color',
  ICON_SRC: 'iconSrc',
  ROTATION_COLUMN: 'rotationColumn',
  SHOW_ROTATION: 'showRotation',
  SHAPE: 'shape',
  SIZE: 'size'
};

/**
 * Import action that sets the style for a {@link ol.Feature}.
 * @extends {os.im.action.AbstractImportAction<ol.Feature>}
 * @implements {os.legend.ILegendRenderer}
 * @constructor
 */
plugin.im.action.feature.SoundAction = function() {
  plugin.im.action.feature.SoundAction.base(this, 'constructor');

  this.id = plugin.im.action.feature.SoundAction.ID;
  this.label = plugin.im.action.feature.SoundAction.LABEL;
  this.configUI = plugin.im.action.feature.SoundAction.CONFIG_UI;
  this.xmlType = plugin.im.action.feature.SoundAction.ID;

  /**
   * Unique identifier for this action.
   * @type {number}
   * @protected
   */
  this.uid = goog.getUid(this);

  /**
   * The feature style config.
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
 * Property set on features to indicate they're using a feature style action.
 * @type {string}
 * @const
 */
plugin.im.action.feature.SoundAction.FEATURE_ID = '_featureSoundAction';

/**
 * Action label.
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
 * The default label configuration.
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
  console.log('execute me');
};

/**
 * @inheritDoc
 */
plugin.im.action.feature.SoundAction.prototype.persist = function(opt_to) {

};

/**
 * @inheritDoc
 */
plugin.im.action.feature.SoundAction.prototype.restore = function(config) {

};

/**
 * @inheritDoc
 */
plugin.im.action.feature.SoundAction.prototype.toXml = function() {

};

/**
 * @inheritDoc
 */
plugin.im.action.feature.SoundAction.prototype.fromXml = function(xml) {
};

/**
 * @inheritDoc
 */
plugin.im.action.feature.SoundAction.prototype.renderLegend = function(
    options, var_args) {

};

/**
 * If a feature is styled by the action.
 * @param {!ol.Feature} feature The feature.
 * @return {boolean} If the feature is using this style action.
 * @this plugin.im.action.feature.SoundAction
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
plugin.im.action.feature.SoundAction.isFeatureStyled = function(feature) {
  return feature.values_[plugin.im.action.feature.SoundAction.FEATURE_ID] ===
      this.uid;
};

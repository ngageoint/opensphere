goog.module('os.layer.preset');
goog.module.declareLegacyNamespace();

const object = goog.require('goog.object');
const style = goog.require('os.style');
const OsLayer = goog.require('os.layer');
const Settings = goog.require('os.config.Settings');

const FilterActionEntry = goog.requireType('os.im.action.FilterActionEntry');


/**
 * Base settings key for layer presets.
 * @type {string}
 */
const BASE_KEY = 'os.layerPreset.';

/**
 * ID for the default preset.
 * @type {string}
 */
const DEFAULT_PRESET_ID = '__default__';

/**
 * The default preset.
 * @type {osx.layer.Preset|undefined}
 */
let defaultPreset_ = undefined;

/**
 * @enum {string}
 */
const PresetServiceAction = {
  INSERT: 'insert',
  UPDATE: 'update',
  FIND: 'find',
  REMOVE: 'remove',
  SET_DEFAULT: 'setDefault',
  SET_PUBLISHED: 'setPublished'
};

/**
 * Settings keys for layer presets.
 * @enum {string}
 */
const SettingKey = {
  APPLIED_DEFAULTS: BASE_KEY + 'appliedDefaults',
  PRESETS: BASE_KEY + 'presets',
  SAVED_PRESET_IDS: BASE_KEY + 'saved.presetIds',
  SAVED_PRESET_CLEANS: BASE_KEY + 'saved.presetCleans'
};

/**
 * Add the default preset to an existing set.
 * @param {Array<osx.layer.Preset>} presets The current layer presets.
 * @param {string=} opt_layerId
 * @param {string=} opt_layerFilterKey
 */
const addDefault = function(presets, opt_layerId, opt_layerFilterKey) {
  if (presets) {
    if (!defaultPreset_) {
      // create a temporary vector layer to produce a default layer config
      var layer = OsLayer.createFromOptions({
        'id': DEFAULT_PRESET_ID,
        'type': os.layer.config.StaticLayerConfig.ID, // HACK: TODO resolve circular dependency
        'animate': true,
        'visible': true
      });

      if (layer) {
        defaultPreset_ = {
          id: DEFAULT_PRESET_ID,
          label: 'Basic',
          layerConfig: layer.persist(),
          default: false,
          published: true
        };
        defaultPreset_.layerConfig['fillOpacity'] = 0;

        goog.dispose(layer);
      }
    }

    var hasDefault = presets.some(function(p) {
      return !!p && p.id === DEFAULT_PRESET_ID;
    });

    if (!hasDefault && defaultPreset_) {
      var preset = object.unsafeClone(defaultPreset_);
      preset.default = !presets.some(function(p) {
        return !!p && p.default === true;
      }); // if nothing else is the default, flag "Basic" as default

      if (opt_layerId) preset.layerId = opt_layerId;
      if (opt_layerFilterKey) preset.layerFilterKey = opt_layerFilterKey;
      presets.unshift(preset); // drop it into the first entry
    }
  }
};

/**
 * Get the selected Preset ID from saved Settings for the desired Layer
 *
 * @param {string} id The layer ID
 * @return {!boolean}
 */
const getSavedPresetClean = function(id) {
  var lookup = /** @type {!Object<string, boolean>} */
      (Settings.getInstance().get(SettingKey.SAVED_PRESET_CLEANS, {}));
  return (lookup[id] === false) ? false : true;
};

/**
 * Get the selected Preset ID from saved Settings for the desired Layer
 *
 * @param {string} id The layer ID
 * @return {?string}
 */
const getSavedPresetId = function(id) {
  var lookup = /** @type {!Object<string, ?string>} */
      (Settings.getInstance().get(SettingKey.SAVED_PRESET_IDS, {}));
  return lookup[id];
};

/**
 * Get the selected Preset ID from saved Settings for the desired Layer
 *
 * @param {string} id The layer ID
 * @param {boolean} clean Is clean
 */
const setSavedPresetClean = function(id, clean) {
  var lookup = /** @type {!Object<string, boolean>} */
      (Settings.getInstance().get(SettingKey.SAVED_PRESET_CLEANS, {}));
  lookup[id] = clean;
  Settings.getInstance().set(SettingKey.SAVED_PRESET_CLEANS, lookup);
};

/**
 * Get the selected Preset ID from saved Settings for the desired Layer
 *
 * @param {string} id The layer ID
 * @param {?string=} opt_presetId
 */
const setSavedPresetId = function(id, opt_presetId) {
  var lookup = /** @type {!Object<string, ?string>} */
      (Settings.getInstance().get(SettingKey.SAVED_PRESET_IDS, {}));
  lookup[id] = opt_presetId || null;
  Settings.getInstance().set(SettingKey.SAVED_PRESET_IDS, lookup);
};

/**
 * Update the default preset for a layer.
 * @param {os.layer.ILayer} layer The layer.
 * @param {osx.layer.Preset} preset The default preset.
 */
const updateDefault = function(layer, preset) {
  if (layer && preset && preset.layerConfig) {
    var config = preset.layerConfig;
    var layerOptions = layer.getLayerOptions();
    if (layerOptions && layerOptions['baseColor']) {
      // update the default color
      var color = style.toRgbaString(/** @type {string} */ (layerOptions['baseColor']));
      config['color'] = color;
      config['fillColor'] = color;
    }
  }
};


exports = {
  BASE_KEY,
  DEFAULT_PRESET_ID,
  PresetServiceAction,
  SettingKey,
  addDefault,
  getSavedPresetClean,
  getSavedPresetId,
  setSavedPresetClean,
  setSavedPresetId,
  updateDefault
};

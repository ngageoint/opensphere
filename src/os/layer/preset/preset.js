goog.declareModuleId('os.layer.preset');

import {toRgbArray} from '../../color.js';
import Settings from '../../config/settings.js';
import {DEFAULT_FILL_ALPHA, toRgbaString} from '../../style/style.js';
import StyleField from '../../style/stylefield.js';
import {LayerConfigId} from '../config/layerconfig.js';
import {createFromOptions} from '../layer.js';

const {unsafeClone} = goog.require('goog.object');

const {default: FilterActionEntry} = goog.requireType('os.im.action.FilterActionEntry');
const {default: ILayer} = goog.requireType('os.layer.ILayer');


/**
 * Base settings key for layer presets.
 * @type {string}
 */
export const BASE_KEY = 'os.layerPreset.';

/**
 * ID for the default preset.
 * @type {string}
 */
export const DEFAULT_PRESET_ID = '__default__';

/**
 * The default preset.
 * @type {osx.layer.Preset|undefined}
 */
let defaultPreset_ = undefined;

/**
 * @enum {string}
 */
export const PresetServiceAction = {
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
export const SettingKey = {
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
export const addDefault = function(presets, opt_layerId, opt_layerFilterKey) {
  if (presets) {
    if (!defaultPreset_) {
      // create a temporary vector layer to produce a default layer config
      const layer = createFromOptions({
        'id': DEFAULT_PRESET_ID,
        'type': LayerConfigId.STATIC,
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

        goog.dispose(layer);
      }
    }

    const hasDefault = presets.some(function(p) {
      return !!p && p.id === DEFAULT_PRESET_ID;
    });

    if (!hasDefault && defaultPreset_) {
      const preset = unsafeClone(defaultPreset_);
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
export const getSavedPresetClean = function(id) {
  const lookup = /** @type {!Object<string, boolean>} */
      (Settings.getInstance().get(SettingKey.SAVED_PRESET_CLEANS, {}));
  return (lookup[id] === false) ? false : true;
};

/**
 * Get the selected Preset ID from saved Settings for the desired Layer
 *
 * @param {string} id The layer ID
 * @return {?string}
 */
export const getSavedPresetId = function(id) {
  const lookup = /** @type {!Object<string, ?string>} */
      (Settings.getInstance().get(SettingKey.SAVED_PRESET_IDS, {}));
  return lookup[id];
};

/**
 * Get the selected Preset ID from saved Settings for the desired Layer
 *
 * @param {string} id The layer ID
 * @param {boolean} clean Is clean
 */
export const setSavedPresetClean = function(id, clean) {
  const lookup = /** @type {!Object<string, boolean>} */
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
export const setSavedPresetId = function(id, opt_presetId) {
  const lookup = /** @type {!Object<string, ?string>} */
      (Settings.getInstance().get(SettingKey.SAVED_PRESET_IDS, {}));
  lookup[id] = opt_presetId || null;
  Settings.getInstance().set(SettingKey.SAVED_PRESET_IDS, lookup);
};

/**
 * Update the default preset for a layer.
 * @param {ILayer} layer The layer.
 * @param {osx.layer.Preset} preset The default preset.
 */
export const updateDefault = function(layer, preset) {
  if (layer && preset && preset.layerConfig) {
    const config = preset.layerConfig;
    const layerOptions = layer.getLayerOptions();
    if (layerOptions && layerOptions['baseColor']) {
      // update the default color
      const color = toRgbArray(/** @type {string} */ (layerOptions['baseColor']));
      config[StyleField.COLOR] = toRgbaString(color);

      color[3] = DEFAULT_FILL_ALPHA;
      config[StyleField.FILL_COLOR] = toRgbaString(color);
    }
  }
};

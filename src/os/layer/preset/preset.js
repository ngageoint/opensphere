goog.module('os.layer.preset');
goog.module.declareLegacyNamespace();

const object = goog.require('goog.object');
const style = goog.require('os.style');
const OsLayer = goog.require('os.layer');


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
  PRESETS: BASE_KEY + 'presets'
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
  updateDefault
};

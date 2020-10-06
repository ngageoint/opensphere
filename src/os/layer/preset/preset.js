goog.module('os.layer.preset');
goog.module.declareLegacyNamespace();

const object = goog.require('goog.object');
const style = goog.require('os.style');


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
 * Add the default preset to an existing set.
 * @param {Array<osx.layer.Preset>} presets The current layer presets.
 */
const addDefault = function(presets) {
  if (presets) {
    if (!defaultPreset_) {
      // create a temporary vector layer to produce a default layer config
      var layer = os.layer.createFromOptions({
        'id': DEFAULT_PRESET_ID,
        'type': os.layer.config.StaticLayerConfig.ID,
        'animate': true,
        'visible': true
      });

      if (layer) {
        defaultPreset_ = {
          id: DEFAULT_PRESET_ID,
          label: 'Default',
          layerConfig: layer.persist()
        };

        goog.dispose(layer);
      }
    }

    var hasDefault = presets.some(function(p) {
      return !!p && p.id === DEFAULT_PRESET_ID;
    });
    if (!hasDefault && defaultPreset_) {
      presets.unshift(object.unsafeClone(defaultPreset_));
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
  addDefault,
  updateDefault
};

goog.provide('os.layer.preset');
goog.provide('os.layer.preset.SettingKey');

goog.require('goog.object');
goog.require('os.style');



/**
 * Base settings key for layer presets.
 * @type {string}
 * @const
 */
os.layer.preset.BASE_KEY = 'layer.preset.';


/**
 * Settings keys for layer presets.
 * @enum {string}
 */
os.layer.preset.SettingKey = {
  PRESETS: os.layer.preset.BASE_KEY + 'presets'
};


/**
 * ID for the default preset.
 * @type {string}
 * @const
 */
os.layer.preset.DEFAULT_PRESET_ID = '__default__';


/**
 * The default preset.
 * @type {osx.layer.Preset|undefined}
 * @private
 */
os.layer.preset.defaultPreset_ = undefined;


/**
 * Add the default preset to an existing set.
 * @param {Array<osx.layer.Preset>} presets The current layer presets.
 */
os.layer.preset.addDefault = function(presets) {
  if (presets) {
    if (!os.layer.preset.defaultPreset_) {
      // create a temporary vector layer to produce a default layer config
      var layer = os.layer.createFromOptions({
        'id': os.layer.preset.DEFAULT_PRESET_ID,
        'type': os.layer.config.StaticLayerConfig.ID
      });

      if (layer) {
        os.layer.preset.defaultPreset_ = {
          id: os.layer.preset.DEFAULT_PRESET_ID,
          label: 'Default',
          layerConfig: layer.persist()
        };

        goog.dispose(layer);
      }
    }

    var hasDefault = presets.some(function(p) {
      return !!p && p.id === os.layer.preset.DEFAULT_PRESET_ID;
    });
    if (!hasDefault && os.layer.preset.defaultPreset_) {
      presets.unshift(goog.object.unsafeClone(os.layer.preset.defaultPreset_));
    }
  }
};


/**
 * Update the default preset for a layer.
 * @param {os.layer.ILayer} layer The layer.
 * @param {osx.layer.Preset} preset The default preset.
 */
os.layer.preset.updateDefault = function(layer, preset) {
  if (layer && preset && preset.layerConfig) {
    var config = preset.layerConfig;
    var layerOptions = layer.getLayerOptions();
    if (layerOptions) {
      // update the default color
      if (layerOptions['baseColor']) {
        var color = os.style.toRgbaString(/** @type {string} */ (layerOptions['baseColor']));
        config['color'] = color;
        config['fillColor'] = color;
      }

      config['animate'] = !!layerOptions['animate'];
    }
  }
};

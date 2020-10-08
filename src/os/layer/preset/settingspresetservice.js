goog.module('os.layer.preset.SettingsPresetService');

const Settings = goog.require('os.config.Settings');
const AbstractPresetService = goog.require('os.layer.preset.AbstractPresetService');
const SettingKey = goog.require('os.layer.preset.SettingKey');
const PresetServiceAction = goog.require('os.layer.preset.PresetServiceAction');
const ImportActionManager = goog.require('os.im.action.ImportActionManager');

/**
 * @extends {AbstractPresetService}
 */
class SettingsPresetService extends AbstractPresetService {
  /**
   * @inheritDoc
   */
  find(search) {
    var promise = new Promise((resolve) => {
      if (search &&
          search['layerId'] && search['layerId'].length &&
          search['layerFilterKey'] && search['layerFilterKey'].length) {
        const layerId = search['layerId'][0];
        const layerFilterKey = search['layerFilterKey'][0];
        const faPromise = ImportActionManager.getInstance().loadDefaults(layerId);

        // load feature actions first, then resolve the preset promise
        faPromise.thenAlways(function() {
          const configs = /** @type {!Object<Array<osx.layer.Preset>>} */
            (Settings.getInstance().get(SettingKey.PRESETS, {}));
          const layerPresets = configs[layerFilterKey] || [];

          resolve(layerPresets);
        }, this);
      } else {
        resolve(null);
      }
    });

    return promise;
  }

  /**
   * @inheritDoc
   */
  supports(action) {
    switch (action) {
      case PresetServiceAction.FIND:
        return true;
      default:
        return false;
    }
  }
}

exports = SettingsPresetService;

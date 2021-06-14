goog.module('os.layer.preset.SettingsPresetService');

const Settings = goog.require('os.config.Settings');
const AbstractPresetService = goog.require('os.layer.preset.AbstractPresetService');
const {PresetServiceAction, SettingKey} = goog.require('os.layer.preset');
const {getImportActionManager} = goog.require('os.im.action');


/**
 * @type {string}
 * @const
 */
const ID = 'os.layer.preset.SettingsPresetService';

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
        const fa = getImportActionManager().loadDefaults(layerId);
        const finish = function() {
          const configs = /** @type {!Object<Array<osx.layer.Preset>>} */
            (Settings.getInstance().get(SettingKey.PRESETS, {}));
          const layerPresets = configs[layerFilterKey] || [];
          layerPresets.forEach((preset) => {
            preset.published = true;
            preset.layerId = layerId;
            preset.layerFilterKey = layerFilterKey;
          });
          resolve(layerPresets);
        };

        if (fa) {
          fa.thenAlways(finish, this); // load feature actions first, then resolve the preset promise
        } else {
          finish();
        }
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

SettingsPresetService.ID = ID;


exports = SettingsPresetService;

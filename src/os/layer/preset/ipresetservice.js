goog.module('os.layer.preset.IPresetService');

const {PresetServiceAction} = goog.requireType('os.layer.preset');


/**
 * Interface for CRUD operations for Presets
 * @interface
 */
class IPresetService {
  /**
   * Saves a preset
   *
   * @param {!osx.layer.Preset} preset
   * @return {!Promise<osx.layer.Preset>}
   */
  insert(preset) {}

  /**
   * Modifies a preset
   *
   * @param {!osx.layer.Preset} preset
   * @return {!Promise<osx.layer.Preset>}
   */
  update(preset) {}

  /**
   * Deletes a preset
   *
   * @param {!osx.layer.Preset|string} preset
   * @return {!Promise<osx.layer.Preset>}
   */
  remove(preset) {}

  /**
   * Searches for preset(s)
   *
   * @param {osx.layer.PresetSearch} search
   * @return {!Promise<Array<osx.layer.Preset>>}
   */
  find(search) {}

  /**
   * Sets one preset to "isDefault" = opt_boolean (default true) and the others to false
   *
   * @param {osx.layer.Preset|string} preset
   * @param {boolean=} opt_boolean
   * @return {!Promise<osx.layer.Preset>}
   */
  setDefault(preset, opt_boolean) {}

  /**
   * Sets preset to "isPublished" = opt_boolean (default true)
   *
   * @param {osx.layer.Preset|string} preset
   * @param {boolean=} opt_boolean
   * @return {!Promise<osx.layer.Preset>}
   */
  setPublished(preset, opt_boolean) {}

  /**
   * Returns true
   * @param {!PresetServiceAction} action
   * @return {!boolean}
   */
  supports(action) {}
}


exports = IPresetService;

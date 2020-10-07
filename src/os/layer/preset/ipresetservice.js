goog.module('os.layer.preset.IPresetService');

/**
 * Interface for CRUD operations for Presets
 * @interface
 */
class IPresetService {
  /**
   * Saves a preset
   *
   * @param {osx.layer.Preset} preset
   * @return {Promise<osx.layer.Preset|null>}
   */
  insert(preset) {}

  /**
   * Modifies a preset
   *
   * @param {osx.layer.Preset} preset
   * @return {Promise<osx.layer.Preset|null>}
   */
  update(preset) {}

  /**
   * Deletes a preset
   *
   * @param {osx.layer.Preset|string} preset
   * @return {Promise<osx.layer.Preset|null>}
   */
  remove(preset) {}

  /**
   * Searches for preset(s)
   *
   * @param {osx.layer.PresetSearch} search
   * @return {Promise<Array<osx.layer.Preset>>}
   */
  find(search) {}

  /**
   * Sets one preset to "isDefault" = opt_boolean (default true) and the others to false
   *
   * @param {osx.layer.Preset|string} preset
   * @param {boolean=} opt_boolean
   * @return {Promise<osx.layer.Preset|null>}
   */
  setDefault(preset, opt_boolean) {}

  /**
   * Sets preset to "isPublished" = opt_boolean (default true)
   *
   * @param {osx.layer.Preset|string} preset
   * @param {boolean=} opt_boolean
   * @return {Promise<osx.layer.Preset|null>}
   */
  setPublished(preset, opt_boolean) {}
}

exports = IPresetService;

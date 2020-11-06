goog.require('os.layer.preset');
goog.require('os.layer.preset.SettingsPresetService');

describe('os.layer.preset.LayerPresetManager', function() {
  const LayerPresetManager = goog.module.get('os.layer.preset.LayerPresetManager');
  const SettingsPresetService = goog.module.get('os.layer.preset.SettingsPresetService');
  const lpm = LayerPresetManager.getInstance();

  it('should instantiate', function() {
    expect(lpm).not.toBe(null);
  });

  it('should contain the default SettingsPresetService', function() {
    const keys = lpm.services_.keys();
    expect(keys.length).toBe(1);
    expect(keys[0] == SettingsPresetService.ID);
  });
});

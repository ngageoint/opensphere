goog.require('os.layer.preset');
goog.require('os.layer.preset.SettingsPresetService');


describe('os.layer.preset.SettingsPresetService', function() {
  const {default: SettingsPresetService} = goog.module.get('os.layer.preset.SettingsPresetService');
  const {PresetServiceAction} = goog.module.get('os.layer.preset');

  it('should instantiate', function() {
    expect(new SettingsPresetService()).not.toBe(null);
  });

  it('only supports find', function() {
    const service = new SettingsPresetService();

    expect(service.supports(PresetServiceAction.FIND)).toBe(true);
    expect(service.supports(PresetServiceAction.INSERT)).toBe(false);
    expect(service.supports(PresetServiceAction.UPDATE)).toBe(false);
    expect(service.supports(PresetServiceAction.REMOVE)).toBe(false);
    expect(service.supports(PresetServiceAction.SET_DEFAULT)).toBe(false);
    expect(service.supports(PresetServiceAction.SET_PUBLISHED)).toBe(false);
  });

  it('attempts to load presets', function() {
    const service = new SettingsPresetService();

    let promise = null;
    let callback = 0;

    runs(function() {
      promise = service.find(/** @type {osx.layer.PresetSearch} */ ({}));

      promise.then((results) => {
        callback++;
      }, (err) => {
        callback--;
      }).then(() => {
        expect(promise).not.toBe(null);
        expect(callback).toBe(1);
      });

      waitsFor(() => {
        return callback != 0;
      }, 'promise to resolve/reject');
    });
  });
});

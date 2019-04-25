goog.require('os.config.Settings');
goog.require('plugin.suncalc.Plugin');

describe('plugin.suncalc.Plugin', function() {
  it('should add settings plugin on init()', function() {
    var mockSettingsManager = spyOn(os.ui.config.SettingsManager, 'getInstance').andCallThrough();

    var suncalcPlugin = new plugin.suncalc.Plugin();
    suncalcPlugin.init();

    expect(mockSettingsManager).toHaveBeenCalled();
  });
});

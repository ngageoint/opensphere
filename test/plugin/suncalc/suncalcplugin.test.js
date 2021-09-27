goog.require('os.config.Settings');
goog.require('os.ui.config.SettingsManager');
goog.require('plugin.suncalc.SunCalcPlugin');

describe('plugin.suncalc.SunCalcPlugin', function() {
  const {default: SettingsManager} = goog.module.get('os.ui.config.SettingsManager');
  const {default: SunCalcPlugin} = goog.module.get('plugin.suncalc.SunCalcPlugin');

  it('should add settings plugin on init()', function() {
    var mockSettingsManager = spyOn(SettingsManager, 'getInstance').andCallThrough();

    var suncalcPlugin = new SunCalcPlugin();
    suncalcPlugin.init();

    expect(mockSettingsManager).toHaveBeenCalled();
  });
});

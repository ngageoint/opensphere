goog.require('os.config.Settings');
goog.require('plugin.suncalc.LightStripSettings');
goog.require('plugin.suncalc.LightStripSettingsCtrl');
goog.require('plugin.suncalc.LightStripSettingsDirective');
goog.require('test.os.config.SettingsUtil');

describe('plugin.suncalc.LightStripSettingsCtrl', function() {
  var windowScope;
  var ctrlScope;

  beforeEach(function() {
    inject(function($rootScope) {
      windowScope = $rootScope.$new();
      ctrlScope = windowScope.$new();
    });
  });

  it('should get the current twilight calculation preference', function() {
    var mockOsSettingsGet = spyOn(os.settings, 'get').andReturn(plugin.suncalc.duskMode.ASTRONOMICAL);

    var lightStripSettingsCtrl = new plugin.suncalc.LightStripSettingsCtrl(ctrlScope);

    expect(mockOsSettingsGet).toHaveBeenCalled();
    expect(lightStripSettingsCtrl.twilightCalculation).toBe(plugin.suncalc.duskMode.ASTRONOMICAL);
  });

  it('should save a changed preference when notified of a changed preference', function() {
    var mockOsSettingsSet = spyOn(os.settings, 'set');
    var opt_new = 'nautical';
    var opt_old = 'astronomical';

    var lightStripSettingsCtrl = new plugin.suncalc.LightStripSettingsCtrl(ctrlScope);

    lightStripSettingsCtrl.onSettingsChanged(opt_new, opt_old);

    expect(mockOsSettingsSet).toHaveBeenCalledWith(plugin.suncalc.SettingKey.DUSK_MODE, opt_new);
  });

  it('should not save a changed preference when notified of an unchanged preference', function() {
    var mockOsSettingsSet = spyOn(os.settings, 'set');
    var opt_old = 'astronomical';

    var lightStripSettingsCtrl = new plugin.suncalc.LightStripSettingsCtrl(ctrlScope);

    lightStripSettingsCtrl.onSettingsChanged(opt_old, opt_old);

    expect(mockOsSettingsSet).not.toHaveBeenCalled();
  });

  it('should return a Directive with the correct templateURL', function() {
    var ret = plugin.suncalc.LightStripSettingsDirective();

    expect(ret['templateUrl']).toEqual(os.ROOT + 'views/plugin/suncalc/lightstripsettings.html');
  });
});

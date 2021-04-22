goog.require('os');
goog.require('os.config.Settings');
goog.require('plugin.suncalc');
goog.require('plugin.suncalc.LightStripSettingsUI');
goog.require('test.os.config.SettingsUtil');

describe('plugin.suncalc.LightStripSettingsUI', function() {
  const {ROOT} = goog.module.get('os');
  const Settings = goog.module.get('os.config.Settings');
  const {duskMode, SettingKey} = goog.module.get('plugin.suncalc');
  const {Controller, directive} = goog.module.get('plugin.suncalc.LightStripSettingsUI');

  var windowScope;
  var ctrlScope;

  beforeEach(function() {
    inject(function($rootScope) {
      windowScope = $rootScope.$new();
      ctrlScope = windowScope.$new();
    });
  });

  it('should get the current twilight calculation preference', function() {
    const settings = Settings.getInstance();
    var mockOsSettingsGet = spyOn(settings, 'get').andReturn(duskMode.ASTRONOMICAL);

    var ctrl = new Controller(ctrlScope);

    expect(mockOsSettingsGet).toHaveBeenCalled();
    expect(ctrl.twilightCalculation).toBe(duskMode.ASTRONOMICAL);
  });

  it('should save a changed preference when notified of a changed preference', function() {
    const settings = Settings.getInstance();
    var mockOsSettingsSet = spyOn(settings, 'set');
    var opt_new = 'nautical';
    var opt_old = 'astronomical';

    var ctrl = new Controller(ctrlScope);

    ctrl.onSettingsChanged(opt_new, opt_old);

    expect(mockOsSettingsSet).toHaveBeenCalledWith(SettingKey.DUSK_MODE, opt_new);
  });

  it('should not save a changed preference when notified of an unchanged preference', function() {
    const settings = Settings.getInstance();
    var mockOsSettingsSet = spyOn(settings, 'set');
    var opt_old = 'astronomical';

    var ctrl = new Controller(ctrlScope);

    ctrl.onSettingsChanged(opt_old, opt_old);

    expect(mockOsSettingsSet).not.toHaveBeenCalled();
  });

  it('should return a Directive with the correct templateURL', function() {
    var ret = directive();

    expect(ret['templateUrl']).toEqual(ROOT + 'views/plugin/suncalc/lightstripsettings.html');
  });
});

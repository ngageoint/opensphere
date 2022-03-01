goog.require('os');
goog.require('os.config.Settings');
goog.require('plugin.suncalc');
goog.require('plugin.suncalc.SunCalcPlugin');
goog.require('plugin.suncalc.SunCalcUI');

describe('plugin.suncalc.SunCalcUI', function() {
  const {ROOT} = goog.module.get('os');
  const {default: Settings} = goog.module.get('os.config.Settings');
  const {SettingKey} = goog.module.get('plugin.suncalc');
  const {launchWindow} = goog.module.get('plugin.suncalc.SunCalcPlugin');
  const {Controller, directive} = goog.module.get('plugin.suncalc.SunCalcUI');

  const windowSelector = 'div[label="Sun and Moon Info"]';

  var windowScope;
  var ctrlScope;
  var parent;
  var element;
  var settings;

  beforeEach(function() {
    if (!settings) {
      settings = Settings.getInstance();
    }

    inject(function($rootScope) {
      windowScope = $rootScope.$new();
      ctrlScope = windowScope.$new();
      parent = $('<div></div>');
      element = $('<div></div>').appendTo(parent);
    });
  });

  it('should get the current twilight calculation preference', function() {
    var mockOsSettingsGet = spyOn(settings, 'get').andReturn(null);

    new Controller(ctrlScope, element);

    expect(mockOsSettingsGet).toHaveBeenCalledWith(SettingKey.DUSK_MODE);
  });

  it('should use the twilight calculation preference for time events', function() {
    var i;
    var mockOsSettingsGet;
    var sunCalcCtrl = new Controller(ctrlScope, element);

    mockOsSettingsGet = spyOn(settings, 'get').andReturn('astronomical');
    sunCalcCtrl.update_();
    expect(mockOsSettingsGet).toHaveBeenCalled();
    for (i in sunCalcCtrl.scope_['time']) {
      if (sunCalcCtrl.scope_['times'][i]['label'] === 'Dawn') {
        expect(sunCalcCtrl.scope_['times'][i]['title']).toEqual('Astronomical calculation');
      }
    }

    this.removeAllSpies();
    mockOsSettingsGet = spyOn(settings, 'get').andReturn('civilian');
    sunCalcCtrl.update_();
    expect(mockOsSettingsGet).toHaveBeenCalled();
    for (i in sunCalcCtrl.scope_['time']) {
      if (sunCalcCtrl.scope_['times'][i]['label'] === 'Dawn') {
        expect(sunCalcCtrl.scope_['times'][i]['title']).toEqual('Civilian calculation');
      }
    }

    this.removeAllSpies();
    mockOsSettingsGet = spyOn(settings, 'get').andReturn('nautical');
    sunCalcCtrl.update_();
    expect(mockOsSettingsGet).toHaveBeenCalled();
    for (i in sunCalcCtrl.scope_['time']) {
      if (sunCalcCtrl.scope_['times'][i]['label'] === 'Dawn') {
        expect(sunCalcCtrl.scope_['times'][i]['title']).toEqual('Nautical calculation');
      }
    }
  });

  it('should return a Directive with the correct templateURL', function() {
    var ret = directive();

    expect(ret['templateUrl']).toEqual(ROOT + 'views/plugin/suncalc/suncalc.html');
  });

  it('should close the window', function() {
    launchWindow([0, 0]);

    waitsFor(() => !!document.querySelector(windowSelector), 'window to open');

    runs(() => {
      const bodyEl = document.querySelector(`${windowSelector} .modal-body`);
      const scope = $(bodyEl).scope();
      expect(scope).toBeDefined();
      expect(scope.ctrl).toBeDefined();

      scope.ctrl.close();
    });

    waitsFor(() => !document.querySelector(windowSelector), 'window to close');
  });

  it('should return non-number when formatTime is called with a non-number', function() {
    var test = 'test string';

    expect(Controller.prototype.formatTime(test)).toBe(test);
  });

  it('should return "01:00" when formatTime is called with 1 hour of miliseconds', function() {
    var test = 1000 * 60 * 60;

    expect(Controller.prototype.formatTime(test)).toBe('01:00');
  });

  it('should return a UTC time when formatDate is called with good input', function() {
    var test = moment('2019-01-02 16:00:00Z').unix() * 1000;
    var result = '2019-01-02 16:00:00Z';

    expect(Controller.prototype.formatDate(test)).toBe(result);
  });

  it('should return a blank string when formatDate is called with undefined', function() {
    var undefinedVar;

    expect(Controller.prototype.formatDate(undefinedVar)).toBe('');
  });
});

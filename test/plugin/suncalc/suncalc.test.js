goog.require('os.config.Settings');
goog.require('plugin.suncalc.SunCalcCtrl');
goog.require('plugin.suncalc.sunCalcDirective');

describe('plugin.suncalc.SunCalcCtrl', function() {
  var windowScope;
  var ctrlScope;
  var parent;
  var element;

  beforeEach(function() {
    inject(function($rootScope) {
      windowScope = $rootScope.$new();
      ctrlScope = windowScope.$new();
      parent = $('<div></div>');
      element = $('<div></div>').appendTo(parent);
    });
  });

  it('should get the current twilight calculation preference', function() {
    var mockOsSettingsGet = spyOn(os.settings, 'get').andReturn(null);

    new plugin.suncalc.SunCalcCtrl(ctrlScope, element);

    expect(mockOsSettingsGet).toHaveBeenCalled();
  });

  it('should use the twilight calculation preference for time events', function() {
    var i;
    var mockOsSettingsGet;
    var sunCalcCtrl = new plugin.suncalc.SunCalcCtrl(ctrlScope, element);

    mockOsSettingsGet = spyOn(os.settings, 'get').andReturn('astronomical');
    sunCalcCtrl.update_();
    expect(mockOsSettingsGet).toHaveBeenCalled();
    for (i in sunCalcCtrl.scope_['time']) {
      if (sunCalcCtrl.scope_['times'][i]['label'] === 'Dawn') {
        expect(sunCalcCtrl.scope_['times'][i]['title']).toEqual('Astronomical calculation');
      }
    }

    this.removeAllSpies();
    mockOsSettingsGet = spyOn(os.settings, 'get').andReturn('civilian');
    sunCalcCtrl.update_();
    expect(mockOsSettingsGet).toHaveBeenCalled();
    for (i in sunCalcCtrl.scope_['time']) {
      if (sunCalcCtrl.scope_['times'][i]['label'] === 'Dawn') {
        expect(sunCalcCtrl.scope_['times'][i]['title']).toEqual('Civilian calculation');
      }
    }

    this.removeAllSpies();
    mockOsSettingsGet = spyOn(os.settings, 'get').andReturn('nautical');
    sunCalcCtrl.update_();
    expect(mockOsSettingsGet).toHaveBeenCalled();
    for (i in sunCalcCtrl.scope_['time']) {
      if (sunCalcCtrl.scope_['times'][i]['label'] === 'Dawn') {
        expect(sunCalcCtrl.scope_['times'][i]['title']).toEqual('Nautical calculation');
      }
    }
  });

  it('should return a Directive with the correct templateURL', function() {
    var ret = plugin.suncalc.sunCalcDirective();

    expect(ret['templateUrl']).toEqual(os.ROOT + 'views/plugin/suncalc/suncalc.html');
  });

  it('should call os.ui.window.close() when closing', function() {
    var sunCalcCtrl = new plugin.suncalc.SunCalcCtrl(ctrlScope, element);

    var mockOsUiWindow = spyOn(os.ui.window, 'close');

    sunCalcCtrl.close();

    expect(mockOsUiWindow).toHaveBeenCalledWith(element);
  });

  it('should return non-number when formatTime is called with a non-number', function() {
    var test = 'test string';

    expect(plugin.suncalc.SunCalcCtrl.prototype.formatTime(test)).toBe(test);
  });

  it('should return "01:00" when formatTime is called with 1 hour of miliseconds', function() {
    var test = 1000 * 60 * 60;

    expect(plugin.suncalc.SunCalcCtrl.prototype.formatTime(test)).toBe('01:00');
  });

  it('should return a UTC time when formatDate is called with good input', function() {
    var test = moment('2019-01-02 16:00:00Z').unix() * 1000;
    var result = '2019-01-02 16:00:00Z';

    expect(plugin.suncalc.SunCalcCtrl.prototype.formatDate(test)).toBe(result);
  });

  it('should return a blank string when formatDate is called with undefined', function() {
    var undefinedVar;

    expect(plugin.suncalc.SunCalcCtrl.prototype.formatDate(undefinedVar)).toBe('');
  });
});

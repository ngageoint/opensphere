goog.require('os.config.Settings');
goog.require('plugin.suncalc.LightStripCtrl');
goog.require('plugin.suncalc.lightStripDirective');
goog.require('test.os.config.SettingsUtil');

describe('plugin.suncalc.LightStripCtrl', function() {
  var windowScope;
  var ctrlScope;
  var parent;
  var element;

  beforeEach(function() {
    inject(function($rootScope) {
      windowScope = $rootScope.$new();
      ctrlScope = windowScope.$new();
      parent = $('<div></div>');
      element = $('<canvas class="position-absolute" height="2" width=""></canvas>').appendTo(parent);
    });
  });

  it('should handle parameters', function() {
    var lightStripCtrl = new plugin.suncalc.LightStripCtrl(ctrlScope, element);

    expect(lightStripCtrl['element_']).toBe(element);
  });

  it('should initialize dusk events', function() {
    var mockDuskEventCalculation = spyOn(plugin.suncalc.LightStripCtrl.prototype, 'setDuskEventCalculation_');

    new plugin.suncalc.LightStripCtrl(ctrlScope, element);

    expect(mockDuskEventCalculation).toHaveBeenCalled();
  });

  it('should listen to dusk settings changes', function() {
    var displaySetting;
    var mockOsSettingsListen = spyOn(os.settings, 'listen').andCallFake(function() {
      displaySetting = arguments[0];
    });

    new plugin.suncalc.LightStripCtrl(ctrlScope, element);

    expect(mockOsSettingsListen).toHaveBeenCalled();
    expect(displaySetting).toBe(plugin.suncalc.SettingKey.DUSK_MODE);
  });

  it('should calculate dusk events with no existing preference', function() {
    spyOn(os.settings, 'get').andReturn(null);

    var lightStripCtrl = new plugin.suncalc.LightStripCtrl(ctrlScope, element);
    expect(lightStripCtrl.events_.length).toBe(4);

    lightStripCtrl.events_ = [];
    expect(lightStripCtrl.events_.length).toBe(0);

    lightStripCtrl.setDuskEventCalculation_();
    expect(lightStripCtrl.events_.length).toBe(4);
  });

  it('should calculate dusk events with an existing preference', function() {
    var lightStripCtrl = new plugin.suncalc.LightStripCtrl(ctrlScope, element);

    spyOn(os.settings, 'get').andReturn('astronomical');
    lightStripCtrl.setDuskEventCalculation_();
    expect(lightStripCtrl.events_[0]['label']).toBe('nightEnd');

    this.removeAllSpies();
    spyOn(os.settings, 'get').andReturn('civilian');
    lightStripCtrl.setDuskEventCalculation_();
    expect(lightStripCtrl.events_[0]['label']).toBe('dawn');

    this.removeAllSpies();
    spyOn(os.settings, 'get').andReturn('nautical');
    lightStripCtrl.setDuskEventCalculation_();
    expect(lightStripCtrl.events_[0]['label']).toBe('nauticalDawn');
  });

  it('should recalculate dusk events and update on setting change', function() {
    var lightStripCtrl = new plugin.suncalc.LightStripCtrl(ctrlScope, element);

    spyOn(lightStripCtrl, 'setDuskEventCalculation_');
    spyOn(lightStripCtrl, 'update_');

    lightStripCtrl.onDuskModeChange_();

    expect(lightStripCtrl.setDuskEventCalculation_).toHaveBeenCalled();
    expect(lightStripCtrl.update_).toHaveBeenCalled();
  });

  it('should handle basic error cases when updating', function() {
    var lightStripCtrl = new plugin.suncalc.LightStripCtrl(ctrlScope, element);
    goog.dispose(lightStripCtrl.updateDelay_);

    expect(1).toBe(1);
  });

  it('should return a Directive with the correct templateURL', function() {
    var ret = plugin.suncalc.lightStripDirective();

    expect(ret['template']).toEqual('<canvas class="position-absolute" height="2" width=""></canvas>');
  });

  it('should clear the view on destroy if it has one', function() {
    var lightStripCtrl = new plugin.suncalc.LightStripCtrl(ctrlScope, element);
    lightStripCtrl.view_ = {};
    lightStripCtrl.view_.un = jasmine.createSpy('un');

    lightStripCtrl.destroy_();

    expect(lightStripCtrl.view_).toBe(null);
  });

  it('should not update if there is no element', function() {
    var lightStripCtrl = new plugin.suncalc.LightStripCtrl(ctrlScope, element);
    goog.dispose(lightStripCtrl.updateDelay_);
    lightStripCtrl.element_ = null;

    var result = lightStripCtrl.update_();

    expect(result).toBeTruthy();
  });

  it('should not update if there are no options', function() {
    var result;
    var lightStripCtrl = new plugin.suncalc.LightStripCtrl(ctrlScope, element);
    goog.dispose(lightStripCtrl.updateDelay_);

    result = lightStripCtrl.update_();

    expect(result).toBeFalsy();

    var fakeEvent = new os.ui.timeline.TimelineScaleEvent(null);
    result = lightStripCtrl.update_(fakeEvent);

    expect(result).toBeFalsy();
  });

  it('should not update if there is no map', function() {
    var result;
    var lightStripCtrl = new plugin.suncalc.LightStripCtrl(ctrlScope, element);
    goog.dispose(lightStripCtrl.updateDelay_);

    lightStripCtrl.options_ = {
      'interval': 1,
      'start': 1,
      'end': 1
    };

    var mapSpy = spyOn(os.MapContainer.prototype, 'getMap').andReturn(false);

    result = lightStripCtrl.update_();

    expect(result).toBeFalsy();
    expect(mapSpy).toHaveBeenCalled();
  });

  it('should not update if the map cannot get a view', function() {
    var result;
    var lightStripCtrl = new plugin.suncalc.LightStripCtrl(ctrlScope, element);
    goog.dispose(lightStripCtrl.updateDelay_);

    lightStripCtrl.options_ = {
      'interval': 1,
      'start': 1,
      'end': 1
    };

    var mapSpy = spyOn(ol.PluggableMap.prototype, 'getView').andReturn(false);

    result = lightStripCtrl.update_();

    expect(result).toBeFalsy();
    expect(mapSpy).toHaveBeenCalled();
  });

  it('should not get a new view if it already has one', function() {
    var lightStripCtrl = new plugin.suncalc.LightStripCtrl(ctrlScope, element);
    goog.dispose(lightStripCtrl.updateDelay_);

    lightStripCtrl.options_ = {
      'interval': 1,
      'start': 1,
      'end': 1
    };
    lightStripCtrl.view_ = jasmine.createSpyObj('getView', ['getCenter', 'getView', 'on', 'un']);
    lightStripCtrl.view_.getCenter.andReturn(false);

    var mapSpyObj = jasmine.createSpyObj('getView', ['getCenter', 'getView', 'on', 'un']);
    mapSpyObj.on.andReturn(false);
    spyOn(ol.PluggableMap.prototype, 'getView').andReturn(mapSpyObj);

    result = lightStripCtrl.update_();

    expect(result).toBeFalsy();
    expect(mapSpyObj.getView).not.toHaveBeenCalled();
  });

  it('should bind the view to change:center', function() {
    var result;
    var lightStripCtrl = new plugin.suncalc.LightStripCtrl(ctrlScope, element);
    goog.dispose(lightStripCtrl.updateDelay_);

    lightStripCtrl.options_ = {
      'interval': 1,
      'start': 1,
      'end': 1
    };

    var mapSpyObj = jasmine.createSpyObj('getView', ['getCenter', 'getView', 'on', 'un']);
    mapSpyObj.getCenter.andReturn(false);
    mapSpyObj.on.andReturn(false);
    spyOn(ol.PluggableMap.prototype, 'getView').andReturn(mapSpyObj);

    result = lightStripCtrl.update_();

    expect(result).toBeFalsy();
    expect(mapSpyObj.on).toHaveBeenCalled();
  });

  it('should clear the rectangle if the interval is too short', function() {
    var result;

    var ctxSpy = jasmine.createSpyObj('ctx', ['clearRect', 'fillRect']);
    spyOn(HTMLCanvasElement.prototype, 'getContext').andReturn(ctxSpy);
    var lightStripCtrl = new plugin.suncalc.LightStripCtrl(ctrlScope, element);
    goog.dispose(lightStripCtrl.updateDelay_);

    lightStripCtrl.options_ = {
      'interval': 1000 * 60 * 60 * 24,
      'start': 1,
      'end': 1
    };

    result = lightStripCtrl.update_();
    expect(result).toBeFalsy();
    expect(ctxSpy.clearRect).toHaveBeenCalled();
  });

  it('should fill canvas rectangles', function() {
    var result;

    var ctxSpy = jasmine.createSpyObj('ctx', ['clearRect', 'fillRect']);
    spyOn(HTMLCanvasElement.prototype, 'getContext').andReturn(ctxSpy);

    var lightStripCtrl = new plugin.suncalc.LightStripCtrl(ctrlScope, element);
    goog.dispose(lightStripCtrl.updateDelay_);

    lightStripCtrl.options_ = {
      'interval': 1000 * 60 * 60 * 2,
      'start': 1,
      'end': 4
    };

    result = lightStripCtrl.update_();
    expect(result).toBeTruthy();
    expect(ctxSpy.fillRect).toHaveBeenCalled();
  });
});

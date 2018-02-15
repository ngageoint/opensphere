goog.require('os.ui.geo.PositionCtrl');


describe('os.ui.geo.PositionCtrl', function() {
  it('should have sensible default precision', inject(function($rootScope) {
    var ctrl = new os.ui.geo.PositionCtrl($rootScope.$new());
    expect(ctrl.precision).toBe(100000000);
  }))
  
  it('should format position correctly - NE', inject(function($rootScope) {
    var ctrl = new os.ui.geo.PositionCtrl($rootScope.$new());
    ctrl.scope_['geom'] = [];
    ctrl.scope_['geom']['lat'] = 45.1;
    ctrl.scope_['geom']['lon'] = 100.223;
    ctrl.formatLatLon_();
    expect(ctrl.scope_['posText']).toBe('45.1N 100.223E');
  }))
  
  it('should format position correctly - NW', inject(function($rootScope) {
    var ctrl = new os.ui.geo.PositionCtrl($rootScope.$new());
    ctrl.scope_['geom'] = [];
    ctrl.scope_['geom']['lat'] = 45.1;
    ctrl.scope_['geom']['lon'] = -100.223;
    ctrl.formatLatLon_();
    expect(ctrl.scope_['posText']).toBe('45.1N 100.223W');
  }))
  
  it('should format position correctly - SE', inject(function($rootScope) {
    var ctrl = new os.ui.geo.PositionCtrl($rootScope.$new());
    ctrl.scope_['geom'] = [];
    ctrl.scope_['geom']['lat'] = -45.1;
    ctrl.scope_['geom']['lon'] = 100.223;
    ctrl.formatLatLon_();
    expect(ctrl.scope_['posText']).toBe('45.1S 100.223E');
  }))
  
  it('should format position correctly - SW', inject(function($rootScope) {
    var ctrl = new os.ui.geo.PositionCtrl($rootScope.$new());
    ctrl.scope_['geom'] = [];
    ctrl.scope_['geom']['lat'] = -45.1;
    ctrl.scope_['geom']['lon'] = -100.223;
    ctrl.formatLatLon_();
    expect(ctrl.scope_['posText']).toBe('45.1S 100.223W');
  }))
  
  it('should format position correctly - Equator', inject(function($rootScope) {
    var ctrl = new os.ui.geo.PositionCtrl($rootScope.$new());
    ctrl.scope_['geom'] = [];
    ctrl.scope_['geom']['lat'] = 0;
    ctrl.scope_['geom']['lon'] = -100.223;
    ctrl.formatLatLon_();
    expect(ctrl.scope_['posText']).toBe('0N 100.223W');
  }))

  it('should format position correctly - Meridian', inject(function($rootScope) {
    var ctrl = new os.ui.geo.PositionCtrl($rootScope.$new());
    ctrl.scope_['geom'] = [];
    ctrl.scope_['geom']['lat'] = -45.2;
    ctrl.scope_['geom']['lon'] = 0;
    ctrl.formatLatLon_();
    expect(ctrl.scope_['posText']).toBe('45.2S 0E');
  }))

  it('should round position up correctly', inject(function($rootScope) {
    var ctrl = new os.ui.geo.PositionCtrl($rootScope.$new());
    ctrl.scope_['geom'] = [];
    ctrl.scope_['disabled'] = false;
    ctrl.onMapClick_(null, [100.01234567890123, 45.12345678901234], false);
    expect(ctrl.scope_['posText']).toBe('45.12345679N 100.01234568E');
  }))

  it('should round position down correctly', inject(function($rootScope) {
    var ctrl = new os.ui.geo.PositionCtrl($rootScope.$new());
    ctrl.scope_['geom'] = [];
    ctrl.scope_['disabled'] = false;
    ctrl.onMapClick_(null, [100.012345670123, 45.123456781234], false);
    expect(ctrl.scope_['posText']).toBe('45.12345678N 100.01234567E');
  }))

  it('should should leave map clicks enabled if so specified', inject(function($rootScope) {
    var ctrl = new os.ui.geo.PositionCtrl($rootScope.$new());
    ctrl.scope_['geom'] = [];
    ctrl.scope_['disabled'] = false;
    ctrl['mapEnabled'] = true;
    spyOn(ctrl, 'formatLatLon_');
    ctrl.onMapClick_(null, [143, -38], false);
    expect(ctrl.formatLatLon_).toHaveBeenCalled();
    expect(ctrl['mapEnabled']).toBe(true);
  }))
  
  it('should should disable map clicks if so specified', inject(function($rootScope) {
    var ctrl = new os.ui.geo.PositionCtrl($rootScope.$new());
    ctrl.scope_['geom'] = [];
    ctrl.scope_['disabled'] = false;
    ctrl['mapEnabled'] = true;
    spyOn(ctrl, 'formatLatLon_');
    ctrl.onMapClick_(null, [143, -38], true);
    expect(ctrl.formatLatLon_).toHaveBeenCalled();
    expect(ctrl['mapEnabled']).toBe(false);
  }))
  
  it('should should toggle map clicks from enabled to disabled', inject(function($rootScope) {
    var ctrl = new os.ui.geo.PositionCtrl($rootScope.$new());
    ctrl['mapEnabled'] = false;
    ctrl.toggleMapEnabled();
    expect(ctrl['mapEnabled']).toBe(true);
  }))

  it('should should toggle map clicks from disabled to enabled', inject(function($rootScope) {
    var ctrl = new os.ui.geo.PositionCtrl($rootScope.$new());
    ctrl['mapEnabled'] = true;
    ctrl.toggleMapEnabled();
    expect(ctrl['mapEnabled']).toBe(false);
  }))
  
  it('should should leave map clicks enabled', inject(function($rootScope) {
    var ctrl = new os.ui.geo.PositionCtrl($rootScope.$new());
    ctrl['mapEnabled'] = true;
    ctrl.setMapEnabled_(true);
    expect(ctrl['mapEnabled']).toBe(true);
  }))
  
  it('should should leave map clicks disabled', inject(function($rootScope) {
    var ctrl = new os.ui.geo.PositionCtrl($rootScope.$new());
    ctrl['mapEnabled'] = false;
    ctrl.setMapEnabled_(false);
    expect(ctrl['mapEnabled']).toBe(false);
  }))

  it('should not do anything if disabled', inject(function($rootScope) {
    var ctrl = new os.ui.geo.PositionCtrl($rootScope.$new());
    ctrl.scope_['geom'] = [];
    ctrl.scope_['disabled'] = true;
    spyOn(ctrl, 'formatLatLon_');
    ctrl.onMapClick_(null, [100.012345670123, 45.123456781234], false);
    expect(ctrl.formatLatLon_).not.toHaveBeenCalled();
  }))
  
  it('should have a sensible default label', inject(function($rootScope) {
    var scope  = $rootScope.$new()
    var ctrl = new os.ui.geo.PositionCtrl(scope);
    expect(ctrl['label']).toBe('Position:');
  }))

  it('should have take a label', inject(function($rootScope) {
    var scope  = $rootScope.$new()
    scope['label'] = 'X1:';
    var ctrl = new os.ui.geo.PositionCtrl(scope);
    expect(ctrl['label']).toBe('X1:');
  }))

  it('should have have a null label if false', inject(function($rootScope) {
    var scope  = $rootScope.$new()
    scope['label'] = 'false';
    var ctrl = new os.ui.geo.PositionCtrl(scope);
    expect(ctrl['label']).toBe(null);
  }))
  
});

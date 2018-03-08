goog.require('os.unit.UnitManager');

describe('os.unit.UnitManager', function() {
  it('should function correctly', inject(function($rootScope) {
    var um = os.unit.UnitManager.getInstance();
    expect(um.getSystems().length).toBe(7);
    expect(Object.keys(um.getFullSystems()).length).toBe(7);
    expect(um.getSelectedSystem()).toBe('metric'); //should default to the base system
    expect(um.getBaseSystem()).toBe('metric');
    um.setSelectedSystem('electric');
    expect(um.getSelectedSystem()).toBe('electric'); //should not default to the base system, even if not real
    expect(um.getBaseUnits('electric')).toBe(undefined);
    um.setSelectedSystem('metric');
    expect(um.getSelectedSystem()).toBe('metric'); //should not default to the base system, even if real
    expect(um.getBaseUnits('distance').getMultipliers().length).toBe(12);
    um.onUnitsChange_({}); // code completion
  }));

  //replicated from unit.test.js
  it('should convert meters to other units', function() {
    var um = os.unit.UnitManager.getInstance();
    // implied meters
    expect(um.convert('distance', 1000, 'm', 'metric', 'm', 'metric')).toBe(1000);
    expect(um.convert('distance', 1000, 'm', 'metric', 'km', 'metric')).toBe(1);
    expect(um.convert('distance', 1000, 'm', 'metric', 'mi', 'imperial')).toBeCloseTo(0.62137, 5);
    expect(um.convert('distance', 1000, 'm', 'metric', 'ft', 'imperial')).toBeCloseTo(3280.839895, 6);
    expect(um.convert('distance', 1000, 'm', 'metric', 'nmi', 'nautical')).toBeCloseTo(0.53996, 5);
  });

  it('should convert kilometers to other units', function() {
    var um = os.unit.UnitManager.getInstance();
    expect(um.convert('distance', 10, 'km', 'metric', 'm', 'metric')).toBe(10000);
    expect(um.convert('distance', 10, 'km', 'metric', 'km', 'metric')).toBe(10);
    expect(um.convert('distance', 10, 'km', 'metric', 'mi', 'imperial')).toBeCloseTo(6.2137, 4);
    expect(um.convert('distance', 10, 'km', 'metric', 'ft', 'imperial')).toBeCloseTo(32808.39895, 5);
    expect(um.convert('distance', 10, 'km', 'metric', 'nmi', 'nautical')).toBeCloseTo(5.39957, 5);
  });

  it('should convert miles to other units', function() {
    var um = os.unit.UnitManager.getInstance();
    expect(um.convert('distance', 10, 'mi', 'imperial', 'm', 'metric')).toBeCloseTo(16093.44, 2);
    expect(um.convert('distance', 10, 'mi', 'imperial', 'km', 'metric')).toBeCloseTo(16.0934, 4);
    expect(um.convert('distance', 10, 'mi', 'imperial', 'mi', 'imperial')).toBe(10);
    expect(um.convert('distance', 10, 'mi', 'imperial', 'ft', 'imperial')).toBeCloseTo(52800, 1);
    expect(um.convert('distance', 10, 'mi', 'imperial', 'nmi', 'nautical')).toBeCloseTo(8.68976, 5);
  });

  it('should convert feet to other units', function() {
    var um = os.unit.UnitManager.getInstance();
    expect(um.convert('distance', 5280, 'ft', 'imperial', 'm', 'metric')).toBeCloseTo(1609.344, 3);
    expect(um.convert('distance', 5280, 'ft', 'imperial', 'km', 'metric')).toBeCloseTo(1.6093, 4);
    expect(um.convert('distance', 5280, 'ft', 'imperial', 'mi', 'imperial')).toBe(1);
    expect(um.convert('distance', 5280, 'ft', 'imperial', 'ft', 'imperial')).toBe(5280);
    expect(um.convert('distance', 5280, 'ft', 'imperial', 'nmi', 'nautical')).toBeCloseTo(0.86898, 5);
  });

  it('should convert nautical miles to other units', function() {
    var um = os.unit.UnitManager.getInstance();
    expect(um.convert('distance', 10, 'nmi', 'nautical', 'm', 'metric')).toBe(18520);
    expect(um.convert('distance', 10, 'nmi', 'nautical', 'km', 'metric')).toBeCloseTo(18.52, 2);
    expect(um.convert('distance', 10, 'nmi', 'nautical', 'mi', 'imperial')).toBeCloseTo(11.5078, 4);
    expect(um.convert('distance', 10, 'nmi', 'nautical', 'ft', 'imperial')).toBeCloseTo(60761.2, 1);
    expect(um.convert('distance', 10, 'nmi', 'nautical', 'nmi', 'nautical')).toBe(10);
  });

  it('should convert units to the same units', function() {
    var um = os.unit.UnitManager.getInstance();
    expect(um.convert('distance', 123.4567, 'm', 'metric', 'm', 'metric')).toBeCloseTo(123.4567, 4);
    expect(um.convert('distance', 123.4567, 'km', 'metric', 'km', 'metric')).toBeCloseTo(123.4567, 4);
    expect(um.convert('distance', 123.4567, 'mi', 'imperial', 'mi', 'imperial')).toBeCloseTo(123.4567, 4);
    expect(um.convert('distance', 123.4567, 'ft', 'imperial', 'ft', 'imperial')).toBeCloseTo(123.4567, 4);
    expect(um.convert('distance', 123.4567, 'nmi', 'nautical', 'nmi', 'nautical')).toBeCloseTo(123.4567, 4);
  });

  it('should convert meters to other units and stringify the result', function() {
    var um = os.unit.UnitManager.getInstance();
    // Test the boundaries (km to m)
    expect(um.formatToBestFit('distance', 1000, 'm', um.getBaseSystem(), 0)).toBe('1 km');
    expect(um.formatToBestFit('distance', 999, 'm', um.getBaseSystem(), 0)).toBe('999 m');

    // Test zero to default
    expect(um.formatToBestFit('distance', .0, 'm', um.getBaseSystem(), 2)).toBe('0.00 m');

    // Test the boundaries (mi to ft)
    um.setSelectedSystem('imperial');
    expect(um.formatToBestFit('distance', 161, 'm', um.getBaseSystem(), 3)).toBe('0.100 mi');
    expect(um.formatToBestFit('distance', 160, 'm', um.getBaseSystem(), 3)).toBe('174.978 yd');
    expect(um.formatToBestFit('distance', 0.9, 'm', um.getBaseSystem(), 3)).toBe('2.953 ft');

    // Test the boundaries (nm to ft)
    um.setSelectedSystem('nautical');
    expect(um.formatToBestFit('distance', 1852, 'm', um.getBaseSystem(), 0)).toBe('1 nmi');
    expect(um.formatToBestFit('distance', 1851, 'm', um.getBaseSystem(), 3)).toBe('6072.719 ft');

    // Test falling below lowest unit
    expect(um.formatToBestFit('distance', .1, 'm', um.getBaseSystem(), 3)).toBe('0.328 ft');
  });
});

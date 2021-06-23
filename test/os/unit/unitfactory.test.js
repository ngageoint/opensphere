goog.require('os.unit.Multiplier');
goog.require('os.unit.UnitFactory');

describe('os.unit.UnitFactory', function() {
  const Multiplier = goog.module.get('os.unit.Multiplier');
  const UnitFactory = goog.module.get('os.unit.UnitFactory');

  it('should function correctly', inject(function($rootScope) {
    var mult = new Multiplier('m', 1, true, 'meters');
    var unitFactory = new UnitFactory();
    expect(unitFactory.getUnit('electric', 'jigawatts')).toBeNull(); // imaginary units + made up system
    expect(unitFactory.getUnit('metric', 'jigawatts')).toBe(undefined); // imaginary units + real system
    expect(unitFactory.getUnit('electric', 'distance')).toBeNull(); // real units + made up system
    expect(unitFactory.getUnit('metric', 'distance').getDefaultMultiplier()).toEqual(mult); // real units + real system
    expect(unitFactory.getSystems().length).toBe(7);
    expect(Object.keys(unitFactory.getFullSystems()).length).toBe(7);
    // code coverage of compiler appeasement
    unitFactory.systems_ = {};
    expect(unitFactory.getSystems().length).toBe(0);
  }));
});

goog.require('os.unit.Multiplier');
goog.require('os.unit.UnitFactory');

describe('os.unit.UnitFactory', function() {
  it('should function correctly', inject(function($rootScope) {
    var mult = new os.unit.Multiplier('m', 1, true, 'meters');
    var unitFactory = new os.unit.UnitFactory();
    expect(unitFactory.getUnit('electric', 'jigawatts')).toBeNull(); //imaginary units + made up system
    expect(unitFactory.getUnit('metric', 'jigawatts')).toBe(undefined); //imaginary units + real system
    expect(unitFactory.getUnit('electric', 'distance')).toBeNull(); //real units + made up system
    expect(unitFactory.getUnit('metric', 'distance').getDefaultMultiplier()).toEqual(mult); //real units + real system
    expect(unitFactory.getSystems().length).toBe(7);
    expect(Object.keys(unitFactory.getFullSystems()).length).toBe(7);
    // code coverage of compiler appeasement
    unitFactory.systems_ = null;
    expect(unitFactory.getSystems().length).toBe(0);
  }));
});

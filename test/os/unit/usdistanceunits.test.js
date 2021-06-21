goog.require('os.unit.Multiplier');
goog.require('os.unit.USDistanceUnits');

describe('os.unit.USDistanceUnits', function() {
  const Multiplier = goog.module.get('os.unit.Multiplier');
  const USDistanceUnits = goog.module.get('os.unit.USDistanceUnits');

  it('should function correctly', inject(function($rootScope) {
    var mult = new Multiplier('mi', 1, true, 'miles', .1);
    var eUnit = new USDistanceUnits();
    expect(eUnit.getTitle()).toBe('US');
    expect(eUnit.getUnitType()).toBe(os.unit.UNIT_TYPE_DISTANCE);
    expect(eUnit.getSystem()).toBe('us');
    expect(eUnit.getDefaultMultiplier()).toEqual(mult);
    expect(eUnit.getConversionFactor()).toBe(1 / 1609.3472);
    expect(eUnit.getSuffix()).toBe('');
    expect(eUnit.getMultipliers().length).toEqual(4);
    expect(eUnit.getMultiplier('yards').getMultiplier()).toBe(1 / 1760.0);
  }));
});

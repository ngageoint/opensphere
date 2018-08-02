goog.require('os.unit.EnglishDistanceUnits');
goog.require('os.unit.Multiplier');

describe('os.unit.EnglishDistanceUnits', function() {
  it('should function correctly', inject(function($rootScope) {
    var mult = new os.unit.Multiplier('mi', 1, true, 'miles', .1);
    var eUnit = new os.unit.EnglishDistanceUnits();
    expect(eUnit.getTitle()).toBe('Imperial');
    expect(eUnit.getUnitType()).toBe(os.unit.UNIT_TYPE_DISTANCE);
    expect(eUnit.getSystem()).toBe(os.unit.unitSystem.ENGLISH);
    expect(eUnit.getDefaultMultiplier()).toEqual(mult);
    expect(eUnit.getConversionFactor()).toBe(1 / 1609.344);
    expect(eUnit.getSuffix()).toBe('');
    expect(eUnit.getMultipliers().length).toEqual(4);
    expect(eUnit.getMultiplier('yards').getMultiplier()).toBe(1 / 1760.0);
  }));
});

goog.require('os.unit');
goog.require('os.unit.EnglishDistanceUnits');
goog.require('os.unit.Multiplier');

describe('os.unit.EnglishDistanceUnits', function() {
  const {default: Multiplier} = goog.module.get('os.unit.Multiplier');
  const {default: EnglishDistanceUnits} = goog.module.get('os.unit.EnglishDistanceUnits');
  const {UNIT_TYPE_DISTANCE, UnitSystem} = goog.module.get('os.unit');

  it('should function correctly', inject(function($rootScope) {
    var mult = new Multiplier('mi', 1, true, 'miles', .1);
    var eUnit = new EnglishDistanceUnits();
    expect(eUnit.getTitle()).toBe('Imperial');
    expect(eUnit.getUnitType()).toBe(UNIT_TYPE_DISTANCE);
    expect(eUnit.getSystem()).toBe(UnitSystem.ENGLISH);
    expect(eUnit.getDefaultMultiplier()).toEqual(mult);
    expect(eUnit.getConversionFactor()).toBe(1 / 1609.344);
    expect(eUnit.getSuffix()).toBe('');
    expect(eUnit.getMultipliers().length).toEqual(4);
    expect(eUnit.getMultiplier('yards').getMultiplier()).toBe(1 / 1760.0);
  }));
});

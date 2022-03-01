goog.require('os.unit');
goog.require('os.unit.Multiplier');
goog.require('os.unit.NauticalUnits');

describe('os.unit.NauticalUnits', function() {
  const {default: Multiplier} = goog.module.get('os.unit.Multiplier');
  const {default: NauticalUnits} = goog.module.get('os.unit.NauticalUnits');
  const {UNIT_TYPE_DISTANCE, UnitSystem} = goog.module.get('os.unit');

  it('should function correctly', inject(function($rootScope) {
    var mult = new Multiplier('nmi', 1, true, 'nautical miles');
    var eUnit = new NauticalUnits();
    expect(eUnit.getTitle()).toBe('Nautical');
    expect(eUnit.getUnitType()).toBe(UNIT_TYPE_DISTANCE);
    expect(eUnit.getSystem()).toBe(UnitSystem.NAUTICAL);
    expect(eUnit.getDefaultMultiplier()).toEqual(mult);
    expect(eUnit.getConversionFactor()).toBe(1 / 1852.0);
    expect(eUnit.getSuffix()).toBe('');
    expect(eUnit.getMultipliers().length).toEqual(2);
    expect(eUnit.getMultiplier('feet').getMultiplier()).toBe(1 / 6076.0);
  }));
});

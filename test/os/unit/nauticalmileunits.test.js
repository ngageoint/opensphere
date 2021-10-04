goog.require('os.unit');
goog.require('os.unit.Multiplier');
goog.require('os.unit.NauticalMileUnits');

describe('os.unit.NauticalMileUnits', function() {
  const {default: Multiplier} = goog.module.get('os.unit.Multiplier');
  const {default: NauticalMileUnits} = goog.module.get('os.unit.NauticalMileUnits');
  const {UNIT_TYPE_DISTANCE, UnitSystem} = goog.module.get('os.unit');

  it('should function correctly', inject(function($rootScope) {
    var mult = new Multiplier('nmi', 1, true, 'nautical miles');
    var eUnit = new NauticalMileUnits();
    expect(eUnit.getTitle()).toBe('Nautical Miles Only');
    expect(eUnit.getUnitType()).toBe(UNIT_TYPE_DISTANCE);
    expect(eUnit.getSystem()).toBe(UnitSystem.NAUTICALMILE);
    expect(eUnit.getDefaultMultiplier()).toEqual(mult);
    expect(eUnit.getConversionFactor()).toBe(1 / 1852.0);
    expect(eUnit.getSuffix()).toBe('');
    expect(eUnit.getMultipliers().length).toEqual(1);
    expect(eUnit.getMultiplier('feet')).toBe(undefined);
  }));
});

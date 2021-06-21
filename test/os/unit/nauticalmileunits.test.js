goog.require('os.unit.Multiplier');
goog.require('os.unit.NauticalMileUnits');

describe('os.unit.NauticalMileUnits', function() {
  const Multiplier = goog.module.get('os.unit.Multiplier');
  const NauticalMileUnits = goog.module.get('os.unit.NauticalMileUnits');

  it('should function correctly', inject(function($rootScope) {
    var mult = new Multiplier('nmi', 1, true, 'nautical miles');
    var eUnit = new NauticalMileUnits();
    expect(eUnit.getTitle()).toBe('Nautical Miles Only');
    expect(eUnit.getUnitType()).toBe(os.unit.UNIT_TYPE_DISTANCE);
    expect(eUnit.getSystem()).toBe(os.unit.unitSystem.NAUTICALMILE);
    expect(eUnit.getDefaultMultiplier()).toEqual(mult);
    expect(eUnit.getConversionFactor()).toBe(1 / 1852.0);
    expect(eUnit.getSuffix()).toBe('');
    expect(eUnit.getMultipliers().length).toEqual(1);
    expect(eUnit.getMultiplier('feet')).toBe(undefined);
  }));
});

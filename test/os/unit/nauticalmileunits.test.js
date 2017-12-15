goog.require('os.unit.Multiplier');
goog.require('os.unit.NauticalMileUnits');

describe('os.unit.NauticalMileUnits', function() {
  it('should function correctly', inject(function($rootScope) {
    var mult = new os.unit.Multiplier('nmi', 1, true, 'nautical miles');
    var eUnit = new os.unit.NauticalMileUnits();
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

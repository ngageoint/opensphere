goog.require('os.unit.FeetUnits');
goog.require('os.unit.Multiplier');

describe('os.unit.FeetUnits', function() {
  const Multiplier = goog.module.get('os.unit.Multiplier');
  const FeetUnits = goog.module.get('os.unit.FeetUnits');

  it('should function correctly', inject(function($rootScope) {
    var mult = new Multiplier('ft', 1, true, 'feet');
    var eUnit = new FeetUnits();
    expect(eUnit.getTitle()).toBe('Feet Only');
    expect(eUnit.getUnitType()).toBe(os.unit.UNIT_TYPE_DISTANCE);
    expect(eUnit.getSystem()).toBe(os.unit.unitSystem.FEET);
    expect(eUnit.getDefaultMultiplier()).toEqual(mult);
    expect(eUnit.getConversionFactor()).toBe(3.28084);
    expect(eUnit.getSuffix()).toBe('');
    expect(eUnit.getMultipliers().length).toEqual(1);
    expect(eUnit.getMultiplier('m')).toBe(undefined);
  }));
});

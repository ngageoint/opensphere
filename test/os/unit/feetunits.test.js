goog.require('os.unit');
goog.require('os.unit.FeetUnits');
goog.require('os.unit.Multiplier');

describe('os.unit.FeetUnits', function() {
  const Multiplier = goog.module.get('os.unit.Multiplier');
  const FeetUnits = goog.module.get('os.unit.FeetUnits');
  const {UNIT_TYPE_DISTANCE, UnitSystem} = goog.module.get('os.unit');

  it('should function correctly', inject(function($rootScope) {
    var mult = new Multiplier('ft', 1, true, 'feet');
    var eUnit = new FeetUnits();
    expect(eUnit.getTitle()).toBe('Feet Only');
    expect(eUnit.getUnitType()).toBe(UNIT_TYPE_DISTANCE);
    expect(eUnit.getSystem()).toBe(UnitSystem.FEET);
    expect(eUnit.getDefaultMultiplier()).toEqual(mult);
    expect(eUnit.getConversionFactor()).toBe(3.28084);
    expect(eUnit.getSuffix()).toBe('');
    expect(eUnit.getMultipliers().length).toEqual(1);
    expect(eUnit.getMultiplier('m')).toBe(undefined);
  }));
});

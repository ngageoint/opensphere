goog.require('os.unit.Multiplier');
goog.require('os.unit.YardUnits');

describe('os.unit.YardUnits', function() {
  it('should function correctly', inject(function($rootScope) {
    var mult = new os.unit.Multiplier('yd', 1, true, 'yards');
    var eUnit = new os.unit.YardUnits();
    expect(eUnit.getTitle()).toBe('Yards Only');
    expect(eUnit.getUnitType()).toBe(os.unit.UNIT_TYPE_DISTANCE);
    expect(eUnit.getSystem()).toBe(os.unit.unitSystem.YARD);
    expect(eUnit.getDefaultMultiplier()).toEqual(mult);
    expect(eUnit.getConversionFactor()).toBe(1.09361);
    expect(eUnit.getSuffix()).toBe('');
    expect(eUnit.getMultipliers().length).toEqual(1);
    expect(eUnit.getMultiplier('m')).toBe(undefined);
  }));
});

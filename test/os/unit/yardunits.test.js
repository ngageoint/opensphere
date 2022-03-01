goog.require('os.unit');
goog.require('os.unit.Multiplier');
goog.require('os.unit.YardUnits');

describe('os.unit.YardUnits', function() {
  const {default: Multiplier} = goog.module.get('os.unit.Multiplier');
  const {default: YardUnits} = goog.module.get('os.unit.YardUnits');
  const {UNIT_TYPE_DISTANCE, UnitSystem} = goog.module.get('os.unit');

  it('should function correctly', inject(function($rootScope) {
    var mult = new Multiplier('yd', 1, true, 'yards');
    var eUnit = new YardUnits();
    expect(eUnit.getTitle()).toBe('Yards Only');
    expect(eUnit.getUnitType()).toBe(UNIT_TYPE_DISTANCE);
    expect(eUnit.getSystem()).toBe(UnitSystem.YARD);
    expect(eUnit.getDefaultMultiplier()).toEqual(mult);
    expect(eUnit.getConversionFactor()).toBe(1.09361);
    expect(eUnit.getSuffix()).toBe('');
    expect(eUnit.getMultipliers().length).toEqual(1);
    expect(eUnit.getMultiplier('m')).toBe(undefined);
  }));
});

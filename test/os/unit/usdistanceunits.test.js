goog.require('os.unit');
goog.require('os.unit.Multiplier');
goog.require('os.unit.USDistanceUnits');

describe('os.unit.USDistanceUnits', function() {
  const {default: Multiplier} = goog.module.get('os.unit.Multiplier');
  const {default: USDistanceUnits} = goog.module.get('os.unit.USDistanceUnits');
  const {UNIT_TYPE_DISTANCE} = goog.module.get('os.unit');

  it('should function correctly', inject(function($rootScope) {
    var mult = new Multiplier('mi', 1, true, 'miles', .1);
    var eUnit = new USDistanceUnits();
    expect(eUnit.getTitle()).toBe('US');
    expect(eUnit.getUnitType()).toBe(UNIT_TYPE_DISTANCE);
    expect(eUnit.getSystem()).toBe('us');
    expect(eUnit.getDefaultMultiplier()).toEqual(mult);
    expect(eUnit.getConversionFactor()).toBe(1 / 1609.3472);
    expect(eUnit.getSuffix()).toBe('');
    expect(eUnit.getMultipliers().length).toEqual(4);
    expect(eUnit.getMultiplier('yards').getMultiplier()).toBe(1 / 1760.0);
  }));
});

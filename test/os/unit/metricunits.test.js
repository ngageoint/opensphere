goog.require('os.unit');
goog.require('os.unit.MetricUnits');
goog.require('os.unit.Multiplier');

describe('os.unit.MetricUnits', function() {
  const {default: Multiplier} = goog.module.get('os.unit.Multiplier');
  const {default: MetricUnits} = goog.module.get('os.unit.MetricUnits');
  const {UNIT_TYPE_DISTANCE, UnitSystem} = goog.module.get('os.unit');

  it('should function correctly', inject(function($rootScope) {
    var mult = new Multiplier('m', 1, true, 'meters');
    var eUnit = new MetricUnits();

    expect(eUnit.getTitle()).toBe('Metric');
    expect(eUnit.getUnitType()).toBe(UNIT_TYPE_DISTANCE);
    expect(eUnit.getSystem()).toBe(UnitSystem.METRIC);
    expect(eUnit.getDefaultMultiplier()).toEqual(mult);
    expect(eUnit.getConversionFactor()).toBe(1);
    expect(eUnit.getSuffix()).toBe('');
    expect(eUnit.getMultipliers().length).toEqual(12);
    expect(eUnit.getMultiplier('Hectometers').getMultiplier()).toBe(1E2);
    expect(eUnit.getMultiplier('Kilometers').getMultiplier()).toBe(1E3);
    expect(eUnit.getMultiplier('millimeters').getMultiplier()).toBe(1E-3);
    expect(eUnit.getMultiplier('micrometers').getMultiplier()).toBe(1E-6);
    expect(eUnit.getMultiplier('nanometers').getMultiplier()).toBe(1E-9);
  }));
});

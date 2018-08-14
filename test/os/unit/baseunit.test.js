goog.require('os.unit.BaseUnit');
goog.require('os.unit.Multiplier');
goog.require('os.unit.UnitManager');

describe('os.unit.BaseUnit', function() {
  it('should function correctly', inject(function($rootScope) {
    var name = 'min';
    var ratio = 1 / 60;
    var pi = 3.14159;
    var bestFit = true;
    var longName = 'minute';
    var mult = new os.unit.Multiplier(name, ratio, bestFit, longName);
    var baseUnit = new os.unit.BaseUnit();
    expect(baseUnit.getTitle()).toBeNull();
    expect(baseUnit.getUnitType()).toBeNull();
    expect(baseUnit.getSystem()).toBeNull();
    expect(baseUnit.getDefaultMultiplier()).toBeNull();
    expect(baseUnit.getConversionFactor()).toBe(-1);
    expect(baseUnit.getSuffix()).toBe('');
    expect(baseUnit.getMultipliers()).toEqual([]);
    expect(baseUnit.getMultiplier('feet')).toBe();
    expect(baseUnit.getLabel(mult)).toBe(name);
    expect(baseUnit.format(pi, mult)).toBe(pi + ' min');
    expect(baseUnit.format(pi, mult, 1)).toBe('3.1 min');
    expect(baseUnit.getBestFitMultiplier(mult)).toBeNull();
    expect(baseUnit.getIsBestFitCandidate(mult, 1, [])).toBe(bestFit);
    var testCoverage = new os.unit.IUnit();
  }));
});

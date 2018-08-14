goog.require('os.unit.Multiplier');

describe('os.unit.Multiplier', function() {
  it('should function correctly', inject(function($rootScope) {
    var name = 'min';
    var ratio = 1 / 60;
    var mult = new os.unit.Multiplier(name, ratio);
    expect(mult.getName()).toBe(name);
    expect(mult.getMultiplier()).toBe(ratio);
    expect(mult.getIsBestFitCandidate()).toBe(false);
    expect(mult.getLongName()).toBe(name);
    expect(mult.getThreshold()).toBe(1);

    name = 'hr';
    ratio = 60;
    var bestFit = true;
    var longName = 'hour';
    var thresh = .1;
    mult = new os.unit.Multiplier(name, ratio, bestFit, longName, thresh);
    expect(mult.getName()).toBe(name);
    expect(mult.getMultiplier()).toBe(ratio);
    expect(mult.getIsBestFitCandidate()).toBe(bestFit);
    expect(mult.getLongName()).toBe(longName);
    expect(mult.getThreshold()).toBe(.1);
    var testCoverage = new os.unit.IMultiplier();
  }));
});

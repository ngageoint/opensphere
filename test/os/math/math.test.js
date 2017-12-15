goog.require('os.math');

describe('os.math', function() {
  it('should find the max', function() {
    expect(os.math.max([])).toBe(null);
    expect(os.math.max([1])).toBe(1);
    expect(os.math.max([1, 2, 3])).toBe(3);
  });

  it('should find the min', function() {
    expect(os.math.min([])).toBe(null);
    expect(os.math.min([1])).toBe(1);
    expect(os.math.min([1, 2, 3])).toBe(1);
  });

  it('should find the range', function() {
    expect(os.math.range([])).toBe(null);

    // one value
    var r1 = os.math.range([1]);
    expect(r1.length).toBe(2);
    expect(r1[0]).toBe(1);
    expect(r1[1]).toBe(1);

    // many values
    var r2 = os.math.range([1, 2, 3, 4, 5]);
    expect(r2.length).toBe(2);
    expect(r2[0]).toBe(1);
    expect(r2[1]).toBe(5);
  });

  it('should find the precision', function() {
    // integers
    expect(os.math.precision(1)).toBe(0);

    // decimals
    expect(os.math.precision(12.34)).toBe(2);
    expect(os.math.precision(12.34567)).toBe(5);
    expect(os.math.precision(123456.7890)).toBe(3);

    // exponential notation
    expect(os.math.precision(1e-2)).toBe(2);
    expect(os.math.precision(1e-15)).toBe(15);

    // NaN/infinite
    expect(os.math.precision(Infinity)).toBe(0);
    expect(os.math.precision(-Infinity)).toBe(0);
    expect(os.math.precision(NaN)).toBe(0);
  });

  it('should parse numbers', function() {
    // null/undefined return NaN
    expect(isNaN(os.math.parseNumber(undefined))).toBe(true);
    expect(isNaN(os.math.parseNumber(null))).toBe(true);
    expect(isNaN(os.math.parseNumber(NaN))).toBe(true);

    // empty strings return NaN
    expect(isNaN(os.math.parseNumber(''))).toBe(true);
    expect(isNaN(os.math.parseNumber('       '))).toBe(true);

    // numbers return that value
    expect(os.math.parseNumber(-Infinity)).toBe(-Infinity);
    expect(os.math.parseNumber(Infinity)).toBe(Infinity);
    expect(os.math.parseNumber(5)).toBe(5);
    expect(os.math.parseNumber(-3.14)).toBe(-3.14);
    expect(os.math.parseNumber(1e5)).toBe(1e5);

    // strings with numeric values return that value, ignoring whitespace
    expect(os.math.parseNumber(' 5 ')).toBe(5);
    expect(os.math.parseNumber(' -3.14 ')).toBe(-3.14);
    expect(os.math.parseNumber(' 1e5 ')).toBe(1e5);
  });
});

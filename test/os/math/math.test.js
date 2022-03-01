goog.require('os.math');

describe('os.math', function() {
  const math = goog.module.get('os.math');

  it('should find the max', function() {
    expect(math.max([])).toBe(null);
    expect(math.max([1])).toBe(1);
    expect(math.max([1, 2, 3])).toBe(3);
  });

  it('should find the min', function() {
    expect(math.min([])).toBe(null);
    expect(math.min([1])).toBe(1);
    expect(math.min([1, 2, 3])).toBe(1);
  });

  it('should find the range', function() {
    expect(math.range([])).toBe(null);

    // one value
    var r1 = math.range([1]);
    expect(r1.length).toBe(2);
    expect(r1[0]).toBe(1);
    expect(r1[1]).toBe(1);

    // many values
    var r2 = math.range([1, 2, 3, 4, 5]);
    expect(r2.length).toBe(2);
    expect(r2[0]).toBe(1);
    expect(r2[1]).toBe(5);
  });

  it('should find the precision', function() {
    // integers
    expect(math.precision(1)).toBe(0);

    // decimals
    expect(math.precision(12.34)).toBe(2);
    expect(math.precision(12.34567)).toBe(5);
    expect(math.precision(123456.7890)).toBe(3);

    // exponential notation
    expect(math.precision(1e-2)).toBe(2);
    expect(math.precision(1e-15)).toBe(15);

    // NaN/infinite
    expect(math.precision(Infinity)).toBe(0);
    expect(math.precision(-Infinity)).toBe(0);
    expect(math.precision(NaN)).toBe(0);
  });

  it('should parse numbers', function() {
    // null/undefined return NaN
    expect(isNaN(math.parseNumber(undefined))).toBe(true);
    expect(isNaN(math.parseNumber(null))).toBe(true);
    expect(isNaN(math.parseNumber(NaN))).toBe(true);

    // empty strings return NaN
    expect(isNaN(math.parseNumber(''))).toBe(true);
    expect(isNaN(math.parseNumber('       '))).toBe(true);

    // numbers return that value
    expect(math.parseNumber(-Infinity)).toBe(-Infinity);
    expect(math.parseNumber(Infinity)).toBe(Infinity);
    expect(math.parseNumber(5)).toBe(5);
    expect(math.parseNumber(-3.14)).toBe(-3.14);
    expect(math.parseNumber(1e5)).toBe(1e5);

    // strings with numeric values return that value, ignoring whitespace
    expect(math.parseNumber(' 5 ')).toBe(5);
    expect(math.parseNumber(' -3.14 ')).toBe(-3.14);
    expect(math.parseNumber(' 1e5 ')).toBe(1e5);
  });
});

goog.require('os.math.Units');


describe('os.math.Units', function() {
  it('should convert meters to other units', function() {
    // implied meters
    expect(os.math.convertUnits(1000, os.math.Units.METERS)).toBe(1000);
    expect(os.math.convertUnits(1000, os.math.Units.KILOMETERS)).toBe(1);
    expect(os.math.convertUnits(1000, os.math.Units.MILES)).toBeCloseTo(0.62137, 5);
    expect(os.math.convertUnits(1000, os.math.Units.FEET)).toBe(3280.84);
    expect(os.math.convertUnits(1000, os.math.Units.NAUTICAL_MILES)).toBeCloseTo(0.53997, 5);

    // explicit meters
    expect(os.math.convertUnits(1000, os.math.Units.METERS, os.math.Units.METERS)).toBe(1000);
    expect(os.math.convertUnits(1000, os.math.Units.KILOMETERS, os.math.Units.METERS)).toBe(1);
    expect(os.math.convertUnits(1000, os.math.Units.MILES, os.math.Units.METERS)).toBeCloseTo(0.62137, 5);
    expect(os.math.convertUnits(1000, os.math.Units.FEET, os.math.Units.METERS)).toBe(3280.84);
    expect(os.math.convertUnits(1000, os.math.Units.NAUTICAL_MILES, os.math.Units.METERS))
        .toBeCloseTo(0.53997, 5);
  });

  it('should convert kilometers to other units', function() {
    expect(os.math.convertUnits(10, os.math.Units.METERS, os.math.Units.KILOMETERS)).toBe(10000);
    expect(os.math.convertUnits(10, os.math.Units.KILOMETERS, os.math.Units.KILOMETERS)).toBe(10);
    expect(os.math.convertUnits(10, os.math.Units.MILES, os.math.Units.KILOMETERS)).toBeCloseTo(6.2137, 4);
    expect(os.math.convertUnits(10, os.math.Units.FEET, os.math.Units.KILOMETERS)).toBe(32808.4);
    expect(os.math.convertUnits(10, os.math.Units.NAUTICAL_MILES, os.math.Units.KILOMETERS))
        .toBeCloseTo(5.39967, 5);
  });

  it('should convert miles to other units', function() {
    expect(os.math.convertUnits(10, os.math.Units.METERS, os.math.Units.MILES)).toBeCloseTo(16093.439, 3);
    expect(os.math.convertUnits(10, os.math.Units.KILOMETERS, os.math.Units.MILES)).toBeCloseTo(16.0934, 4);
    expect(os.math.convertUnits(10, os.math.Units.MILES, os.math.Units.MILES)).toBe(10);
    expect(os.math.convertUnits(10, os.math.Units.FEET, os.math.Units.MILES)).toBeCloseTo(52800, 1);
    expect(os.math.convertUnits(10, os.math.Units.NAUTICAL_MILES, os.math.Units.MILES)).toBeCloseTo(8.68993, 5);
  });

  it('should convert feet to other units', function() {
    expect(os.math.convertUnits(5280, os.math.Units.METERS, os.math.Units.FEET)).toBeCloseTo(1609.344, 3);
    expect(os.math.convertUnits(5280, os.math.Units.KILOMETERS, os.math.Units.FEET)).toBeCloseTo(1.6093, 4);
    expect(os.math.convertUnits(5280, os.math.Units.MILES, os.math.Units.FEET)).toBe(1);
    expect(os.math.convertUnits(5280, os.math.Units.FEET, os.math.Units.FEET)).toBe(5280);
    expect(os.math.convertUnits(5280, os.math.Units.NAUTICAL_MILES, os.math.Units.FEET)).toBeCloseTo(0.86899, 5);
  });

  it('should convert nautical miles to other units', function() {
    expect(os.math.convertUnits(10, os.math.Units.METERS, os.math.Units.NAUTICAL_MILES))
        .toBeCloseTo(18519.647, 3);
    expect(os.math.convertUnits(10, os.math.Units.KILOMETERS, os.math.Units.NAUTICAL_MILES))
        .toBeCloseTo(18.5196, 4);
    expect(os.math.convertUnits(10, os.math.Units.MILES, os.math.Units.NAUTICAL_MILES)).toBeCloseTo(11.5076, 4);
    expect(os.math.convertUnits(10, os.math.Units.FEET, os.math.Units.NAUTICAL_MILES)).toBeCloseTo(60760, 1);
    expect(os.math.convertUnits(10, os.math.Units.NAUTICAL_MILES, os.math.Units.NAUTICAL_MILES)).toBe(10);
  });

  it('should convert units to the same units', function() {
    expect(os.math.convertUnits(123.4567, os.math.Units.METERS)).toBe(123.4567);
    expect(os.math.convertUnits(123.4567, os.math.Units.KILOMETERS, os.math.Units.KILOMETERS)).toBe(123.4567);
    expect(os.math.convertUnits(123.4567, os.math.Units.MILES, os.math.Units.MILES)).toBe(123.4567);
    expect(os.math.convertUnits(123.4567, os.math.Units.FEET, os.math.Units.FEET)).toBe(123.4567);
    expect(os.math.convertUnits(123.4567, os.math.Units.NAUTICAL_MILES, os.math.Units.NAUTICAL_MILES))
        .toBe(123.4567);
  });

  it('should convert meters to other units and stringify the result', function() {
    // Test the boundaries (km to m)
    expect(os.math.stringifyUnits(100, os.math.Units.KILOMETERS)).toBe('0.100 km');
    expect(os.math.stringifyUnits(99, os.math.Units.KILOMETERS)).toBe('99.000 m');

    // Test the boundaries (mi to ft)
    expect(os.math.stringifyUnits(160.935, os.math.Units.MILES)).toBe('0.100 mi');
    expect(os.math.stringifyUnits(160.934, os.math.Units.MILES)).toBe('527.999 ft');

    // Test the boundaries (nm to ft)
    expect(os.math.stringifyUnits(185.3, os.math.Units.NAUTICAL_MILES)).toBe('0.100 nmi');
    expect(os.math.stringifyUnits(185.1, os.math.Units.NAUTICAL_MILES)).toBe('607.283 ft');
  });

  it('should convert numbers to a readable format', function() {
    expect(os.math.readableNumber(1000)).toBe('1.00k');
    expect(os.math.readableNumber(25012)).toBe('25.01k');
    expect(os.math.readableNumber(262100)).toBe('262.10k');

    expect(os.math.readableNumber(5543020)).toBe('5.54 Million');
    expect(os.math.readableNumber(10309032)).toBe('10.31 Million');

    expect(os.math.readableNumber(2034012437)).toBe('2.03 Billion');
    expect(os.math.readableNumber(650265340921)).toBe('650.27 Billion');
    expect(os.math.readableNumber(83031455092199)).toBe('83.03 Trillion');
  });
});

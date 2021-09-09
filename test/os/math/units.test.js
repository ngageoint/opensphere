goog.require('os.math');
goog.require('os.math.Units');


describe('os.math.Units', function() {
  const math = goog.module.get('os.math');
  const Units = goog.module.get('os.math.Units');

  it('should convert meters to other units', function() {
    // implied meters
    expect(math.convertUnits(1000, Units.METERS)).toBe(1000);
    expect(math.convertUnits(1000, Units.KILOMETERS)).toBe(1);
    expect(math.convertUnits(1000, Units.MILES)).toBeCloseTo(0.62137, 5);
    expect(math.convertUnits(1000, Units.FEET)).toBe(3280.84);
    expect(math.convertUnits(1000, Units.NAUTICAL_MILES)).toBeCloseTo(0.53997, 5);

    // explicit meters
    expect(math.convertUnits(1000, Units.METERS, Units.METERS)).toBe(1000);
    expect(math.convertUnits(1000, Units.KILOMETERS, Units.METERS)).toBe(1);
    expect(math.convertUnits(1000, Units.MILES, Units.METERS)).toBeCloseTo(0.62137, 5);
    expect(math.convertUnits(1000, Units.FEET, Units.METERS)).toBe(3280.84);
    expect(math.convertUnits(1000, Units.NAUTICAL_MILES, Units.METERS)).toBeCloseTo(0.53997, 5);
  });

  it('should convert kilometers to other units', function() {
    expect(math.convertUnits(10, Units.METERS, Units.KILOMETERS)).toBe(10000);
    expect(math.convertUnits(10, Units.KILOMETERS, Units.KILOMETERS)).toBe(10);
    expect(math.convertUnits(10, Units.MILES, Units.KILOMETERS)).toBeCloseTo(6.2137, 4);
    expect(math.convertUnits(10, Units.FEET, Units.KILOMETERS)).toBe(32808.4);
    expect(math.convertUnits(10, Units.NAUTICAL_MILES, Units.KILOMETERS)).toBeCloseTo(5.39967, 5);
  });

  it('should convert miles to other units', function() {
    expect(math.convertUnits(10, Units.METERS, Units.MILES)).toBeCloseTo(16093.439, 3);
    expect(math.convertUnits(10, Units.KILOMETERS, Units.MILES)).toBeCloseTo(16.0934, 4);
    expect(math.convertUnits(10, Units.MILES, Units.MILES)).toBe(10);
    expect(math.convertUnits(10, Units.FEET, Units.MILES)).toBeCloseTo(52800, 1);
    expect(math.convertUnits(10, Units.NAUTICAL_MILES, Units.MILES)).toBeCloseTo(8.68993, 5);
  });

  it('should convert feet to other units', function() {
    expect(math.convertUnits(5280, Units.METERS, Units.FEET)).toBeCloseTo(1609.344, 3);
    expect(math.convertUnits(5280, Units.KILOMETERS, Units.FEET)).toBeCloseTo(1.6093, 4);
    expect(math.convertUnits(5280, Units.MILES, Units.FEET)).toBe(1);
    expect(math.convertUnits(5280, Units.FEET, Units.FEET)).toBe(5280);
    expect(math.convertUnits(5280, Units.NAUTICAL_MILES, Units.FEET)).toBeCloseTo(0.86899, 5);
  });

  it('should convert nautical miles to other units', function() {
    expect(math.convertUnits(10, Units.METERS, Units.NAUTICAL_MILES)).toBeCloseTo(18519.647, 3);
    expect(math.convertUnits(10, Units.KILOMETERS, Units.NAUTICAL_MILES)).toBeCloseTo(18.5196, 4);
    expect(math.convertUnits(10, Units.MILES, Units.NAUTICAL_MILES)).toBeCloseTo(11.5076, 4);
    expect(math.convertUnits(10, Units.FEET, Units.NAUTICAL_MILES)).toBeCloseTo(60760, 1);
    expect(math.convertUnits(10, Units.NAUTICAL_MILES, Units.NAUTICAL_MILES)).toBe(10);
  });

  it('should convert units to the same units', function() {
    expect(math.convertUnits(123.4567, Units.METERS)).toBe(123.4567);
    expect(math.convertUnits(123.4567, Units.KILOMETERS, Units.KILOMETERS)).toBe(123.4567);
    expect(math.convertUnits(123.4567, Units.MILES, Units.MILES)).toBe(123.4567);
    expect(math.convertUnits(123.4567, Units.FEET, Units.FEET)).toBe(123.4567);
    expect(math.convertUnits(123.4567, Units.NAUTICAL_MILES, Units.NAUTICAL_MILES)).toBe(123.4567);
  });

  it('should convert meters to other units and stringify the result', function() {
    // Test the boundaries (km to m)
    expect(math.stringifyUnits(100, Units.KILOMETERS)).toBe('0.100 km');
    expect(math.stringifyUnits(99, Units.KILOMETERS)).toBe('99.000 m');

    // Test the boundaries (mi to ft)
    expect(math.stringifyUnits(160.935, Units.MILES)).toBe('0.100 mi');
    expect(math.stringifyUnits(160.934, Units.MILES)).toBe('527.999 ft');

    // Test the boundaries (nm to ft)
    expect(math.stringifyUnits(185.3, Units.NAUTICAL_MILES)).toBe('0.100 nmi');
    expect(math.stringifyUnits(185.1, Units.NAUTICAL_MILES)).toBe('607.283 ft');
  });

  it('should convert numbers to a readable format', function() {
    expect(math.readableNumber(1000)).toBe('1.00k');
    expect(math.readableNumber(25012)).toBe('25.01k');
    expect(math.readableNumber(262100)).toBe('262.10k');

    expect(math.readableNumber(5543020)).toBe('5.54 Million');
    expect(math.readableNumber(10309032)).toBe('10.31 Million');

    expect(math.readableNumber(2034012437)).toBe('2.03 Billion');
    expect(math.readableNumber(650265340921)).toBe('650.27 Billion');
    expect(math.readableNumber(83031455092199)).toBe('83.03 Trillion');
  });
});

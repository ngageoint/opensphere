goog.require('os.string');

describe('os.string', function() {
  it('should test boolean strings', function() {
    expect(os.string.isBoolean('true')).toBe(true);
    expect(os.string.isBoolean('TRUE')).toBe(true);
    expect(os.string.isBoolean('TrUe')).toBe(true);
    expect(os.string.isBoolean('false')).toBe(true);
    expect(os.string.isBoolean('FALSE')).toBe(true);
    expect(os.string.isBoolean('FaLsE')).toBe(true);

    expect(os.string.isBoolean('this is true')).toBe(false);
    expect(os.string.isBoolean('this is false')).toBe(false);
    expect(os.string.isBoolean('1')).toBe(false);
    expect(os.string.isBoolean('0')).toBe(false);
  });

  it('should test hex strings', function() {
    expect(os.string.isHex('123abc')).toBe(true);
    expect(os.string.isHex('123ABC')).toBe(true);
    expect(os.string.isHex('0x123abc')).toBe(true);
    expect(os.string.isHex('0x123ABC')).toBe(true);

    expect(os.string.isHex('123abz')).toBe(false);
    expect(os.string.isHex('0x123abz')).toBe(false);
  });

  it('should test float strings', function() {
    expect(os.string.isFloat('123abc')).toBe(false);
    expect(os.string.isFloat('1')).toBe(true);
    expect(os.string.isFloat('-1')).toBe(true);
    expect(os.string.isFloat('+1')).toBe(true);
    expect(os.string.isFloat('-1.')).toBe(true);
    expect(os.string.isFloat('-1.5')).toBe(true);
    expect(os.string.isFloat('-1.56')).toBe(true);
    expect(os.string.isFloat('2E')).toBe(false);
    expect(os.string.isFloat('2E+')).toBe(false);
    expect(os.string.isFloat('2E+5')).toBe(true);
    expect(os.string.isFloat('2.5E+5')).toBe(true);
    expect(os.string.isFloat('2.5E-5')).toBe(true);
  });

  it('should test split', function() {
    var v1 = 'a,b,c';
    var r1 = os.string.split(v1);
    expect(r1.length).toBe(3);
    expect(r1[0]).toBe('a');
    expect(r1[1]).toBe('b');
    expect(r1[2]).toBe('c');

    var v2 = 'a, b, c';
    var r2 = os.string.split(v2);
    expect(r2.length).toBe(3);
    expect(r2[0]).toBe('a');
    expect(r2[1]).toBe(' b');
    expect(r2[2]).toBe(' c');

    r2 = os.string.split(v2, true);
    expect(r2.length).toBe(3);
    expect(r2[0]).toBe('a');
    expect(r2[1]).toBe('b');
    expect(r2[2]).toBe('c');

    var v3 = 'a b c';
    var r3 = os.string.split(v3, true);
    expect(r3.length).toBe(3);
    expect(r3[0]).toBe('a');
    expect(r3[1]).toBe('b');
    expect(r3[2]).toBe('c');

    var v4 = 'a,b;c\td,e;f;g\th';
    var r4 = os.string.split(v4);
    expect(r4.length).toBe(3);
    expect(r4[0]).toBe('a');
    expect(r4[1]).toBe('b;c\td');
    expect(r4[2]).toBe('e;f;g\th');

    r4 = os.string.split(v4, false, ['\t', ',']);
    expect(r4.length).toBe(3);
    expect(r4[0]).toBe('a,b;c');
    expect(r4[1]).toBe('d,e;f;g');
    expect(r4[2]).toBe('h');
  });
});

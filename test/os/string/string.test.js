goog.require('os.string');

describe('os.string', function() {
  const osString = goog.module.get('os.string');

  it('should test boolean strings', function() {
    expect(osString.isBoolean('true')).toBe(true);
    expect(osString.isBoolean('TRUE')).toBe(true);
    expect(osString.isBoolean('TrUe')).toBe(true);
    expect(osString.isBoolean('false')).toBe(true);
    expect(osString.isBoolean('FALSE')).toBe(true);
    expect(osString.isBoolean('FaLsE')).toBe(true);

    expect(osString.isBoolean('this is true')).toBe(false);
    expect(osString.isBoolean('this is false')).toBe(false);
    expect(osString.isBoolean('1')).toBe(false);
    expect(osString.isBoolean('0')).toBe(false);
  });

  it('should test hex strings', function() {
    expect(osString.isHex('123abc')).toBe(true);
    expect(osString.isHex('123ABC')).toBe(true);
    expect(osString.isHex('0x123abc')).toBe(true);
    expect(osString.isHex('0x123ABC')).toBe(true);

    expect(osString.isHex('123abz')).toBe(false);
    expect(osString.isHex('0x123abz')).toBe(false);
  });

  it('should test float strings', function() {
    expect(osString.isFloat('123abc')).toBe(false);
    expect(osString.isFloat('1')).toBe(true);
    expect(osString.isFloat('-1')).toBe(true);
    expect(osString.isFloat('+1')).toBe(true);
    expect(osString.isFloat('-1.')).toBe(true);
    expect(osString.isFloat('-1.5')).toBe(true);
    expect(osString.isFloat('-1.56')).toBe(true);
    expect(osString.isFloat('2E')).toBe(false);
    expect(osString.isFloat('2E+')).toBe(false);
    expect(osString.isFloat('2E+5')).toBe(true);
    expect(osString.isFloat('2.5E+5')).toBe(true);
    expect(osString.isFloat('2.5E-5')).toBe(true);
  });

  it('should test split', function() {
    var v1 = 'a,b,c';
    var r1 = osString.split(v1);
    expect(r1.length).toBe(3);
    expect(r1[0]).toBe('a');
    expect(r1[1]).toBe('b');
    expect(r1[2]).toBe('c');

    var v2 = 'a, b, c';
    var r2 = osString.split(v2);
    expect(r2.length).toBe(3);
    expect(r2[0]).toBe('a');
    expect(r2[1]).toBe(' b');
    expect(r2[2]).toBe(' c');

    r2 = osString.split(v2, true);
    expect(r2.length).toBe(3);
    expect(r2[0]).toBe('a');
    expect(r2[1]).toBe('b');
    expect(r2[2]).toBe('c');

    var v3 = 'a b c';
    var r3 = osString.split(v3, true);
    expect(r3.length).toBe(3);
    expect(r3[0]).toBe('a');
    expect(r3[1]).toBe('b');
    expect(r3[2]).toBe('c');

    var v4 = 'a,b;c\td,e;f;g\th';
    var r4 = osString.split(v4);
    expect(r4.length).toBe(3);
    expect(r4[0]).toBe('a');
    expect(r4[1]).toBe('b;c\td');
    expect(r4[2]).toBe('e;f;g\th');

    r4 = osString.split(v4, false, ['\t', ',']);
    expect(r4.length).toBe(3);
    expect(r4[0]).toBe('a,b;c');
    expect(r4[1]).toBe('d,e;f;g');
    expect(r4[2]).toBe('h');
  });

  it('should test removing duplicates', function() {
    var tests = [{
      original: 'abcabcabc',
      item: 'a',
      expected: 'bcbcabc'
    }, {
      original: '',
      item: 'whatever',
      expected: ''
    }, {
      original: null,
      item: 'whatever',
      expected: ''
    }, {
      original: 'whatever',
      item: null,
      expected: 'whatever'
    }, {
      original: 'whatever',
      item: 'bogus',
      expected: 'whatever'
    }, {
      original: 'abc',
      item: 'a',
      expected: 'abc'
    }, {
      original: 'onetwothreeonetwothree',
      item: 'two',
      expected: 'onethreeonetwothree'
    }];

    tests.forEach(function(test) {
      expect(osString.removeDuplicates(test.original, test.item)).toBe(test.expected);
    });
  });
});

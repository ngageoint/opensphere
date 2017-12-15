goog.require('os.uri');
goog.require('goog.Uri.QueryData');

describe('os.uri', function() {
  it('should resolve uri to local', function() {
    var localDomain = window.location.origin;
    expect(os.uri.addBase('/ogc/abc.png')).toBe(localDomain + '/ogc/abc.png');
    expect(os.uri.addBase('ogc/abc.png')).toBe(localDomain + '/ogc/abc.png');
    expect(os.uri.addBase('http://www.someother.com/ogc/abc.png'))
      .toBe('http://www.someother.com/ogc/abc.png');
    expect(os.uri.addBase('https://www.someother.com/ogc/abc.png'))
      .toBe('https://www.someother.com/ogc/abc.png');
  });

  it('should merge uri params', function() {
    var qd1 = new goog.Uri.QueryData('a=1&b=2&c=3&d=4&e=5');
    var qd2 = new goog.Uri.QueryData('A=2&B=3&C=4');
    os.uri.mergeParams(qd1, qd2);

    // test params from qd1 - it should *not* override params and keys should be case insensitive
    expect(qd2.get('a')).toBeUndefined();
    expect(qd2.get('b')).toBeUndefined();
    expect(qd2.get('c')).toBeUndefined();
    expect(qd2.get('d')).toBe('4');
    expect(qd2.get('e')).toBe('5');

    expect(qd2.get('A')).toBe('2');
    expect(qd2.get('B')).toBe('3');
    expect(qd2.get('C')).toBe('4');
  });

  it('should merge uri params with case insensitive overwrite', function() {
    var qd1 = new goog.Uri.QueryData('a=1&b=2&c=3&d=4&e=5');
    var qd2 = new goog.Uri.QueryData('A=2&B=3&C=4');
    os.uri.mergeParams(qd1, qd2, true);

    // test params from qd1 - overwritten params should keep their original case
    expect(qd2.get('a')).toBeUndefined();
    expect(qd2.get('b')).toBeUndefined();
    expect(qd2.get('c')).toBeUndefined();
    expect(qd2.get('d')).toBe('4');
    expect(qd2.get('e')).toBe('5');

    expect(qd2.get('A')).toBe('1');
    expect(qd2.get('B')).toBe('2');
    expect(qd2.get('C')).toBe('3');
  });

  it('should get a parameterized version of the current URI', function() {
    var loc = window.location.toString().split('?')[0];

    var qd1 = new goog.Uri.QueryData('a=1&b=2&c=3&d=4&e=5');
    var uri1 = os.uri.getParamUri(qd1);
    var parts = uri1.split('?');
    expect(parts[0]).toBe(loc);
    expect(parts[1]).toBe(qd1.toString());

    var qd2 = new goog.Uri.QueryData('A=2&B=3&C=4');
    var uri2 = os.uri.getParamUri(qd2);
    parts = uri2.split('?');
    expect(parts[0]).toBe(loc);
    expect(parts[1]).toBe(qd2.toString());
  });
});

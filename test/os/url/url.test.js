goog.require('goog.Uri.QueryData');
goog.require('os.url');


describe('os.url', function() {
  const QueryData = goog.module.get('goog.Uri.QueryData');
  const {
    URL_REGEXP,
    URL_SCHEME_REGEXP,
    hasUrlScheme,
    isUrl,
    queryDataToObject
  } = goog.module.get('os.url');

  it('should match URL schemes properly', function() {
    var url = 'barf';
    expect(URL_SCHEME_REGEXP.test(url)).toBe(false);
    expect(hasUrlScheme(url)).toBe(false);
    url = 'file://barf.com';
    expect(URL_SCHEME_REGEXP.test(url)).toBe(false);
    expect(hasUrlScheme(url)).toBe(false);
    url = 'URL: http://barf.com';
    expect(URL_SCHEME_REGEXP.test(url)).toBe(false);
    expect(hasUrlScheme(url)).toBe(false);

    url = 'http://barf.com';
    expect(URL_SCHEME_REGEXP.test(url)).toBe(true);
    expect(hasUrlScheme(url)).toBe(true);
    url = 'https://barf.com';
    expect(URL_SCHEME_REGEXP.test(url)).toBe(true);
    expect(hasUrlScheme(url)).toBe(true);
    url = 'ftp://barf.com';
    expect(URL_SCHEME_REGEXP.test(url)).toBe(true);
    expect(hasUrlScheme(url)).toBe(true);
  });

  it('should match URLs properly', function() {
    var url = 'barf';
    expect(URL_REGEXP.test(url)).toBe(false);
    expect(isUrl(url)).toBe(false);
    url = 'http://barf.com';
    expect(URL_REGEXP.test(url)).toBe(true);
    expect(isUrl(url)).toBe(true);
    url = 'http://barf.com%28parens%29';
    expect(URL_REGEXP.test(url)).toBe(true);
    expect(isUrl(url)).toBe(true);
    url = 'http://barf.com/(parentheses)';
    expect(URL_REGEXP.test(url)).toBe(true);
    expect(isUrl(url)).toBe(true);
  });

  it('should convert QueryData objects to a map', function() {
    var qd = null;

    // null QueryData reference
    var obj = queryDataToObject(qd);
    expect(obj).toBeDefined();
    expect(goog.object.isEmpty(obj)).toBe(true);

    qd = new QueryData('TEST1=a&TEST2=a,b,c&TEST3=');
    obj = queryDataToObject(qd);
    expect(obj).toBeDefined();
    expect(goog.object.getCount(obj)).toBe(3);

    // single value
    expect(obj.TEST1).toBe('a');

    // multiple values
    expect(obj.TEST2).toBe('a,b,c');

    // no value
    expect(obj.TEST3).toBe('');

    // can provide the object to store key/value pairs
    var otherObj = {};
    obj = queryDataToObject(qd, otherObj);
    expect(obj).toBe(otherObj);
  });
});

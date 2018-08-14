goog.require('os.url');
goog.require('goog.Uri.QueryData');


describe('os.url', function() {
  it('should match URLs properly', function() {
    var url = 'barf';
    expect(os.url.URL_REGEXP.test(url)).not.toBe(true);
    url = 'http://barf.com';
    expect(os.url.URL_REGEXP.test(url)).toBe(true);
    url = 'http://barf.com%28parens%29';
    expect(os.url.URL_REGEXP.test(url)).toBe(true);
    url = 'http://barf.com/(parentheses)';
    expect(os.url.URL_REGEXP.test(url)).toBe(true);
  });

  it('should convert QueryData objects to a map', function() {
    var qd = null;

    // null QueryData reference
    var obj = os.url.queryDataToObject(qd);
    expect(obj).toBeDefined();
    expect(goog.object.isEmpty(obj)).toBe(true);

    qd = new goog.Uri.QueryData('TEST1=a&TEST2=a,b,c&TEST3=');
    obj = os.url.queryDataToObject(qd);
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
    obj = os.url.queryDataToObject(qd, otherObj);
    expect(obj).toBe(otherObj);
  });
});

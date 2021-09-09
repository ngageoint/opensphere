goog.require('goog.Uri.QueryData');
goog.require('os.url');


describe('os.url', function() {
  const QueryData = goog.module.get('goog.Uri.QueryData');
  const osUrl = goog.module.get('os.url');

  it('should match URLs properly', function() {
    var url = 'barf';
    expect(osUrl.URL_REGEXP.test(url)).not.toBe(true);
    url = 'http://barf.com';
    expect(osUrl.URL_REGEXP.test(url)).toBe(true);
    url = 'http://barf.com%28parens%29';
    expect(osUrl.URL_REGEXP.test(url)).toBe(true);
    url = 'http://barf.com/(parentheses)';
    expect(osUrl.URL_REGEXP.test(url)).toBe(true);
  });

  it('should convert QueryData objects to a map', function() {
    var qd = null;

    // null QueryData reference
    var obj = osUrl.queryDataToObject(qd);
    expect(obj).toBeDefined();
    expect(goog.object.isEmpty(obj)).toBe(true);

    qd = new QueryData('TEST1=a&TEST2=a,b,c&TEST3=');
    obj = osUrl.queryDataToObject(qd);
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
    obj = osUrl.queryDataToObject(qd, otherObj);
    expect(obj).toBe(otherObj);
  });
});

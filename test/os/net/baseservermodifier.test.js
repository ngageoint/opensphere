goog.require('os.net.BaseServerModifier');


describe('os.net.BaseServerModifier', function() {
  it('should not modify if not configured', function() {
    var mod = new os.net.BaseServerModifier();

    // set no replacements
    os.net.BaseServerModifier.configure();

    var expectedString = 'http://example.com/path/to/thing?someQuery=text%20with%20%25%20spaces#someFragment';
    var uri = new goog.Uri(expectedString);

    mod.modify(uri);
    expect(uri.toString()).toBe(expectedString);
  });

  it('should not modify if is an absolute path', function() {
    var mod = new os.net.BaseServerModifier();
    var server = 'http://example.com';

    // set a replacement
    os.net.BaseServerModifier.configure(server);

    var expectedString = 'http://example2.com/path/to/thing?someQuery=text%20with%20%25%20spaces#someFragment';
    var uri = new goog.Uri(expectedString);

    mod.modify(uri);
    expect(uri.toString()).toBe(expectedString);
    os.net.BaseServerModifier.configure();
  });

  it('should modify relative services requests', function() {
    var mod = new os.net.BaseServerModifier();
    var server = 'http://example.com';

    // set a replacement
    os.net.BaseServerModifier.configure(server);

    var relativeString = '/path/to/thing?someQuery=text%20with%20%25%20spaces#someFragment';
    var uri = new goog.Uri(relativeString);

    mod.modify(uri);
    expect(uri.toString()).toBe(server + relativeString);
    os.net.BaseServerModifier.configure();
  });

  it('should not modify relative application requests', function() {
    var mod = new os.net.BaseServerModifier();
    var server = 'http://example.com';

    // set a replacement
    os.net.BaseServerModifier.configure(server);

    var relativeString = 'path/to/thing.js';
    var uri = new goog.Uri(relativeString);

    mod.modify(uri);
    expect(uri.toString()).toBe(relativeString);
    os.net.BaseServerModifier.configure();
  });

  it('should remove https and trailling /', function() {
    expect('example.com'.replace(os.net.BaseServerExpression, '$2')).toBe('example.com');
    expect('https://example.com'.replace(os.net.BaseServerExpression, '$2')).toBe('example.com');
    expect('https://example.com/'.replace(os.net.BaseServerExpression, '$2')).toBe('example.com');
  });
});

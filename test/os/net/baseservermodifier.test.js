goog.require('goog.Uri');
goog.require('os.net.BaseServerModifier');
goog.require('os.net.URLModifier');


describe('os.net.BaseServerModifier', function() {
  const Uri = goog.module.get('goog.Uri');
  const BaseServerModifier = goog.module.get('os.net.BaseServerModifier');
  const URLModifier = goog.module.get('os.net.URLModifier');

  it('should not modify if not configured', function() {
    var mod = new URLModifier();

    // set no replacements
    BaseServerModifier.configure();

    var expectedString = 'http://example.com/path/to/thing?someQuery=text%20with%20%25%20spaces#someFragment';
    var uri = new Uri(expectedString);

    mod.modify(uri);
    expect(uri.toString()).toBe(expectedString);
  });

  it('should not modify if is an absolute path', function() {
    var mod = new URLModifier();
    var server = 'http://example.com';

    // set a replacement
    BaseServerModifier.configure(server);

    var expectedString = 'http://example2.com/path/to/thing?someQuery=text%20with%20%25%20spaces#someFragment';
    var uri = new Uri(expectedString);

    mod.modify(uri);
    expect(uri.toString()).toBe(expectedString);
    URLModifier.configure();
  });

  it('should not modify scheme-relative URLs', function() {
    var mod = new URLModifier();
    var server = 'http://example.com';

    // set a replacement
    BaseServerModifier.configure(server);

    var expectedString = '//example2.com/path/to/thing?someQuery=text%20with%20%25%20spaces#someFragment';
    var uri = new Uri(expectedString);

    mod.modify(uri);
    expect(uri.toString()).toBe(expectedString);
    URLModifier.configure();
  });

  it('should modify relative services requests', function() {
    var mod = new URLModifier();
    var server = 'http://example.com';

    // set a replacement
    BaseServerModifier.configure(server);

    var relativeString = '/path/to/thing?someQuery=text%20with%20%25%20spaces#someFragment';
    var uri = new Uri(relativeString);

    mod.modify(uri);
    expect(uri.toString()).toBe(server + relativeString);
    BaseServerModifier.configure();
  });

  it('should not modify relative application requests', function() {
    var mod = new URLModifier();
    var server = 'http://example.com';

    // set a replacement
    BaseServerModifier.configure(server);

    var relativeString = 'path/to/thing.js';
    var uri = new Uri(relativeString);

    mod.modify(uri);
    expect(uri.toString()).toBe(relativeString);
    BaseServerModifier.configure();
  });
});

goog.require('goog.Uri');
goog.require('os.net.URLModifier');


describe('os.net.URLModifier', function() {
  const Uri = goog.module.get('goog.Uri');
  const {default: URLModifier} = goog.module.get('os.net.URLModifier');

  afterEach(() => {
    URLModifier.replace_.length = 0;
  });

  it('should not modify without replacements', function() {
    var mod = new URLModifier();

    // set no replacements
    URLModifier.configure();

    var expectedString = 'http://example.com/path/to/thing?someQuery=text%20with%20%25%20spaces#someFragment';
    var uri = new Uri(expectedString);

    mod.modify(uri);
    expect(uri.toString()).toBe(expectedString);
  });

  it('should not modify without matching replacements', function() {
    var mod = new URLModifier();

    // set a replacement
    URLModifier.configure({
      '{needle}': 'tada!'
    });

    var expectedString = 'http://example.com/path/to/thing?someQuery=text%20with%20%25%20spaces#someFragment';
    var uri = new Uri(expectedString);

    mod.modify(uri);
    expect(uri.toString()).toBe(expectedString);
  });

  it('should replace matches', function() {
    var mod = new URLModifier();

    // set a replacement
    URLModifier.configure({
      '{needle}': 'tada'
    });

    var expectedString = 'http://example.com/path/to/thing?someQuery=text%20with%20%25%20spaces&special=%7Bneedle%7D#someFragment';
    var uri = new Uri(expectedString);

    mod.modify(uri);
    expect(uri.toString()).toContain('&special=tada');
  });

  it('should replace matches with mixed encoding in the URL', function() {
    var mod = new URLModifier();

    // set a replacement
    URLModifier.configure({
      '{needle}': 'tada'
    });

    var expectedString = 'http://example.com/path/to/thing?someQuery=text%20with%20%25%20spaces&special={needle}#someFragment';
    var uri = new Uri(expectedString);

    mod.modify(uri);
    expect(uri.toString()).toContain('&special=tada');
  });
});

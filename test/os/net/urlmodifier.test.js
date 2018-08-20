goog.require('os.net.URLModifier');


describe('os.net.URLModifier', function() {
  it('should not modify without replacements', function() {
    var mod = new os.net.URLModifier();

    // set no replacements
    os.net.URLModifier.configure();

    var expectedString = 'http://example.com/path/to/thing?someQuery=text%20with%20%25%20spaces#someFragment';
    var uri = new goog.Uri(expectedString);

    mod.modify(uri);
    expect(uri.toString()).toBe(expectedString);
  });

  it('should not modify without matching replacements', function() {
    var mod = new os.net.URLModifier();

    // set a replacement
    os.net.URLModifier.configure({
      '{needle}': 'tada!'
    });

    var expectedString = 'http://example.com/path/to/thing?someQuery=text%20with%20%25%20spaces#someFragment';
    var uri = new goog.Uri(expectedString);

    mod.modify(uri);
    expect(uri.toString()).toBe(expectedString);
  });

  it('should replace matches', function() {
    var mod = new os.net.URLModifier();

    // set a replacement
    os.net.URLModifier.configure({
      '{needle}': 'tada'
    });

    var expectedString = 'http://example.com/path/to/thing?someQuery=text%20with%20%25%20spaces&special=%7Bneedle%7D#someFragment';
    var uri = new goog.Uri(expectedString);

    mod.modify(uri);
    expect(uri.toString()).toContain('&special=tada');
  });

  it('should replace matches with mixed encoding in the URL', function() {
    var mod = new os.net.URLModifier();

    // set a replacement
    os.net.URLModifier.configure({
      '{needle}': 'tada'
    });

    var expectedString = 'http://example.com/path/to/thing?someQuery=text%20with%20%25%20spaces&special={needle}#someFragment';
    var uri = new goog.Uri(expectedString);

    mod.modify(uri);
    expect(uri.toString()).toContain('&special=tada');
  });
});

goog.require('os.ui.text.transformer.DashesTransformer');


describe('os.ui.text.transform.Dashes', function() {
  const dashesTransformer = os.ui.text.transformer.DashesTransformer.getInstance();
  const standard = 'abcdefghijklmnopqrstuvwxyz' +
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
    '0123456789' +
    '!@#$%^&*()+={}[]<>?/\\|`~-,. \'"';

  it('should handle empty strings', function() {
    const output = dashesTransformer.transform('');
    expect(output).toBe('');
  });

  it('shouldn\'t affect text without \\u2010 (hyphen) dashes', function() {
    const output = dashesTransformer.transform(standard);
    expect(output).toBe(standard);
  });

  it('should replace non-\\u2010 (hyphen) dashes with a hyphen', function() {
    const dashes = '\u002d\u058a\u05be\u2011\u2012\u2013\u2014\u2015\u2e3a\u2e3b\uff0d';
    const output = dashesTransformer.transform(standard + dashes);
    expect(output).toBe(standard + '-----------');
  });
});

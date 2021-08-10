goog.require('goog.Uri');
goog.require('os.net.FormEncFormatter');


describe('os.net.FormEncFormatter', function() {
  const Uri = goog.module.get('goog.Uri');
  const FormEncFormatter = goog.module.get('os.net.FormEncFormatter');

  it('should encode URIs', function() {
    // If this breaks, you've directly ignored the warning at the top of the class.
    // Revert your change and make your own formatter.
    var uri = new Uri('/formPost');
    uri.setParameterValue('string', 'abc123$%^');
    uri.setParameterValue('boolean', true);
    uri.setParameterValue('number', 3);

    var formatter = new FormEncFormatter();
    var payload = formatter.format(uri);

    expect(payload).toBe('string=abc123%24%25%5E&boolean=true&number=3');
    expect(uri.toString()).toBe('/formPost');
  });
});

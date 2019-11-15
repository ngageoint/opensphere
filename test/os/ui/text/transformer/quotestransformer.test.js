goog.require('os.ui.text.transformer.QuotesTransformer');


describe('os.ui.text.transform.Quotes', function() {
  const quotesTransformer = os.ui.text.transformer.QuotesTransformer.getInstance();
  const standard = 'abcdefghijklmnopqrstuvwxyz' +
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
    '0123456789' +
    '!@#$%^&*()+={}[]<>?/\\|`~-,. \'"';

  it('should handle empty strings', function() {
    const output = quotesTransformer.transform('');
    expect(output).toBe('');
  });

  it('shouldn\'t affect text without smart quotes', function() {
    const output = quotesTransformer.transform(standard);
    expect(output).toBe(standard);
  });

  it('should replace smart quotes with dumb quotes', function() {
    const quotesTransformer = os.ui.text.transformer.QuotesTransformer.getInstance();
    let input = '“' + standard + '”';
    let output = quotesTransformer.transform(input);
    expect(output).toBe('"' + standard + '"');
    input = '““' + standard + '””';
    output = quotesTransformer.transform(input);
    expect(output).toBe('""' + standard + '""');
  });
});

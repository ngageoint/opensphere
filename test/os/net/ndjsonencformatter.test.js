goog.require('goog.Uri');
goog.require('os.net.NDJsonEncFormatter');


describe('os.net.NDJsonEncFormatter', function() {
  const NDJsonEncFormatter = goog.module.get('os.net.NDJsonEncFormatter');

  it('should encode an array of json payloads with new lines', function() {
    var formatter = new NDJsonEncFormatter();
    formatter.setContent([
      {},
      {'testKey': 'testValue'},
      {},
      {'testKey2': 'testValue2'}
    ]);
    var payload = formatter.format();

    expect(payload).toBe('{}\n{"testKey":"testValue"}\n{}\n{"testKey2":"testValue2"}\n');
  });
});

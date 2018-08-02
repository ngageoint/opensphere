goog.require('os.net.NDJsonEncFormatter');
goog.require('goog.Uri');


describe('os.net.NDJsonEncFormatter', function() {
  it('should encode an array of json payloads with new lines', function() {
    var formatter = new os.net.NDJsonEncFormatter();
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

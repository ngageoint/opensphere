goog.require('os.file.File');
goog.require('os.file.mime.mock');
goog.require('plugin.tileserver.mime');

describe('plugin.tileserver.mime', function() {
  it('should detect tileserver responses', function() {
    var json = '  [{"format":"png","tilejson":"2.0.0"}] ';
    var buffer = new TextEncoder().encode(json);

    var file = new os.file.File();
    file.setUrl('http://something.com/index.json');

    var testFunc = os.file.mime.mock.testYes(plugin.tileserver.ID);
    testFunc(buffer, file);
  });

  it('should not detect other JSON', function() {
    var json = '  {type: "FeatureCollection"} ';
    var buffer = new TextEncoder().encode(json);

    var file = new os.file.File();
    file.setUrl('http://something.com/other.json');

    var testFunc = os.file.mime.mock.testNo(plugin.tileserver.ID);
    testFunc(buffer, file);
  });

  it('should register itself with mime detection', function() {
    var chain = os.file.mime.getTypeChain(plugin.tileserver.ID).join(', ');
    expect(chain).toBe('application/octet-stream, text/plain, text/xml, ' + plugin.tileserver.ID);
  });
});

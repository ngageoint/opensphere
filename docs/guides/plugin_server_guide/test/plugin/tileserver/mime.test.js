goog.require('os.file.File');
goog.require('os.file.mime');
goog.require('os.file.mime.mock');
goog.require('plugin.tileserver.mime');

describe('plugin.tileserver.mime', function() {
  const {default: OSFile} = goog.module.get('os.file.File');
  const {getTypeChain} = goog.module.get('os.file.mime');
  const {testNo, testYes} = goog.module.get('os.file.mime.mock');
  const {ID} = goog.module.get('plugin.tileserver');

  it('should detect tileserver responses', function() {
    var json = '  [{"format":"png","tilejson":"2.0.0"}] ';
    var buffer = new TextEncoder().encode(json);

    var file = new OSFile();
    file.setUrl('http://something.com/index.json');

    var testFunc = testYes(ID);
    testFunc(buffer, file);
  });

  it('should not detect other JSON', function() {
    var json = '  {type: "FeatureCollection"} ';
    var buffer = new TextEncoder().encode(json);

    var file = new OSFile();
    file.setUrl('http://something.com/other.json');

    var testFunc = testNo(ID);
    testFunc(buffer, file);
  });

  it('should register itself with mime detection', function() {
    var chain = getTypeChain(ID).join(', ');
    expect(chain).toBe('application/octet-stream, text/plain, text/xml, ' + ID);
  });
});

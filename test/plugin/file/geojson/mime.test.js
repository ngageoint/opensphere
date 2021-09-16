goog.require('os.file.File');
goog.require('os.file.mime');
goog.require('os.file.mime.mock');
goog.require('plugin.file.geojson.mime');

describe('os.file.mime.json', function() {
  const osFileMime = goog.module.get('os.file.mime');
  const mime = goog.module.get('plugin.file.geojson.mime');

  const mockMime = goog.module.get('os.file.mime.mock');

  it('should not detect files that are not json files', function() {
    mockMime.testFiles([
      '/base/test/plugin/file/kml/kml_test.xml',
      '/base/test/resources/bin/rand.bin',
      '/base/test/resources/json/partial_object.json'
    ], mockMime.testNo(mime.TYPE));
  });

  it('should detect files that are json files', function() {
    mockMime.testFiles([
      '/base/test/plugin/file/geojson/10k.json'
    ], mockMime.testYes(mime.TYPE));
  });

  it('should register itself with mime detection', function() {
    var chain = osFileMime.getTypeChain(mime.TYPE).join(', ');
    expect(chain).toBe('application/octet-stream, text/plain, application/json, application/vnd.geo+json');
  });
});

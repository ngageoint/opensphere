goog.require('os.file.File');
goog.require('os.file.mime.mock');
goog.require('plugin.file.geojson.mime');

describe('os.file.mime.json', function() {
  it('should not detect files that are not json files', function() {
    os.file.mime.mock.testFiles([
      '/base/test/plugin/file/kml/kml_test.xml',
      '/base/test/resources/bin/rand.bin',
      '/base/test/resources/json/partial_object.json'],
        os.file.mime.mock.testNo(plugin.file.geojson.mime.TYPE));
  });

  it('should detect files that are json files', function() {
    os.file.mime.mock.testFiles([
      '/base/test/plugin/file/geojson/10k.json'],
        os.file.mime.mock.testYes(plugin.file.geojson.mime.TYPE));
  });

  it('should register itself with mime detection', function() {
    var chain = os.file.mime.getTypeChain(plugin.file.geojson.mime.TYPE).join(', ');
    expect(chain).toBe('application/octet-stream, text/plain, application/json, application/vnd.geo+json');
  });
});

goog.require('os.file.File');
goog.require('os.file.mime.mock');
goog.require('plugin.file.kml.mime');

describe('plugin.file.kml.mime', function() {
  it('should not detect files that are not kml files', function() {
    os.file.mime.mock.testFiles([
      '/base/test/resources/xml/namespaced-root-partial.xml',
      '/base/test/resources/xml/comment-with-embedded-xml.xml'],
        os.file.mime.mock.testNo(plugin.file.kml.mime.TYPE));
  });

  it('should detect files that are kml files', function() {
    os.file.mime.mock.testFiles([
      '/base/test/plugin/file/kml/kml_test.xml'],
        os.file.mime.mock.testYes(plugin.file.kml.mime.TYPE));
  });

  it('should register itself with mime detection', function() {
    var chain = os.file.mime.getTypeChain('application/vnd.google-earth.kml+xml').join(', ');
    expect(chain).toBe('application/octet-stream, text/plain, text/xml, application/vnd.google-earth.kml+xml');
  });

  it('should detect files that are kmz files', function() {
    os.file.mime.mock.testFiles(['/base/test/resources/zip/test.kmz'],
        os.file.mime.mock.testYes(plugin.file.kml.mime.KMZ_TYPE), Number.POSITIVE_INFINITY);
  });
});

goog.require('os.file.File');
goog.require('os.file.mime.mock');
goog.require('plugin.file.gpx.mime');

describe('plugin.file.gpx.mime', function() {
  it('should not detect files that are not gpx files', function() {
    os.file.mime.mock.testFiles([
      '/base/test/resources/xml/namespaced-root-partial.xml',
      '/base/test/resources/xml/comment-with-embedded-xml.xml',
      '/base/test/plugin/file/kml/kml_test.xml'],
        os.file.mime.mock.testNo(plugin.file.gpx.mime.TYPE));
  });

  it('should detect files that are gpx files', function() {
    os.file.mime.mock.testFiles([
      '/base/test/resources/gpx/sample.gpx'],
        os.file.mime.mock.testYes(plugin.file.gpx.mime.TYPE));
  });

  it('should register itself with mime detection', function() {
    var chain = os.file.mime.getTypeChain(plugin.file.gpx.mime.TYPE).join(', ');
    expect(chain).toBe('application/octet-stream, text/plain, text/xml, ' + plugin.file.gpx.mime.TYPE);
  });
});

goog.require('os.file.File');
goog.require('os.file.mime');
goog.require('os.file.mime.mock');
goog.require('plugin.file.gpx.mime');

describe('plugin.file.gpx.mime', function() {
  const osFileMime = goog.module.get('os.file.mime');
  const mime = goog.module.get('plugin.file.gpx.mime');

  const mockMime = goog.module.get('os.file.mime.mock');

  it('should not detect files that are not gpx files', function() {
    mockMime.testFiles([
      '/base/test/resources/xml/namespaced-root-partial.xml',
      '/base/test/resources/xml/comment-with-embedded-xml.xml',
      '/base/test/plugin/file/kml/kml_test.xml'
    ], mockMime.testNo(mime.TYPE));
  });

  it('should detect files that are gpx files', function() {
    mockMime.testFiles([
      '/base/test/resources/gpx/sample.gpx'
    ], mockMime.testYes(mime.TYPE));
  });

  it('should register itself with mime detection', function() {
    var chain = osFileMime.getTypeChain(mime.TYPE).join(', ');
    expect(chain).toBe('application/octet-stream, text/plain, text/xml, ' + mime.TYPE);
  });
});

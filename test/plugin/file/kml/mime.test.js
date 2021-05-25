goog.require('os.file.File');
goog.require('os.file.mime');
goog.require('os.file.mime.mock');
goog.require('plugin.file.kml.mime');

describe('plugin.file.kml.mime', function() {
  const osFileMime = goog.module.get('os.file.mime');
  const mime = goog.module.get('plugin.file.kml.mime');
  it('should not detect files that are not kml files', function() {
    osFileMime.mock.testFiles([
      '/base/test/resources/xml/namespaced-root-partial.xml',
      '/base/test/resources/xml/comment-with-embedded-xml.xml'],
        osFileMime.mock.testNo(mime.TYPE));
  });

  it('should detect files that are kml files', function() {
    osFileMime.mock.testFiles([
      '/base/test/plugin/file/kml/kml_test.xml'],
        osFileMime.mock.testYes(mime.TYPE));
  });

  it('should register itself with mime detection', function() {
    var chain = osFileMime.getTypeChain('application/vnd.google-earth.kml+xml').join(', ');
    expect(chain).toBe('application/octet-stream, text/plain, text/xml, application/vnd.google-earth.kml+xml');
  });

  it('should detect files that are kmz files', function() {
    osFileMime.mock.testFiles(['/base/test/resources/zip/test.kmz'],
        osFileMime.mock.testYes(mime.KMZ_TYPE), Number.POSITIVE_INFINITY);
  });
});

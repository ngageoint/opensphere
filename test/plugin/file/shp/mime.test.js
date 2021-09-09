goog.require('os.file.File');
goog.require('os.file.mime');
goog.require('os.file.mime.mock');
goog.require('plugin.file.shp.mime');

describe('plugin.file.shp.mime', function() {
  const osFileMime = goog.module.get('os.file.mime');
  const mime = goog.module.get('plugin.file.shp.mime');

  const mockMime = goog.module.get('os.file.mime.mock');

  it('should not detect files that are not shp files', function() {
    mockMime.testFiles([
      '/base/test/resources/xml/namespaced-root-partial.xml',
      '/base/test/resources/xml/comment-with-embedded-xml.xml'
    ], mockMime.testNo(mime.TYPE));
  });

  it('should detect files that are shp files', function() {
    mockMime.testFiles([
      '/base/test/resources/shp/example.shp',
      '/base/test/resources/shp/example.dbf'
    ], mockMime.testYes(mime.TYPE));
  });

  it('should register itself with mime detection', function() {
    var chain = osFileMime.getTypeChain('application/shapefile').join(', ');
    expect(chain).toBe('application/octet-stream, application/shapefile');
  });

  it('should detect files that are zipped shp files', function() {
    mockMime.testFiles(['/base/test/resources/shp/example.zip'],
        mockMime.testYes(mime.ZIP_TYPE), Number.POSITIVE_INFINITY);
  });
});

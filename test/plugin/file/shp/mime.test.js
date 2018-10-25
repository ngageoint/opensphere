goog.require('os.file.File');
goog.require('os.file.mime.mock');
goog.require('plugin.file.shp.mime');

describe('plugin.file.shp.mime', function() {
  it('should not detect files that are not shp files', function() {
    os.file.mime.mock.testFiles([
      '/base/test/resources/xml/namespaced-root-partial.xml',
      '/base/test/resources/xml/comment-with-embedded-xml.xml'],
        os.file.mime.mock.testNo(plugin.file.shp.mime.TYPE));
  });

  it('should detect files that are shp files', function() {
    os.file.mime.mock.testFiles([
      '/base/test/resources/shp/example.shp',
      '/base/test/resources/shp/example.dbf'],
        os.file.mime.mock.testYes(plugin.file.shp.mime.TYPE));
  });

  it('should register itself with mime detection', function() {
    var chain = os.file.mime.getTypeChain('application/shapefile').join(', ');
    expect(chain).toBe('application/octet-stream, application/shapefile');
  });

  it('should detect files that are zipped shp files', function() {
    os.file.mime.mock.testFiles(['/base/test/resources/shp/example.zip'],
        os.file.mime.mock.testYes(plugin.file.shp.mime.ZIP_TYPE), Number.POSITIVE_INFINITY);
  });
});

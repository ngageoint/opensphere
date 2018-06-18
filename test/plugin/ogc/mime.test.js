goog.require('os.file.mime.mock');
goog.require('plugin.ogc.mime');

describe('plugin.ogc.mime', function() {
  it('should not detect files that are not OGC Server files', function() {
    os.file.mime.mock.testFiles([
      '/base/test/plugin/file/kml/kml_test.xml',
      '/base/test/resources/bin/rand.bin',
      '/base/test/resources/json/partial_object.json'],
        os.file.mime.mock.testNo(os.ogc.ID));
  });

  it('should detect files that are OGC Server files', function() {
    os.file.mime.mock.testFiles([
      '/base/test/resources/ogc/wms-130.xml',
      '/base/test/resources/ogc/wms-111.xml',
      '/base/test/resources/ogc/wfs-200.xml', // we don't support WFS 2.0.0 but we do detect it as an OGC server
      '/base/test/resources/ogc/wfs-110.xml',
      '/base/test/resources/ogc/exception-report.xml'],
        os.file.mime.mock.testYes(os.ogc.ID));
  });

  it('should register itself with mime detection', function() {
    var chain = os.file.mime.getTypeChain(os.ogc.ID).join(', ');
    expect(chain).toBe('application/octet-stream, text/plain, text/xml, ' + os.ogc.ID);
  });
});

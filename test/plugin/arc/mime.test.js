goog.require('os.file.mime.mock');
goog.require('plugin.arc.mime');

describe('plugin.arc.mime', function() {
  it('should not detect files that are not ArcGIS Server files', function() {
    os.file.mime.mock.testFiles([
      '/base/test/plugin/file/kml/kml_test.xml',
      '/base/test/resources/bin/rand.bin',
      '/base/test/resources/json/partial_object.json',
      '/base/test/resources/ogc/wms-130.xml',
      '/base/test/resources/ogc/wms-111.xml',
      '/base/test/resources/ogc/wfs-200.xml',
      '/base/test/resources/ogc/wfs-110.xml',
      '/base/test/resources/ogc/exception-report.xml'],
        os.file.mime.mock.testNo(plugin.arc.ID));
  });

  it('should detect files that are ArcGIS Server files', function() {
    os.file.mime.mock.testFiles(['/base/test/resources/arc/arc.html'],
        os.file.mime.mock.testYes(plugin.arc.ID));
  });

  it('should register itself with mime detection', function() {
    var chain = os.file.mime.getTypeChain(plugin.arc.ID).join(', ');
    expect(chain).toBe('application/octet-stream, text/plain, text/html, ' + plugin.arc.ID);
  });
});

goog.require('os.file.mime');
goog.require('os.file.mime.mock');
goog.require('plugin.arc');
goog.require('plugin.arc.mime');

describe('plugin.arc.mime', function() {
  const mime = goog.module.get('os.file.mime');
  const arc = goog.module.get('plugin.arc');
  const {registerMimeTypes} = goog.module.get('plugin.arc.mime');

  registerMimeTypes();

  it('should not detect files that are not ArcGIS Server files', function() {
    mime.mock.testFiles([
      '/base/test/plugin/file/kml/kml_test.xml',
      '/base/test/resources/bin/rand.bin',
      '/base/test/resources/json/partial_object.json',
      '/base/test/resources/ogc/wms-130.xml',
      '/base/test/resources/ogc/wms-111.xml',
      '/base/test/resources/ogc/wfs-200.xml',
      '/base/test/resources/ogc/wfs-110.xml',
      '/base/test/resources/ogc/exception-report.xml',
      // Test URL-based detection. "arcgis" is a positive match, but "/wmsserver" should be negative.
      '/base/test/resources/arc/arcgis/wmsserver/wms-130.xml',
      // Similarly, "arcgis" is a positive match, but "service=WMS" should be negative.
      '/base/test/resources/arc/arcgis/wms-130.xml?service=WMS&request=GetCapabilities'
    ], mime.mock.testNo(arc.ID));
  });

  it('should detect files that are ArcGIS Server files', function() {
    mime.mock.testFiles(['/base/test/resources/arc/arc.html'],
        mime.mock.testYes(arc.ID));
  });

  it('should register itself with mime detection', function() {
    var chain = mime.getTypeChain(arc.ID).join(', ');
    expect(chain).toBe('application/octet-stream, text/plain, text/html, ' + arc.ID);
  });
});

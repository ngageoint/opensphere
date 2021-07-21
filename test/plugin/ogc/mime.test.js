goog.require('os.file.mime');
goog.require('os.file.mime.mock');
goog.require('os.ogc');
goog.require('plugin.ogc.mime');

describe('plugin.ogc.mime', function() {
  const mime = goog.module.get('os.file.mime');
  const ogc = goog.module.get('os.ogc');

  const mockMime = goog.module.get('os.file.mime.mock');

  it('should not detect files that are not OGC Server files', function() {
    mockMime.testFiles([
      '/base/test/plugin/file/kml/kml_test.xml',
      '/base/test/resources/bin/rand.bin',
      '/base/test/resources/json/partial_object.json'
    ], mockMime.testNo(ogc.ID));
  });

  it('should detect files that are OGC Server files', function() {
    mockMime.testFiles([
      '/base/test/resources/ogc/wms-130.xml',
      '/base/test/resources/ogc/wms-111.xml',
      '/base/test/resources/ogc/wmts-100.xml',
      '/base/test/resources/ogc/wfs-200.xml', // we don't support WFS 2.0.0 but we do detect it as an OGC server
      '/base/test/resources/ogc/wfs-110.xml',
      '/base/test/resources/ogc/exception-report.xml'
    ], mockMime.testYes(ogc.ID));
  });

  it('should register itself with mime detection', function() {
    var chain = mime.getTypeChain(ogc.ID).join(', ');
    expect(chain).toBe('application/octet-stream, text/plain, text/xml, ' + ogc.ID);
  });
});

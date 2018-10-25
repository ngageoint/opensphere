goog.require('os.file.File');
goog.require('os.file.mime.mock');
goog.require('plugin.georss.mime');

describe('plugin.georss.mime', function() {
  it('should detect Atom feeds as GeoRSS', function() {
    var feed = '<?xml version="1.0" encoding="utf-8"?>' +
      '<feed xmlns="http://www.w3.org/2005/Atom"/>';

    var buffer = new TextEncoder().encode(feed);

    // pretend this came from a file
    var file = new os.file.File();
    file.setFileName('something.georss');
    file.setUrl(file.getFileName());

    var testFunc = os.file.mime.mock.testYes(plugin.georss.mime.TYPE);
    testFunc(buffer, file);
  });

  it('should not detect other XML as GeoRSS', function() {
    var xml = '<?xml version="1.0" encoding="utf-8"?><something xmlns="http://something.com/schema"/>';
    var buffer = new TextEncoder().encode(xml);

    // pretend this came from a file
    var file = new os.file.File();
    file.setFileName('something.xml');
    file.setUrl(file.getFileName());

    var testFunc = os.file.mime.mock.testNo(plugin.georss.mime.TYPE);
    testFunc(buffer, file);
  });

  it('should register itself with mime detection', function() {
    var chain = os.file.mime.getTypeChain(plugin.georss.mime.TYPE).join(', ');
    expect(chain).toBe('application/octet-stream, text/plain, text/xml, ' + plugin.georss.mime.TYPE);
  });
});

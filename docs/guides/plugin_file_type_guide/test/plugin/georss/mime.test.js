goog.require('os.file.File');
goog.require('os.file.mime.mock');
goog.require('plugin.georss.mime');

describe('plugin.georss.mime', function() {
  const {default: OSFile} = goog.module.get('os.file.File');
  const {testNo, testYes} = goog.module.get('os.file.mime.mock');
  const {TYPE} = goog.module.get('plugin.georss.mime');

  it('should detect Atom feeds as GeoRSS', function() {
    var feed = '<?xml version="1.0" encoding="utf-8"?>' +
      '<feed xmlns="http://www.w3.org/2005/Atom"/>';

    var buffer = new TextEncoder().encode(feed).buffer;

    // pretend this came from a file
    var file = new OSFile();
    file.setFileName('something.georss');
    file.setUrl(file.getFileName());

    var testFunc = testYes(TYPE);
    testFunc(buffer, file);
  });

  it('should not detect other XML as GeoRSS', function() {
    var xml = '<?xml version="1.0" encoding="utf-8"?><something xmlns="http://something.com/schema"/>';
    var buffer = new TextEncoder().encode(xml).buffer;

    // pretend this came from a file
    var file = new OSFile();
    file.setFileName('something.xml');
    file.setUrl(file.getFileName());

    var testFunc = testNo(TYPE);
    testFunc(buffer, file);
  });

  it('should register itself with mime detection', function() {
    var chain = os.file.mime.getTypeChain(TYPE).join(', ');
    expect(chain).toBe('application/octet-stream, text/plain, text/xml, ' + TYPE);
  });
});

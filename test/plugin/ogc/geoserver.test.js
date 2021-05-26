goog.require('os.file.File');
goog.require('os.ui.ogc.OGCServer');
goog.require('plugin.ogc.GeoServer');


describe('plugin.ogc.GeoServer', function() {
  const GeoServer = goog.module.get('plugin.ogc.GeoServer');

  var serverLabel = 'test-server';
  var serverUrl = 'http://im.a.test.server/wahoo/';
  var dateFormat = 'im-a-date';
  var timeFormat = 'youre-a-date';

  var serverConfig1 = {
    'label': serverLabel,
    'enabled': true,
    'url': serverUrl
  };

  var serverConfig2 = {
    'label': serverLabel,
    'enabled': true,
    'url': serverUrl,
    'wmsTimeFormat': timeFormat,
    'wmsDateFormat': dateFormat,
    'wfsContentType': 'text/plain'
  };

  it('should initialize properly from config', function() {
    var server = new GeoServer();
    server.configure(serverConfig1);

    expect(server.getLabel()).toBe(serverLabel);
    expect(server.getEnabled()).toBe(true);

    expect(server.getWmsUrl()).toBe(serverUrl);
    expect(server.getOriginalWmsUrl()).toBe(serverUrl);
    expect(server.getWfsUrl()).toBe(serverUrl);
    expect(server.getOriginalWfsUrl()).toBe(serverUrl);
    expect(server.getWpsUrl()).toBe('');

    expect(server.getWmsTimeFormat()).toBe('{start}/{end}');
    expect(server.getWmsDateFormat()).toBe('YYYY-MM-DDTHH:mm:ss[Z]');

    expect(server.getWfsContentType()).toBe('text/xml');

    server.configure(serverConfig2);
    expect(server.getWmsTimeFormat()).toBe(timeFormat);
    expect(server.getWmsDateFormat()).toBe(dateFormat);

    expect(server.getWfsContentType()).toBe('text/plain');
  });
});

goog.require('os.file.File');
goog.require('os.ui.ogc.OGCServer');
goog.require('plugin.ogc.GeoServer');


describe('plugin.ogc.GeoServer', function() {
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
    'wmsDateFormat': dateFormat
  };

  it('should initialize properly from config', function() {
    var server = new plugin.ogc.GeoServer();
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

    server.configure(serverConfig2);
    expect(server.getWmsTimeFormat()).toBe(timeFormat);
    expect(server.getWmsDateFormat()).toBe(dateFormat);
  });

  it('should detect Geoserver server instances from files', function() {
    var file = new os.file.File();
    file.setUrl('https://www.example.com/geoserver');
    expect(plugin.ogc.GeoServer.isGeoserverResponse(file)).toBe(5);
    file.setUrl('https://www.example.com/geoserver/');
    expect(plugin.ogc.GeoServer.isGeoserverResponse(file)).toBe(5);
    file.setUrl('https://www.example.com/geoserver/ows');
    expect(plugin.ogc.GeoServer.isGeoserverResponse(file)).toBe(5);
    file.setUrl('https://www.example.com/geoserver/web');
    expect(plugin.ogc.GeoServer.isGeoserverResponse(file)).toBe(5);
    // Removed this detection because it is far too liberal. If we ever need content-based GeoServer detection,
    // we can reimplement it smarter.
    // file.setContent('<WMS_Capabilities><abstract>GeoServer</abstract></WMS_Capabilities>');
    // expect(plugin.ogc.GeoServer.isGeoserverResponse(file)).toBe(10);
    expect(plugin.ogc.GeoServer.isGeoserverResponse(file) > os.ui.ogc.OGCServer.isOGCResponse(file)).toBe(true);
  });

  it('should detect Geoserver instances from more specific URLs', function() {
    var file = new os.file.File();
    file.setUrl('https://www.example.com/geoserver/ows?thisother=thing');
    expect(plugin.ogc.GeoServer.isGeoserverResponse(file)).toBe(5);
  });
});
